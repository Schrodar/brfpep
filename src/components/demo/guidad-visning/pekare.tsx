"use client";

import { useEffect, useRef, useState } from "react";

const MELLANRUM = 12;
const KANT = 12;

interface Lage {
  /** Pekarens spets. */
  x: number;
  y: number;
  etikett: { left: number; top: number };
}

/**
 * En muspekare som glider fram och klickar på ett element, med en liten etikett.
 * Etiketten hamnar till vänster om elementet om den då ryms utanför `undvik` (den
 * öppna menyn), annars till höger om det eller under pekaren. Bara dekor –
 * informationsrutan har texten.
 */
export function Pekare({ valjare, undvik, text }: { valjare: string; undvik?: string; text: string }) {
  const etikettRef = useRef<HTMLParagraphElement>(null);
  const [lage, setLage] = useState<Lage | null>(null);

  // Följer elementet (fönsterstorlek, brytpunkter) varje bildruta, som markeringen.
  useEffect(() => {
    let raf = 0;
    let forra = "";
    const folj = () => {
      const el = document.querySelector(valjare);
      const etikett = etikettRef.current;
      if (el && etikett) {
        const nytt = berakna(el.getBoundingClientRect(), etikett, undvik);
        const nyckel = `${nytt.x}|${nytt.y}|${nytt.etikett.left}|${nytt.etikett.top}`;
        if (nyckel !== forra) {
          forra = nyckel;
          setLage(nytt);
        }
      }
      raf = window.requestAnimationFrame(folj);
    };
    raf = window.requestAnimationFrame(folj);
    return () => window.cancelAnimationFrame(raf);
  }, [valjare, undvik]);

  // Allt renderas direkt (osynligt tills läget är känt), så att animationerna går i takt.
  const dold = lage ? undefined : ({ visibility: "hidden" } as const);
  const x = lage?.x ?? 0;
  const y = lage?.y ?? 0;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[96]">
      <span
        className="visning-klick absolute h-11 w-11 rounded-full border-2 border-white/90 shadow-[0_0_0_5px_rgb(49_92_74/0.35)]"
        style={{ left: x - 22, top: y - 22, ...dold }}
      />
      <svg
        width="28"
        height="34"
        viewBox="0 0 28 34"
        className="visning-pekare absolute drop-shadow-[0_3px_4px_rgb(22_24_21/0.4)]"
        style={{ left: x - 4, top: y - 3, ...dold }}
      >
        <path
          d="M4 3v24.5l6.4-6.1 4.3 9.9 4.6-2-4.3-9.8h8.8L4 3z"
          fill="#fff"
          stroke="rgb(22 24 21)"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
      <p
        ref={etikettRef}
        className="visning-etikett absolute whitespace-nowrap rounded-full bg-moss px-3.5 py-1.5 font-body text-[13px] font-semibold text-white shadow-[0_12px_28px_-12px_rgb(22_24_21/0.7)]"
        style={{ left: lage?.etikett.left ?? 0, top: lage?.etikett.top ?? 0, ...dold }}
      >
        {text}
      </p>
    </div>
  );
}

function berakna(knapp: DOMRect, etikett: HTMLElement, undvik?: string): Lage {
  const x = Math.round(knapp.left + knapp.width * 0.55);
  const y = Math.round(knapp.top + knapp.height * 0.6);
  const bredd = etikett.offsetWidth;
  const hojd = etikett.offsetHeight;

  // Vänsterkanten på området som ska lämnas fritt, utan menyns glid-animation.
  let fritt = Infinity;
  const omrade = undvik ? document.querySelector<HTMLElement>(undvik) : null;
  if (omrade) fritt = (omrade.offsetParent?.getBoundingClientRect().left ?? 0) + omrade.offsetLeft;

  const fonster = document.documentElement.clientWidth;
  const iHojdMed = Math.round(knapp.top + (knapp.height - hojd) / 2);
  // Till vänster om knappen när den då hamnar utanför menyn (breda skärmar).
  const vanster = knapp.left - MELLANRUM - bredd;
  if (knapp.left - MELLANRUM <= fritt && vanster >= KANT) {
    return { x, y, etikett: { left: Math.round(vanster), top: iHojdMed } };
  }
  // Till höger om knappen, i menyns fria hörn, om det ryms i fönstret.
  const hoger = knapp.right + MELLANRUM;
  if (hoger + bredd <= fonster - KANT) return { x, y, etikett: { left: Math.round(hoger), top: iHojdMed } };
  // Annars under pekaren.
  const left = Math.min(Math.max(x - 18, KANT), fonster - KANT - bredd);
  return { x, y, etikett: { left: Math.round(left), top: y + 38 } };
}
