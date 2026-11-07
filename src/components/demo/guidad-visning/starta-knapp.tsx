"use client";

import { cn } from "@/lib/utils";
import { nyckelFor, procentKlart, useFramsteg } from "./framsteg";
import { kapitel } from "./kapitel";
import { knapp } from "./ui";

/** Händelsen som startar visningen utifrån. GuidadVisning lyssnar på den. */
export const STARTA_HANDELSE = "guidad-visning:starta";

/**
 * Knappen som startar den guidade visningen – eller fortsätter där besökaren
 * var. Används i demokortet, som bara har knappen i demoläget – där är alla
 * kapitel med (se kapitelFor). Etiketten följer det sparade framsteget.
 */
export function StartaVisningKnapp({ forening, className }: { forening: string | null; className?: string }) {
  const framsteg = useFramsteg(nyckelFor(forening), kapitel);
  if (!framsteg) return null;

  const procent = procentKlart(framsteg, kapitel);
  const klar = framsteg.lage === "klar";
  const fortsatt = !klar && (framsteg.lage === "pausad" || procent > 0);
  const etikett = klar ? "Se visningen igen" : fortsatt ? "Fortsätt visningen" : "Starta guidad visning";

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(STARTA_HANDELSE))}
      className={cn(knapp.primar, "pl-4", className)}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 4.5v15l12.5-7.5z" />
      </svg>
      {etikett}
      {fortsatt && procent > 0 ? <span className="font-medium tabular-nums text-white/75">{procent} %</span> : null}
    </button>
  );
}
