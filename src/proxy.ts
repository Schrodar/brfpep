import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, demolageAktivt, stadaNamn, verifieraDemolank } from "@/lib/demo";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Hette tidigare middleware.ts. Next 16 har döpt om konventionen till proxy:
 * middleware-filen ger en deprecation-varning, och finns båda filerna samtidigt
 * avbryts bygget. Next letar efter en export som heter `proxy` eller en
 * default-export.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") return demolank(request);
  return await updateSession(request);
}

/**
 * Startsidan i demoläget (se src/lib/demo.ts): en signerad länk från säljbrevet sätter en
 * cookie med föreningens namn och skickas vidare till en ren adress. Allt annat passerar
 * direkt, utan att sessionen läses – startsidan är statisk och ska förbli det.
 */
async function demolank(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const namn = searchParams.get("f");
  const sig = searchParams.get("s");
  if (!demolageAktivt() || namn === null || sig === null) return NextResponse.next();

  const ren = request.nextUrl.clone();
  ren.searchParams.delete("f");
  ren.searchParams.delete("s");
  const response = NextResponse.redirect(ren);
  if (await verifieraDemolank(namn, sig, process.env.DEMO_LINK_SECRET ?? "")) {
    // Next kodar själv värdet (encodeURIComponent); useDemoForening avkodar.
    response.cookies.set(DEMO_COOKIE, stadaNamn(namn), {
      path: "/",
      sameSite: "lax",
      secure: ren.protocol === "https:",
      // Läses av webbläsaren (se useDemoForening), därför inte httpOnly.
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export const config = {
  /*
   * Bara där servern läser sessionen. De publika sidorna är statiska och
   * cachade – där förnyar webbläsarklienten sin egen session, och ingen
   * funktion behöver väckas. /felanmalan för inskicket (server action:en
   * kopplar ärendet till kontot). Startsidan ("/") bara för demoläget –
   * proxyn släpper igenom den direkt utan demolänk.
   */
  matcher: [
    "/",
    "/admin/:path*",
    "/medlem/:path*",
    "/logga-in",
    "/felanmalan",
    "/api/me",
    "/dokument/:id/ladda-ner",
    "/tavla/forhandsvisning",
  ],
};
