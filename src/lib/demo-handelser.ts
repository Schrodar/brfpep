import { prisma } from "@/lib/prisma";

/**
 * Demons händelselogg för säljet. Två slags händelser sparas:
 *
 *   öppnad   en personlig demolänk från säljbrevet öppnades (src/app/api/demo-lank)
 *   kontakt  någon skickade den guidade visningens kontaktformulär (src/app/api/demo-kontakt)
 *
 * Webcrawlern hämtar dem med GET /api/demo-handelser och kopplar dem till rätt förening
 * via länkens signatur. En öppning sparar föreningens namn, signaturen och tiden – ingen
 * IP-adress, webbläsare eller sidvisning. Händelser äldre än ett år tas bort.
 *
 * Tabellen jnm.demohandelser ligger i demons egen Postgres, men i ett eget schema utanför
 * Prisma-schemat: schemat ägs av BrfStart, och demo:db:push och demo:import rör bara
 * schemat public. Tabellen skapas första gången den behövs.
 */

export type Handelsetyp = "öppnad" | "kontakt";

export interface Handelse {
  id: number;
  /** ISO 8601 i UTC. */
  tid: string;
  typ: Handelsetyp;
  /** Föreningens namn: från länken vid en öppning, från formulärets fält vid en kontakt. */
  namn: string | null;
  /** Den personliga länkens signatur, eller null om besökaren inte kom via en länk. */
  signatur: string | null;
  /** Troligen en länkskanner eller förhandsvisning, inte en människa (se troligRobot). */
  robot: boolean;
  /** Kontaktformulärets fält. */
  uppgifter: Record<string, string> | null;
}

const TIDSGRANS_MS = 2000;

let tabellen: Promise<void> | null = null;

function skapaTabellen(): Promise<void> {
  tabellen ??= (async () => {
    await prisma.$executeRawUnsafe("CREATE SCHEMA IF NOT EXISTS jnm");
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS jnm.demohandelser (
      id bigserial PRIMARY KEY,
      tid timestamptz NOT NULL DEFAULT now(),
      typ text NOT NULL,
      namn text,
      signatur text,
      robot boolean NOT NULL DEFAULT false,
      uppgifter jsonb
    )`);
  })().catch((fel: unknown) => {
    tabellen = null; // nästa anrop försöker igen
    throw fel;
  });
  return tabellen;
}

/** Väntar högst ms millisekunder på löftet; därefter kastas ett fel (arbetet fortsätter i bakgrunden). */
async function medTidsgrans<T>(lofte: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const gransen = new Promise<never>((_, avvisa) => {
    timer = setTimeout(() => avvisa(new Error(`databasen svarade inte inom ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([lofte, gransen]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sparar en händelse. Kastar aldrig och väntar högst två sekunder: länken och formuläret
 * ska fungera även när databasen inte svarar.
 */
export async function noteraHandelse(handelse: {
  typ: Handelsetyp;
  namn: string | null;
  signatur: string | null;
  robot?: boolean;
  uppgifter?: Record<string, string>;
}): Promise<void> {
  const { typ, namn, signatur, robot = false, uppgifter } = handelse;
  const arbete = (async () => {
    await skapaTabellen();
    await prisma.$executeRaw`INSERT INTO jnm.demohandelser (typ, namn, signatur, robot, uppgifter)
      VALUES (${typ}, ${namn}, ${signatur}, ${robot}, ${uppgifter ? JSON.stringify(uppgifter) : null}::jsonb)`;
    await prisma.$executeRawUnsafe("DELETE FROM jnm.demohandelser WHERE tid < now() - interval '1 year'");
  })();
  try {
    await medTidsgrans(arbete, TIDSGRANS_MS);
  } catch (fel) {
    console.error(`[demo-handelser] Händelsen (${typ}) sparades inte:`, fel);
  }
}

interface Rad {
  id: bigint;
  tid: Date;
  typ: Handelsetyp;
  namn: string | null;
  signatur: string | null;
  robot: boolean;
  uppgifter: Record<string, string> | null;
}

/** Händelserna efter ett id, äldst först. mer är sant om det finns fler än antal. */
export async function hamtaHandelser(efter: number, antal: number): Promise<{ handelser: Handelse[]; mer: boolean }> {
  await skapaTabellen();
  const rader = await prisma.$queryRaw<Rad[]>`SELECT id, tid, typ, namn, signatur, robot, uppgifter
    FROM jnm.demohandelser WHERE id > ${efter}::bigint ORDER BY id LIMIT ${antal + 1}::int`;
  return {
    handelser: rader.slice(0, antal).map((rad) => ({ ...rad, id: Number(rad.id), tid: rad.tid.toISOString() })),
    mer: rader.length > antal,
  };
}

/*
 * Mejlservrar och chattappar hämtar länkar för att leta skadlig kod eller visa en
 * förhandsvisning. Sådana hämtningar sparas men märks, så att webcrawlern inte tar dem för
 * en styrelse som tittat. Mönstren gäller verktygen, inte appar där en människa läser
 * (Outlooks och LinkedIns inbyggda webbläsare räknas alltså). "Cubot" är ett mobilmärke.
 */
const ROBOT_RE =
  /(?<!cu)bot\b|crawl|spider|slurp|preview|scanner|headless|phantom|lighthouse|python|curl\/|wget|go-http|java\/|okhttp|axios|node-fetch|undici|facebookexternalhit|whatsapp\/|ms-office|microsoft office|safelinks|proofpoint|mimecast|barracuda|google-safety/i;

/** Sant om förfrågan troligen kommer från ett program och inte från en människa. */
export function troligRobot(headers: Headers): boolean {
  const ua = headers.get("user-agent") ?? "";
  if (!ua || ROBOT_RE.test(ua)) return true;
  const syfte = `${headers.get("sec-purpose") ?? ""} ${headers.get("purpose") ?? ""}`.toLowerCase();
  if (syfte.includes("prefetch") || syfte.includes("prerender")) return true;
  // En människa som klickar på länken navigerar; webbläsare utan Sec-Fetch (äldre Safari) godtas.
  const lage = headers.get("sec-fetch-mode");
  return lage !== null && lage !== "navigate";
}
