import { NextResponse, type NextRequest } from "next/server";
import { apiNyckel, demolageAktivt, likaSakert } from "@/lib/demo";
import { hamtaHandelser } from "@/lib/demo-handelser";

export const dynamic = "force-dynamic";

const STANDARD_ANTAL = 200;
const STORSTA_ANTAL = 500;

/**
 * Webcrawlerns hämtning av demons händelser (se src/lib/demo-handelser.ts):
 *
 *   GET /api/demo-handelser?efter=<id>&antal=<n>
 *   Authorization: Bearer <nyckel>
 *
 * Nyckeln härleds ur DEMO_LINK_SECRET (apiNyckel i src/lib/demo.ts), så den som har
 * hemligheten i webcrawlerns .env kan hämta. Svaret är händelserna efter id:t, äldst först,
 * och mer: true när det finns fler. Utan demoläge eller hemlighet finns routen inte (404).
 */
export async function GET(request: NextRequest) {
  const hemlighet = process.env.DEMO_LINK_SECRET ?? "";
  if (!demolageAktivt() || !hemlighet) return svar(404, { fel: "Finns inte." });

  const auth = request.headers.get("authorization") ?? "";
  if (!likaSakert(auth, `Bearer ${await apiNyckel(hemlighet)}`)) return svar(401, { fel: "Fel nyckel." });

  const params = request.nextUrl.searchParams;
  const efter = Number(params.get("efter") ?? 0);
  const antal = Number(params.get("antal") ?? STANDARD_ANTAL);
  if (!Number.isSafeInteger(efter) || efter < 0 || !Number.isSafeInteger(antal) || antal < 1) {
    return svar(400, { fel: "efter och antal ska vara heltal." });
  }
  try {
    return svar(200, await hamtaHandelser(efter, Math.min(antal, STORSTA_ANTAL)));
  } catch (fel) {
    console.error("[demo-handelser] Kunde inte läsa händelserna:", fel);
    return svar(503, { fel: "Databasen svarar inte." });
  }
}

function svar(status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
