import { NextResponse, type NextRequest } from "next/server";
import {
  DEMO_COOKIE,
  DEMO_FAKTA_COOKIE,
  DEMO_LANK_COOKIE,
  demolageAktivt,
  FAKTA_PARAMETRAR,
  FAKTA_SIGNATUR,
  faktaCookie,
  faktaUrLank,
  lankbevis,
  stadaNamn,
  verifieraDemolank,
  verifieraFakta,
} from "@/lib/demo";
import { noteraHandelse, troligRobot } from "@/lib/demo-handelser";

export const dynamic = "force-dynamic";

const TRETTIO_DAGAR = 60 * 60 * 24 * 30;

/**
 * Säljbrevets personliga länk, /?f=<namn>&s=<signatur>. Proxyn skriver om startsidan hit när
 * adressen har f och s (se src/proxy.ts och src/lib/demo.ts).
 *
 * En äkta länk sätter cookien med föreningens namn och noteras i demons händelselogg
 * (src/lib/demo-handelser.ts), så att webcrawlern ser vilka föreningar som tittat. Länkar med
 * prov=1 kommer från webcrawlerns förhandsvisningar och testmejl och noteras inte. Besökaren
 * skickas sedan till startsidan utan parametrarna. Adressen är relativ, eftersom request.url
 * bakom proxyn i Coolify är serverns egen adress.
 *
 * Länken kan också ha föreningens adress och organisationsnummer (a, pn, o, n) med en egen
 * signatur (t), se DemoFakta. De sparas i en egen cookie bara när den signaturen stämmer.
 *
 * Ett program som hämtar länken för en förhandsvisning (en chatt, Teams, Slack …) följer inte
 * med cookies till startsidan och skulle då visa demoföreningens namn. Det får i stället en
 * liten sida med föreningens eget namn i rubriken (se forhandsvisning).
 */
export async function GET(request: NextRequest) {
  return demolank(request, true);
}

/** En HEAD-förfrågan är aldrig en människa: samma svar, men ingenting noteras. */
export async function HEAD(request: NextRequest) {
  return demolank(request, false);
}

async function demolank(request: NextRequest, notera: boolean) {
  const params = request.nextUrl.searchParams;
  const namn = params.get("f");
  const sig = params.get("s");

  const ovriga = new URLSearchParams(params);
  for (const parameter of ["f", "s", "prov", FAKTA_SIGNATUR, ...FAKTA_PARAMETRAR.map(([p]) => p)]) {
    ovriga.delete(parameter);
  }
  const resten = ovriga.toString();
  const adress = resten ? `/?${resten}` : "/";

  const hemlighet = process.env.DEMO_LINK_SECRET ?? "";
  if (!demolageAktivt() || namn === null || sig === null || !(await verifieraDemolank(namn, sig, hemlighet))) {
    return vidare(adress);
  }
  const robot = troligRobot(request.headers);
  const response = robot && notera ? forhandsvisning(request, stadaNamn(namn), adress) : vidare(adress);

  const https = (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol).startsWith("https");
  const cookie = { path: "/", sameSite: "lax" as const, secure: https, maxAge: TRETTIO_DAGAR };
  // Next kodar själv värdet (encodeURIComponent); useDemoForening avkodar. Läses av
  // webbläsaren, därför inte httpOnly.
  response.cookies.set(DEMO_COOKIE, stadaNamn(namn), { ...cookie, httpOnly: false });
  // Adressen och organisationsnumret följer bara med när deras signatur stämmer. Annars tas en
  // tidigare länks uppgifter bort, så att en annan förenings adress aldrig visas med det här namnet.
  const fakta = faktaUrLank(params);
  if (fakta && (await verifieraFakta(namn, fakta, params.get(FAKTA_SIGNATUR) ?? "", hemlighet))) {
    response.cookies.set(DEMO_FAKTA_COOKIE, faktaCookie(fakta), { ...cookie, httpOnly: false });
  } else {
    response.cookies.set(DEMO_FAKTA_COOKIE, "", { ...cookie, httpOnly: false, maxAge: 0 });
  }

  if (params.has("prov")) {
    // En förhandsvisning ska aldrig räknas – inte heller ett kontaktformulär som skickas efteråt.
    response.cookies.set(DEMO_LANK_COOKIE, "", { ...cookie, httpOnly: true, maxAge: 0 });
    return response;
  }
  response.cookies.set(DEMO_LANK_COOKIE, await lankbevis(sig, hemlighet), { ...cookie, httpOnly: true });
  if (notera) {
    await noteraHandelse({
      typ: "öppnad",
      namn: stadaNamn(namn),
      signatur: sig.toLowerCase(),
      robot,
    });
  }
  return response;
}

function vidare(adress: string): NextResponse {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: adress, "Cache-Control": "no-store" },
  });
}

/** Sajtens egen adress bakom proxyn i Coolify (request.url är serverns interna adress). */
function ursprung(request: NextRequest): string {
  const forsta = (varde: string | null) => varde?.split(",")[0]?.trim() || null;
  const protokoll = forsta(request.headers.get("x-forwarded-proto")) ?? request.nextUrl.protocol.replace(":", "");
  const vard = forsta(request.headers.get("x-forwarded-host")) ?? request.headers.get("host") ?? request.nextUrl.host;
  return `${protokoll}://${vard}`;
}

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (tecken) => `&#${tecken.charCodeAt(0)};`);
}

/**
 * Sidan som en länkförhandsvisning får: föreningens namn i titeln och en kort beskrivning.
 * Ingen bild – bilderna av demon visar demoföreningens namn. En människa som ändå hamnar här
 * skickas vidare till demon direkt.
 */
function forhandsvisning(request: NextRequest, namn: string, adress: string): NextResponse {
  const titel = `${namn} – så kan er hemsida se ut`;
  const beskrivning = `En demo av hemsidan för ${namn}, med nyheter, felanmälan och dokument samlat på ett ställe.`;
  const till = `${ursprung(request)}${adress}`;
  const html =
    `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>${esc(titel)}</title>` +
    `<meta name="robots" content="noindex,nofollow"><meta name="description" content="${esc(beskrivning)}">` +
    `<meta property="og:type" content="website"><meta property="og:title" content="${esc(titel)}">` +
    `<meta property="og:description" content="${esc(beskrivning)}"><meta property="og:url" content="${esc(till)}">` +
    `<meta name="twitter:card" content="summary"><meta http-equiv="refresh" content="0;url=${esc(adress)}"></head>` +
    `<body><p><a href="${esc(adress)}">${esc(titel)}</a></p></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
