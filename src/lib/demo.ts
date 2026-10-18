/**
 * Demoläget: säljbrevets personliga länk (/?f=<namn>&s=<signatur>) gör att demon hälsar
 * föreningen välkommen med dess eget namn.
 *
 * Länken signeras av webcrawlern (mejl.signatur: HMAC-SHA256 i hex, de första 32 tecknen)
 * med DEMO_LINK_SECRET – samma hemlighet ska finnas här. Proxyn kontrollerar signaturen på
 * servern och sätter cookien; webbläsaren läser bara namnet. En länk som någon annan hittat
 * på kan alltså aldrig få demon att visa godtycklig text.
 *
 * Allt är avstängt om inte DEMO_MODE=true.
 */

export const DEMO_COOKIE = "demo_forening";
export const DEMO_MAX_LANGD = 80;
const SIGNATURLANGD = 32;

export function demolageAktivt(): boolean {
  return process.env.DEMO_MODE === "true";
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
function likaSakert(a: string, b: string): boolean {
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
