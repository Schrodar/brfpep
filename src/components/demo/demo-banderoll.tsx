"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { nyckelFor, useFramsteg } from "@/components/demo/guidad-visning/framsteg";
import { kapitelFor } from "@/components/demo/guidad-visning/kapitel";
import { BOKA_HANDELSE, StartaVisningKnapp } from "@/components/demo/guidad-visning/starta-knapp";
import { knapp } from "@/components/demo/guidad-visning/ui";
import { useDemoForening } from "@/components/demo/use-demo-forening";
import { cn } from "@/lib/utils";

const STANGD = "demo-banderoll-stangd";

function stangdTidigare(): boolean {
  try {
    return sessionStorage.getItem(STANGD) === "1";
  } catch {
    return false;
  }
}

/**
 * Demorutan för den som öppnat demon via en personlig demolänk: att det är en demo, och vägen
 * vidare – boka en visning eller prova adminpanelen. Kan stängas för resten av besöket.
 *
 * Mobil: en låg list längst ned, så att startsidans rubrik och innehållet syns. Listen har
 * knappen för den guidade visningen, och visningens egen knapp nere till vänster göms medan
 * listen syns (globals.css). Bredare skärmar: ett kort nere till höger.
 *
 * Med `guidadVisning` (demoläget) visas rutan först när välkomstrutan är besvarad, så att
 * ingen möts av två hälsningar på en gång. Den göms också medan visningen markerar något.
 */
export function DemoBanderoll({ guidadVisning = false }: { guidadVisning?: boolean }) {
  const namn = useDemoForening();
  const pathname = usePathname();
  const framsteg = useFramsteg(nyckelFor(namn), kapitelFor(guidadVisning));
  const stangdForut = useSyncExternalStore(() => () => {}, stangdTidigare, () => false);
  const [stangd, setStangd] = useState(false);

  if (!namn || stangd || stangdForut) return null;
  if (guidadVisning && (!framsteg || framsteg.lage === "ny")) return null;

  const stang = () => {
    try {
      sessionStorage.setItem(STANGD, "1");
    } catch {
      // Utan sessionStorage stängs rutan bara för den här sidan.
    }
    setStangd(true);
  };
  const iAdmin = pathname.startsWith("/admin");

  return (
    <aside
      aria-label="Om den här demon"
      // Göms medan den guidade visningen markerar något (se globals.css).
      data-demo-banderoll
      className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-line bg-surface/95 px-4 pb-3 pt-2.5 text-ink shadow-xl backdrop-blur sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem] sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-baseline gap-2 font-body">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-moss">Demo</span>
          <span className="truncate text-sm font-semibold text-ink sm:hidden">{namn}</span>
        </p>
        <button
          type="button"
          onClick={stang}
          aria-label="Stäng"
          className="-mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink sm:-mt-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="hidden sm:block">
        <p className="mt-1 font-display text-xl leading-snug">Välkommen, {namn}</p>
        <p className="mt-2 font-body text-sm leading-relaxed text-muted">
          Så här kan er hemsida se ut. Klicka runt fritt – inget ni gör sparas.
        </p>
      </div>

      <div className="mt-2 flex gap-2 sm:mt-4">
        {guidadVisning ? (
          <StartaVisningKnapp forening={namn} variant="sekundar" kort className="flex-1 sm:hidden" />
        ) : null}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(BOKA_HANDELSE))}
          className={cn(knapp.primar, "flex-1 px-4 sm:flex-none sm:px-5")}
        >
          Boka en visning
        </button>
      </div>

      {/* Vanlig länk, inte TransitionLink: adressen är en route som sätter
          visningslägets cookie och skickar vidare till adminpanelen. */}
      {iAdmin ? null : (
        <a
          href="/admin/demo"
          className="mt-3 hidden items-center gap-1.5 font-body text-sm font-semibold text-moss hover:underline sm:inline-flex"
        >
          Prova styrelsens adminpanel
          <span aria-hidden="true">→</span>
        </a>
      )}
    </aside>
  );
}
