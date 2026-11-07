"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { kapitelgranser, medNamn, stegPlats, type VisningsKapitel } from "./kapitel";
import type { Rekt } from "./spotlight";
import { knapp, Progressbar, StangIkon, useFonster } from "./ui";

const BREDD = 384;
/** Smalast rutan blir vid sidan av en markering, i stället för att lägga sig över den. */
const MINSTA_BREDD = 280;
const AVSTAND = 18;
const KANT = 16;

interface Props {
  kapitel: VisningsKapitel[];
  kapitelIndex: number;
  stegIndex: number;
  /** Markeringen, eller null när steget saknar mål (rutan centreras). */
  rekt: Rekt | null;
  procent: number;
  forening: string | null;
  onNasta: () => void;
  onTillbaka: () => void;
  onPausa: () => void;
  onHoppaOver: () => void;
  onKapitel: () => void;
}

/** Informationsrutan bredvid markeringen. På mobilen ett ark längst ned. */
export function StegRuta({
  kapitel,
  kapitelIndex,
  stegIndex,
  rekt,
  procent,
  forening,
  onNasta,
  onTillbaka,
  onPausa,
  onHoppaOver,
  onKapitel,
}: Props) {
  const k = kapitel[kapitelIndex];
  const steg = k.steg[stegIndex];
  const sistaIKapitlet = stegIndex === k.steg.length - 1;
  const sistaKapitlet = kapitelIndex === kapitel.length - 1;
  const allraForsta = kapitelIndex === 0 && stegIndex === 0;
  const plats = stegPlats(kapitel, kapitelIndex, stegIndex);

  const rubrikId = useId();
  const textId = useId();
  const rutaRef = useRef<HTMLDivElement>(null);
  const nastaRef = useRef<HTMLButtonElement>(null);
  const [hojd, setHojd] = useState(260);
  const fonster = useFonster();
  const mobil = fonster.bredd < 640;

  // Rutans höjd styr om den får plats under eller över markeringen.
  useEffect(() => {
    const ruta = rutaRef.current;
    if (!ruta) return;
    const observer = new ResizeObserver(() => setHojd(ruta.offsetHeight));
    observer.observe(ruta);
    return () => observer.disconnect();
  }, []);

  // Nästa-knappen får fokus vid varje steg, så att Enter bläddrar vidare.
  useEffect(() => {
    nastaRef.current?.focus({ preventScroll: true });
  }, [kapitelIndex, stegIndex]);

  const position = mobil ? undefined : placera(rekt, hojd, fonster.bredd, fonster.hojd);

  return (
    <div
      ref={rutaRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={rubrikId}
      aria-describedby={textId}
      style={position}
      className={cn(
        "fixed z-[95] font-body text-ink",
        mobil
          ? "inset-x-3 bottom-3"
          : "w-[384px]",
      )}
    >
      <div
        key={`${kapitelIndex}/${stegIndex}`}
        className="visning-in overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-[0_28px_70px_-28px_rgb(22_24_21/0.6)]"
      >
        <div className="px-5 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-moss tabular-nums">
              {plats.nummer} av {plats.antal}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-muted">{procent} %</span>
              <button
                type="button"
                onClick={onPausa}
                aria-label="Pausa visningen"
                title="Pausa (Esc)"
                className="-mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink focus-visible:outline-moss"
              >
                <StangIkon />
              </button>
            </div>
          </div>
          <Progressbar procent={procent} kapitelgranser={kapitelgranser(kapitel)} className="mt-2" />
          <p className="mt-4 text-xs font-medium text-muted">{medNamn(k.rubrik, forening)}</p>
          <h2 id={rubrikId} className="mt-1 font-display text-[1.375rem] font-normal leading-snug tracking-tight text-ink">
            {medNamn(steg.rubrik, forening)}
          </h2>
          <p id={textId} className="mt-2 text-[15px] leading-relaxed text-muted">
            {medNamn(steg.text, forening)}
          </p>
          {steg.nytta ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-bone px-3 py-1.5 text-xs font-semibold text-moss">
              <span aria-hidden="true">✦</span>
              {medNamn(steg.nytta, forening)}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 px-5 sm:px-6">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {k.steg.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === stegIndex ? "w-5 bg-moss" : i < stegIndex ? "w-1.5 bg-moss/50" : "w-1.5 bg-sand",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onTillbaka} disabled={allraForsta} className={cn(knapp.sekundar, "px-4")}>
              Tillbaka
            </button>
            <button ref={nastaRef} type="button" onClick={onNasta} data-autofocus className={knapp.primar}>
              {sistaIKapitlet ? (sistaKapitlet ? "Avsluta" : "Klart") : "Nästa"}
              <span aria-hidden="true">{sistaIKapitlet ? "✓" : "→"}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line px-3 py-2 sm:px-4">
          <button type="button" onClick={onKapitel} className={knapp.diskret}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            Alla kapitel
          </button>
          {sistaKapitlet ? null : (
            <button type="button" onClick={onHoppaOver} className={knapp.diskret}>
              Hoppa över kapitlet
            </button>
          )}
        </div>
      </div>
      {/* Läses upp vid varje nytt steg. */}
      <p className="sr-only" aria-live="polite">
        Steg {plats.nummer} av {plats.antal}, {medNamn(k.rubrik, forening)}: {medNamn(steg.rubrik, forening)}
      </p>
    </div>
  );
}

/**
 * Under markeringen om det får plats, annars över, vid sidan av – eller nere i
 * hörnet. Vid sidan av en hög markering (den öppna menyn) centreras rutan i
 * höjdled, och hellre smalare än över markeringen (surfplattor).
 */
function placera(rekt: Rekt | null, hojd: number, bredd: number, fonsterHojd: number): CSSProperties {
  const klamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));
  if (!rekt) {
    return { top: klamp((fonsterHojd - hojd) / 2, KANT, fonsterHojd), left: (bredd - BREDD) / 2 };
  }
  const centrerad = klamp(rekt.left + rekt.width / 2 - BREDD / 2, KANT, bredd - BREDD - KANT);
  const under = rekt.top + rekt.height + AVSTAND;
  if (under + hojd <= fonsterHojd - KANT) return { top: under, left: centrerad };
  const over = rekt.top - AVSTAND - hojd;
  if (over >= KANT) return { top: over, left: centrerad };
  const topp = klamp(rekt.height > hojd ? rekt.top + (rekt.height - hojd) / 2 : rekt.top, KANT, fonsterHojd - hojd - KANT);
  const hogerOm = rekt.left + rekt.width + AVSTAND;
  const platsHoger = bredd - KANT - hogerOm;
  const platsVanster = rekt.left - AVSTAND - KANT;
  if (platsHoger >= BREDD) return { top: topp, left: hogerOm };
  if (platsVanster >= BREDD) return { top: topp, left: rekt.left - AVSTAND - BREDD };
  if (Math.max(platsHoger, platsVanster) >= MINSTA_BREDD) {
    return platsHoger >= platsVanster
      ? { top: topp, left: hogerOm, width: platsHoger }
      : { top: topp, left: KANT, width: platsVanster };
  }
  return { top: fonsterHojd - hojd - 24, left: bredd - BREDD - 24 };
}
