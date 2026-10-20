import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEMO_ADMIN_COOKIE, demolageAktivt } from "@/lib/demo";

/**
 * Visningsläget för adminpanelen i demon (se README → Demoläge).
 *
 * En besökare som öppnar /admin/demo får cookien demo_admin och ser styrelsens
 * adminpanel utan att logga in – men inget går att spara. Cookien är ingen
 * hemlighet: den ger bara tillgång till samma skrivskyddade vy som knappen i
 * demon, och bara när DEMO_MODE=true.
 *
 * Skrivskyddet ligger på två ställen:
 *   1. requireAdmin() stoppar varje server action i visningsläget innan den
 *      hunnit göra något – även sådant som inte går via databasen, som att ta
 *      bort ett inloggningskonto eller ladda upp en fil till lagringen.
 *   2. Tenant-klienten vägrar alla skrivningar under en request i
 *      visningsläget, som ett extra skydd om något skulle slinka förbi.
 */

/** Meddelandet besökaren ser när hen försöker spara. */
export const DEMO_READONLY_MESSAGE =
  "Det här är en demo – ändringar sparas inte.";

/** Felet som stoppar sparandet. Felgränsen i admin känner igen visningsläget. */
export class DemoReadOnlyError extends Error {
  constructor() {
    super(DEMO_READONLY_MESSAGE);
    this.name = "DemoReadOnlyError";
  }
}

const requestState = cache(() => ({ readOnly: false }));

/** Requesten körs i visningsläget – tenant-klienten vägrar då att skriva. */
export function markDemoRequest(): void {
  requestState().readOnly = true;
}

export function isDemoReadOnly(): boolean {
  return requestState().readOnly;
}

/** Har besökaren öppnat visningsläget? Alltid nej utan DEMO_MODE. */
export async function hasDemoAdminCookie(): Promise<boolean> {
  if (!demolageAktivt()) return false;
  return (await cookies()).get(DEMO_ADMIN_COOKIE)?.value === "1";
}

/** Är det här en server action (ett försök att spara) och inte en sidvisning? */
export async function isServerAction(): Promise<boolean> {
  return (await headers()).has("next-action");
}
