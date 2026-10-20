import { NextResponse } from "next/server";
import { DEMO_ADMIN_COOKIE, demolageAktivt } from "@/lib/demo";

/**
 * Ingången till demons visningsläge (src/lib/demo-admin.ts).
 *
 *   /admin/demo           sätter cookien och öppnar adminpanelen
 *   /admin/demo?avsluta   tar bort cookien och går tillbaka till startsidan
 *
 * Finns bara när DEMO_MODE=true – annars 404, som vilken okänd adress som helst.
 *
 * Omdirigeringen är relativ (Location: /admin). Bakom Coolifys proxy kan
 * request.url peka på containerns interna adress, och en absolut adress byggd
 * på den skulle skicka besökaren fel – en relativ fungerar på vilken domän
 * demon än ligger.
 */

export const dynamic = "force-dynamic";

function redirectTo(path: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

export async function GET(request: Request) {
  if (!demolageAktivt()) {
    return new NextResponse("Hittades inte", { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.has("avsluta")) {
    const response = redirectTo("/");
    response.cookies.delete(DEMO_ADMIN_COOKIE);
    return response;
  }

  const https =
    request.headers.get("x-forwarded-proto") === "https" ||
    url.protocol === "https:";
  const response = redirectTo("/admin");
  response.cookies.set(DEMO_ADMIN_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    secure: https,
    // Webbläsaren läser cookien för att visa rätt text när något inte sparas
    // (admin/error.tsx). Den är ingen hemlighet – se demo-admin.ts.
    httpOnly: false,
    maxAge: 60 * 60 * 24,
  });
  return response;
}
