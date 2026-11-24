/**
 * Demoläget: säljbrevets personliga länk (/?f=<namn>&s=<signatur>) gör att demon hälsar
 * föreningen välkommen med dess eget namn.
 *
 * Länken signeras av webcrawlern (mejl.signatur: HMAC-SHA256 i hex, de första 32 tecknen)
 * med DEMO_LINK_SECRET – samma hemlighet ska finnas här. Routen /api/demo-lank (dit proxyn
 * skriver om länken) kontrollerar signaturen på servern och sätter cookien; webbläsaren läser
 * bara namnet. En länk som någon annan hittat på kan alltså aldrig få demon att visa
 * godtycklig text. Routen noterar också att länken öppnades, så att webcrawlern ser vilka
 * föreningar som tittat (se src/lib/demo-handelser.ts).
 *
 * Allt är avstängt om inte DEMO_MODE=true.
 */

export const DEMO_COOKIE = "demo_forening";
/**
 * Bevis på vilken förenings länk besökaren kom från (se lankbevis). httpOnly: bara servern
 * läser det, när kontaktformuläret skickas.
 */
export const DEMO_LANK_COOKIE = "demo_lank";
/** Visningsläget för adminpanelen (se src/lib/demo-admin.ts). */
export const DEMO_ADMIN_COOKIE = "demo_admin";
export const DEMO_MAX_LANGD = 80;
const SIGNATURLANGD = 32;

export function demolageAktivt(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * Föreningen så som demon visar den. I demoläget används inte kortnamnet, så att
 * sidhuvud, meny, sidfot och fliktitel säger samma namn ("Brf Pep", inte "Brf pep").
 * Namnet från en personlig demolänk byts sedan in i webbläsaren: se DemoNamn och
 * DemoTitel i src/components/demo/.
 */
export function somDemon<T extends { shortName: string }>(association: T): T {
  return demolageAktivt() ? { ...association, shortName: "" } : association;
}

/** Namnet visas bara som text: utan kontrolltecken, på en rad och med begränsad längd. */
export function stadaNamn(namn: string): string {
  return namn
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, DEMO_MAX_LANGD);
}

async function signatur(text: string, hemlighet: string): Promise<string> {
  const kodare = new TextEncoder();
  const nyckel = await crypto.subtle.importKey(
    "raw",
    kodare.encode(hemlighet),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", nyckel, kodare.encode(text));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, SIGNATURLANGD);
}

/** Jämförelse i konstant tid, så att svarstiden inte avslöjar hur lik en gissad signatur är. */
export function likaSakert(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let skillnad = 0;
  for (let i = 0; i < a.length; i++) skillnad |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return skillnad === 0;
}

export async function verifieraDemolank(
  namn: string,
  sig: string,
  hemlighet: string,
): Promise<boolean> {
  if (!namn || !hemlighet || sig.length !== SIGNATURLANGD) return false;
  return likaSakert(await signatur(namn, hemlighet), sig.toLowerCase());
}

/*
 * Härledda värden börjar med ett nolltecken, som ett föreningsnamn aldrig innehåller
 * (stadaNamn tar bort kontrolltecken, och webcrawlern signerar bara föreningsnamn). Inget
 * av dem kan därför vara signaturen i en demolänk, och tvärtom.
 */

/**
 * Nyckeln som webcrawlern hämtar demons händelser med (GET /api/demo-handelser). Den
 * härleds ur DEMO_LINK_SECRET, så ingen ny hemlighet behövs. Webcrawlern räknar likadant
 * (demohandelser.api_nyckel).
 */
export function apiNyckel(hemlighet: string): Promise<string> {
  return signatur("\u0000demohandelser", hemlighet);
}

/**
 * Värdet i cookien demo_lank: länkens signatur och en kontrollsumma över den. Namn-cookien
 * kan besökaren ändra själv, men beviset går inte att hitta på utan hemligheten.
 */
export async function lankbevis(sig: string, hemlighet: string): Promise<string> {
  const s = sig.toLowerCase();
  return `${s}.${await signatur(`\u0000lank:${s}`, hemlighet)}`;
}

/** Länkens signatur ur ett giltigt bevis, annars null. */
export async function lasLankbevis(varde: string | undefined, hemlighet: string): Promise<string | null> {
  if (!varde || !hemlighet) return null;
  const [sig, kontroll] = varde.split(".");
  if (!sig || !kontroll || sig.length !== SIGNATURLANGD) return null;
  return likaSakert(await signatur(`\u0000lank:${sig}`, hemlighet), kontroll) ? sig : null;
}
