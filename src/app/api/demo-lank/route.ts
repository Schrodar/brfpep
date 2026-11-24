import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, DEMO_LANK_COOKIE, demolageAktivt, lankbevis, stadaNamn, verifieraDemolank } from "@/lib/demo";
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
  for (const parameter of ["f", "s", "prov"]) ovriga.delete(parameter);
  const resten = ovriga.toString();
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: resten ? `/?${resten}` : "/", "Cache-Control": "no-store" },
  });

  const hemlighet = process.env.DEMO_LINK_SECRET ?? "";
  if (!demolageAktivt() || namn === null || sig === null || !(await verifieraDemolank(namn, sig, hemlighet))) {
    return response;
  }

  const https = (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol).startsWith("https");
  const cookie = { path: "/", sameSite: "lax" as const, secure: https, maxAge: TRETTIO_DAGAR };
  // Next kodar själv värdet (encodeURIComponent); useDemoForening avkodar. Läses av
  // webbläsaren, därför inte httpOnly.
  response.cookies.set(DEMO_COOKIE, stadaNamn(namn), { ...cookie, httpOnly: false });

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
      robot: troligRobot(request.headers),
    });
  }
  return response;
}
