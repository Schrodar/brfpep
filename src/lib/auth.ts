/**
 * =============================================================================
 * AUTENTISERING (Supabase Auth)
 * =============================================================================
 * Sessionen hanteras av Supabase Auth via @supabase/ssr (cookies refreshas i
 * src/middleware.ts). Profilen – roll och godkännandestatus – ligger i vår egen
 * Member-tabell och kopplas till auth-användaren via e-postadressen.
 *
 * getCurrentUser() cachas per request (React cache) så att den bara gör ett
 * getUser()-anrop även om flera guards körs på samma sida.
 */

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { CurrentUser } from "@/lib/types";
import { getMemberByEmail } from "@/lib/data";
import {
  getActiveSupportSession,
  SUPPORT_COOKIE,
  type ActiveSupportSession,
} from "@/lib/data/support";
import { markSupportRequest } from "@/lib/support-log";
import {
  DemoReadOnlyError,
  hasDemoAdminCookie,
  isServerAction,
  markDemoRequest,
} from "@/lib/demo-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Inloggad användare (Supabase-session + Member-profil). Null om utloggad. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email;
  if (!email) return null;

  const member = await getMemberByEmail(email);
  if (!member) return null;

  return {
    id: member.id,
    email: member.email,
    fullName: member.fullName,
    apartment: member.apartment,
    role: member.role,
    status: member.status,
    canManageListing: member.canManageListing,
  };
});

/** Kräver inloggning. Omdirigerar annars till inloggningssidan. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/logga-in");
  return user;
}

/**
 * Plattformsadmins pågående supportsession, om någon. Cachad per request, men
 * kontrollerad mot databasen varje gång – ett avslut slår därför igenom direkt,
 * även i en flik som redan står öppen.
 */
export const getSupportSession = cache(
  async (): Promise<ActiveSupportSession | null> => {
    const value = (await cookies()).get(SUPPORT_COOKIE)?.value;
    return value ? getActiveSupportSession(value) : null;
  },
);

/**
 * Den inloggade under ett supportläge. Här finns INGEN Member-rad bakom, så
 * id:t är inget medlems-id: ingen admin-action får använda user.id som främmande
 * nyckel mot Member. I dag används bara fullName, som författare i
 * felanmälningarnas historik – vilket ger rätt spårbarhet.
 */
function supportUser(session: ActiveSupportSession): CurrentUser {
  return {
    id: `support:${session.id}`,
    email: session.adminEmail,
    fullName: `${session.adminName} (support)`,
    apartment: "",
    role: "admin",
    status: "approved",
    canManageListing: false,
  };
}

/**
 * Kräver godkänd admin (styrelsen) eller ett pågående supportläge. Rollen räcker
 * inte ensam: en admin-rad som inte är godkänd – eller har spärrats – ska inte
 * öppna adminpanelen.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user?.role === "admin" && user.status === "approved") return user;

  const support = await getSupportSession();
  if (support) {
    // Från och med nu loggas requestens skrivningar i supportloggen.
    markSupportRequest({
      sessionId: support.id,
      platformAdminId: support.platformAdminId,
      adminEmail: support.adminEmail,
    });
    return supportUser(support);
  }

  // Demons visningsläge (src/lib/demo-admin.ts): adminpanelen går att se,
  // men varje försök att spara stoppas här – innan actionen gjort något.
  if (await hasDemoAdminCookie()) {
    if (await isServerAction()) throw new DemoReadOnlyError();
    markDemoRequest();
    return DEMO_USER;
  }

  if (!user) redirect("/logga-in?next=/admin");
  redirect("/medlem");
}

/**
 * Besökaren i demons visningsläge. Ingen Member-rad finns bakom och id:t är
 * inget medlems-id – men det spelar ingen roll, eftersom inget sparas.
 */
const DEMO_USER: CurrentUser = {
  id: "demo",
  email: "",
  fullName: "Demo – visningsläge",
  apartment: "",
  role: "admin",
  status: "approved",
  canManageListing: false,
};

/** Visas adminpanelen i demons visningsläge? (för bannern i adminlayouten) */
export async function isDemoAdminView(): Promise<boolean> {
  const user = await getCurrentUser();
  if (user?.role === "admin" && user.status === "approved") return false;
  if (await getSupportSession()) return false;
  return hasDemoAdminCookie();
}

/**
 * Kräver godkänd medlem – även admins måste vara godkända. Väntande konton
 * skickas till en informationssida.
 */
export async function requireApprovedMember(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/logga-in?next=/medlem");
  if (user.status !== "approved") redirect("/medlem/vantar");
  return user;
}
