import { NextResponse } from "next/server";
import { getPublicFloorPlanPath } from "@/lib/data";
import { BUCKET_FLOORPLANS, getSignedUrl } from "@/lib/storage";

/**
 * Planritningen för en publicerad annons.
 *
 * Filerna ligger i en PRIVAT bucket och nås bara via en kortlivad signerad URL
 * som genereras här, vid varje klick. Samma mönster som nedladdningen av
 * föreningsdokument: en signerad URL får aldrig renderas i sidan, eftersom den
 * går ut efter en timme och då ger en död länk.
 *
 * Uppslaget är tenant-scopat och kräver att annonsen är publicerad och att
 * planritningen är markerad som publik – annars 404.
 */

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const path = await getPublicFloorPlanPath(id);
  if (!path) return new NextResponse("Hittades inte", { status: 404 });

  const url = await getSignedUrl(BUCKET_FLOORPLANS, path);
  if (!url) {
    return new NextResponse("Planritningen kunde inte hämtas", { status: 502 });
  }

  // Demons filer (DEMO_FILER=statiska) har en relativ adress, som skickas som
  // den är: bakom proxyn i Coolify är request.url serverns egen adress
  // (0.0.0.0:3000), och en redirect dit når aldrig fram.
  if (url.startsWith("/")) {
    return new NextResponse(null, { status: 307, headers: { Location: url } });
  }
  return NextResponse.redirect(url);
}
