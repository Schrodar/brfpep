import { NextResponse } from "next/server";
import { byggKontaktmejl, DEMO_KONTAKT_STANDARD, demoKontaktSchema } from "@/lib/demo-kontakt";
import { HONEYPOT_FIELD } from "@/lib/form";

export const dynamic = "force-dynamic";

/**
 * Kontaktformuläret i den guidade visningens avslutning. Skickar ett mejl via
 * Resend till DEMO_KONTAKT_EPOST (annars info@byjnm.se):
 *
 *   RESEND_API_KEY      nyckeln från Resend. Utan den svarar routen 503 och
 *                       formuläret hänvisar till mejladressen i stället.
 *   DEMO_KONTAKT_FRAN   avsändaradressen, på en domän som är verifierad i
 *                       Resend (t.ex. demo@byjnm.se). Utan den används Resends
 *                       testadress, som bara når kontots egen e-post.
 *
 * Skyddet mot spam: bara från den egna sajten, ett osynligt honeypot-fält och
 * högst några inskick per adress och kvart.
 */

const RESEND_URL = "https://api.resend.com/emails";
const FONSTER_MS = 15 * 60 * 1000;
const PER_ADRESS = 5;
const TOTALT = 60;

const inskickPerAdress = new Map<string, number[]>();
let allaInskick: number[] = [];

function svar(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Orsaken visas i formuläret bara vid utveckling – besökare får aldrig se konfigurationen. */
function iUtveckling(detalj: string): { detalj?: string } {
  return process.env.NODE_ENV === "production" ? {} : { detalj };
}

/** Sant om adressen (och sajten som helhet) får skicka ett till just nu. */
function inomGransen(adress: string): boolean {
  const nu = Date.now();
  const farska = (tider: number[]) => tider.filter((t) => nu - t < FONSTER_MS);
  allaInskick = farska(allaInskick);
  const egna = farska(inskickPerAdress.get(adress) ?? []);
  if (egna.length >= PER_ADRESS || allaInskick.length >= TOTALT) return false;
  egna.push(nu);
  allaInskick.push(nu);
  inskickPerAdress.set(adress, egna);
  // Rensa adresser som inte hörts av på länge, så att kartan inte växer.
  if (inskickPerAdress.size > 1000) {
    for (const [nyckel, tider] of inskickPerAdress) {
      if (farska(tider).length === 0) inskickPerAdress.delete(nyckel);
    }
  }
  return true;
}

export async function POST(request: Request) {
  // Bara från den egna sajten.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin) {
    let ursprung: string | null = null;
    try {
      ursprung = new URL(origin).host;
    } catch {
      ursprung = null;
    }
    if (ursprung !== host) return svar(403, { fel: "Inskicket kom inte från sajten." });
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return svar(400, { fel: "Formuläret kunde inte läsas." });
  }

  // Bottar fyller i det osynliga fältet. De får ett vanligt svar, men inget skickas.
  if (typeof data?.[HONEYPOT_FIELD] === "string" && data[HONEYPOT_FIELD] !== "") {
    return svar(200, { ok: true });
  }

  const tolkat = demoKontaktSchema.safeParse(data);
  if (!tolkat.success) {
    return svar(400, { fel: tolkat.error.issues[0]?.message ?? "Kontrollera uppgifterna." });
  }

  const adress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "okand";
  if (!inomGransen(adress)) {
    return svar(429, { fel: "Det har kommit många meddelanden på kort tid. Försök igen om en stund." });
  }

  const nyckel = process.env.RESEND_API_KEY;
  if (!nyckel) {
    console.warn("[demo-kontakt] RESEND_API_KEY saknas – meddelandet skickades inte.");
    return svar(503, { fel: "Formuläret är inte kopplat ännu.", ...iUtveckling("RESEND_API_KEY saknas i miljön.") });
  }

  const mejl = byggKontaktmejl(tolkat.data, {
    till: process.env.DEMO_KONTAKT_EPOST || DEMO_KONTAKT_STANDARD,
    fran: process.env.DEMO_KONTAKT_FRAN || "onboarding@resend.dev",
  });

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${nyckel}`, "Content-Type": "application/json" },
      body: JSON.stringify(mejl),
    });
    // Bara 200 från Resend räknas som framme – då visar formuläret tacket.
    if (res.status !== 200) {
      const text = await res.text().catch(() => "");
      // Resend svarar med JSON: { message, name, statusCode } – visa bara meddelandet.
      let detalj = text.slice(0, 300);
      try {
        detalj = (JSON.parse(text) as { message?: string }).message ?? detalj;
      } catch {
        // Inte JSON – texten som den är.
      }
      console.error(`[demo-kontakt] Resend svarade ${res.status}: ${detalj}`);
      return svar(502, { fel: "Det gick inte att skicka just nu.", ...iUtveckling(`Resend ${res.status}: ${detalj}`) });
    }
    const { id } = (await res.json().catch(() => ({}))) as { id?: string };
    console.info(`[demo-kontakt] Skickat via Resend${id ? ` (id ${id})` : ""}.`);
  } catch (fel) {
    console.error("[demo-kontakt] Kunde inte nå Resend:", fel);
    return svar(502, { fel: "Det gick inte att skicka just nu.", ...iUtveckling(`Kunde inte nå Resend: ${String(fel)}`) });
  }

  return svar(200, { ok: true });
}
