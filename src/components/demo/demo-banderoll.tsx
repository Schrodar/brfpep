"use client";

import { useState, useSyncExternalStore } from "react";
import { useDemoForening } from "@/components/demo/use-demo-forening";

const STANGD = "demo-banderoll-stangd";

/**
 * Diskret kort nere till höger när demon öppnats via en personlig demolänk.
 * Förklarar att det är en demo och kan stängas för resten av besöket.
 */
export function DemoBanderoll() {
  const namn = useDemoForening();
  const stangdTidigare = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem(STANGD) === "1",
    () => false,
  );
  const [stangd, setStangd] = useState(false);

  if (!namn || stangd || stangdTidigare) return null;

  const stang = () => {
    sessionStorage.setItem(STANGD, "1");
    setStangd(true);
  };

  return (
    <aside
      aria-label="Om den här demon"
      // Mobil: överst under sidhuvudet, eftersom startsidans rubrik ligger längst ned.
      // Bredare skärmar: nere till höger.
      className="fixed inset-x-4 top-20 z-50 rounded-2xl border border-line bg-surface/95 p-4 text-ink shadow-xl backdrop-blur sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:max-w-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-moss">Demo</p>
        <button
          type="button"
          onClick={stang}
          aria-label="Stäng"
          className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p className="mt-2 font-display text-xl leading-snug">Välkommen, {namn}</p>
      <p className="mt-2 font-body text-sm leading-relaxed text-muted">
        Det här är en demo av hur er förenings hemsida kan se ut. Klicka runt fritt – och svara på
        mejlet, så visar jag den gärna på ert nästa styrelsemöte.
      </p>
      {/* Vanlig länk, inte TransitionLink: adressen är en route som sätter
          visningslägets cookie och skickar vidare till adminpanelen. */}
      <a
        href="/admin/demo"
        className="mt-3 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-moss hover:underline"
      >
        Prova styrelsens adminpanel
        <span aria-hidden="true">→</span>
      </a>
    </aside>
  );
}
