import { NextResponse, type NextRequest } from "next/server";
import { demolageAktivt } from "@/lib/demo";
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
 * Startsidan i demoläget (se src/lib/demo.ts): säljbrevets personliga länk (/?f=…&s=…)
 * skrivs om till routen /api/demo-lank. Den kontrollerar signaturen, sätter cookien med
 * föreningens namn, noterar öppningen i databasen och skickar vidare till en ren adress.
 * Allt annat passerar direkt, utan att sessionen läses – startsidan är statisk och ska
 * förbli det.
 */
function demolank(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  if (!demolageAktivt() || !searchParams.has("f") || !searchParams.has("s")) return NextResponse.next();
  const route = request.nextUrl.clone();
  route.pathname = "/api/demo-lank";
  return NextResponse.rewrite(route);
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
