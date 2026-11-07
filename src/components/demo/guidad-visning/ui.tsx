"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";

/** Gemensamma byggstenar för den guidade visningens rutor. */

export const knapp = {
  primar:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-moss px-5 py-2.5 font-body text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-ink focus-visible:outline-moss disabled:opacity-40",
  sekundar:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 font-body text-sm font-semibold text-ink transition-colors duration-200 hover:bg-sand focus-visible:outline-moss disabled:opacity-40",
  diskret:
    "inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 font-body text-xs font-semibold text-muted transition-colors duration-200 hover:bg-sand hover:text-ink focus-visible:outline-moss",
};

/**
 * Förloppsindikatorn. `kapitelgranser` (procent, se kapitelgranser() i kapitel.ts)
 * får en gul kant där varje nytt kapitel börjar.
 */
export function Progressbar({
  procent,
  kapitelgranser,
  className,
}: {
  procent: number;
  kapitelgranser?: number[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={procent}
        aria-label="Genomgånget av visningen"
        className="h-1.5 overflow-hidden rounded-full bg-sand"
      >
        <div
          className="h-full rounded-full bg-moss transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${procent}%` }}
        />
      </div>
      {kapitelgranser?.map((grans) => (
        <span
          key={grans}
          aria-hidden="true"
          className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ecb526] shadow-[0_0_0_2px_var(--color-surface)]"
          style={{ left: `${grans}%` }}
        />
      ))}
    </div>
  );
}

export function Progressring({
  procent,
  storlek = 28,
  className,
}: {
  procent: number;
  storlek?: number;
  className?: string;
}) {
  const r = 15;
  const omkrets = 2 * Math.PI * r;
  return (
    <svg width={storlek} height={storlek} viewBox="0 0 36 36" aria-hidden="true" className={cn("-rotate-90", className)}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3.5" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={omkrets}
        strokeDashoffset={omkrets * (1 - procent / 100)}
        className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}

/** Bock i en cirkel. `ritad` ritar fram bocken när den visas – belöningen när ett kapitel är klart. */
export function Bock({ className, ritad = false }: { className?: string; ritad?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      <path
        d="M7 12.5l3.2 3.2L17 9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={ritad ? "visning-bock" : undefined}
      />
    </svg>
  );
}

/** Märker kapitel med tillägg utöver själva hemsidan (VisningsKapitel.tillval). */
export function TillvalEtikett() {
  return (
    <span className="ml-2 inline-block rounded-full border border-moss/30 px-2 py-px align-[1px] text-[10px] font-semibold uppercase tracking-[0.14em] text-moss">
      Tillval
    </span>
  );
}

export function StangIkon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

const FOKUSERBARA = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Håller tangentbordsfokus inom rutan medan den är öppen och lämnar tillbaka
 * fokus dit det var när den stängs. Första elementet med data-autofocus får fokus.
 */
export function useFokusfalla(ref: RefObject<HTMLElement | null>, onEscape?: () => void) {
  const escape = useRef(onEscape);
  useEffect(() => {
    escape.current = onEscape;
  });

  useEffect(() => {
    const ruta = ref.current;
    if (!ruta) return;
    const tidigare = document.activeElement as HTMLElement | null;
    const forsta = ruta.querySelector<HTMLElement>("[data-autofocus]") ?? ruta.querySelector<HTMLElement>(FOKUSERBARA);
    forsta?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && escape.current) {
        event.preventDefault();
        escape.current();
        return;
      }
      if (event.key !== "Tab") return;
      const alla = Array.from(ruta.querySelectorAll<HTMLElement>(FOKUSERBARA)).filter((el) => el.offsetParent !== null);
      if (alla.length === 0) return;
      const forstaEl = alla[0];
      const sista = alla[alla.length - 1];
      if (event.shiftKey && document.activeElement === forstaEl) {
        event.preventDefault();
        sista.focus();
      } else if (!event.shiftKey && document.activeElement === sista) {
        event.preventDefault();
        forstaEl.focus();
      } else if (!ruta.contains(document.activeElement)) {
        event.preventDefault();
        forstaEl.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (tidigare?.isConnected) tidigare.focus({ preventScroll: true });
    };
  }, [ref]);
}

/** Centrerad ruta med tonad bakgrund. Underkant på mobilen, mitt på skärmen på större. */
export function Dialogruta({
  rubrik,
  onEscape,
  bred = false,
  children,
}: {
  /** Rubriken som läses upp – visas inte, eftersom innehållet har sin egen. */
  rubrik: string;
  onEscape: () => void;
  bred?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useFokusfalla(ref, onEscape);

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div aria-hidden="true" className="visning-tona absolute inset-0 bg-[rgb(22_24_21/0.55)] backdrop-blur-[2px]" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cn(
          "visning-in relative max-h-[calc(100svh-1.5rem)] w-full overflow-y-auto overscroll-contain rounded-[1.75rem] border border-line bg-surface font-body text-ink shadow-[0_30px_80px_-30px_rgb(22_24_21/0.55)]",
          bred ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <h2 id={id} className="sr-only">
          {rubrik}
        </h2>
        {children}
      </div>
    </div>
  );
}

const ingenPrenumeration = () => () => {};

function prenumereraStorlek(lyssna: () => void) {
  window.addEventListener("resize", lyssna);
  return () => window.removeEventListener("resize", lyssna);
}

/** Fönstrets storlek, "bredd×höjd". Tom sträng på servern. */
export function useFonster(): { bredd: number; hojd: number } {
  const varde = useSyncExternalStore(
    prenumereraStorlek,
    () => `${window.innerWidth}x${window.innerHeight}`,
    () => "",
  );
  const [bredd, hojd] = varde.split("x").map(Number);
  return { bredd: bredd || 0, hojd: hojd || 0 };
}

/** Rör sig inget på skärmen (prefers-reduced-motion)? */
export function useReduceradRorelse(): boolean {
  return useSyncExternalStore(
    ingenPrenumeration,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
