"use client";

import { useSyncExternalStore } from "react";
import type { VisningsKapitel } from "./kapitel";

/**
 * Den guidade visningens framsteg, sparat i webbläsaren (localStorage) – ett
 * eget framsteg per personlig demo, så att två föreningar som delar dator inte
 * fortsätter i varandras visning. Utan demolänk gäller nyckeln "demo".
 *
 * localStorage kan saknas eller vägra (privat läge, blockerad lagring). Då
 * fungerar visningen ändå, bara utan att minnas något till nästa besök.
 */

export type Lage =
  /** Har inte sett välkomstrutan. */
  | "ny"
  /** Visningen pågår. */
  | "aktiv"
  /** Pausad mitt i – knappen nere till vänster fortsätter. */
  | "pausad"
  /** Valde "Utforska själv". */
  | "utforskar"
  /** Har gått igenom sista kapitlet. */
  | "klar";

export interface Framsteg {
  version: 1;
  lage: Lage;
  kapitel: number;
  steg: number;
  /** Steg-id:n ("kapitel/steg") som besökaren gått vidare från. */
  klaraSteg: string[];
  avklaradeKapitel: string[];
  overhoppadeKapitel: string[];
}

export const NYTT_FRAMSTEG: Framsteg = {
  version: 1,
  lage: "ny",
  kapitel: 0,
  steg: 0,
  klaraSteg: [],
  avklaradeKapitel: [],
  overhoppadeKapitel: [],
};

export function nyckelFor(forening: string | null): string {
  return `brf-guidad-visning:v1:${forening ?? "demo"}`;
}

export function stegId(kapitel: VisningsKapitel[], kapitelIndex: number, stegIndex: number): string {
  const k = kapitel[kapitelIndex];
  return `${k?.id}/${k?.steg[stegIndex]?.id}`;
}

/**
 * Andel genomgångna steg, 0–100. Steg som tagits bort ur kapitel.ts – eller som
 * inte visas, som adminsidorna utan demoläget – räknas inte.
 */
export function procentKlart(framsteg: Framsteg, kapitel: VisningsKapitel[]): number {
  const finns = new Set(kapitel.flatMap((k) => k.steg.map((s) => `${k.id}/${s.id}`)));
  const klara = framsteg.klaraSteg.filter((id) => finns.has(id)).length;
  return Math.round((klara / finns.size) * 100);
}

/** Avklarade kapitel bland dem som visas – kapitel som inte längre finns räknas inte. */
export function antalAvklarade(framsteg: Framsteg, kapitel: VisningsKapitel[]): number {
  return kapitel.filter((k) => framsteg.avklaradeKapitel.includes(k.id)).length;
}

const lyssnare = new Set<() => void>();
/** Senaste tolkningen per kapitellista (se kapitelFor). */
const cache = new WeakMap<VisningsKapitel[], { nyckel: string; rad: string | null; varde: Framsteg }>();
/** Används när localStorage inte går att skriva till. */
const minne = new Map<string, string>();

function lasRad(nyckel: string): string | null {
  try {
    return window.localStorage.getItem(nyckel);
  } catch {
    return minne.get(nyckel) ?? null;
  }
}

function tolka(rad: string | null, kapitel: VisningsKapitel[]): Framsteg {
  if (!rad) return NYTT_FRAMSTEG;
  try {
    const data = JSON.parse(rad) as Partial<Framsteg>;
    if (data.version !== 1) return NYTT_FRAMSTEG;
    const framsteg = { ...NYTT_FRAMSTEG, ...data };
    // Kapitel som tagits bort sedan senaste besöket: börja om på ett giltigt ställe.
    if (!kapitel[framsteg.kapitel]?.steg[framsteg.steg]) {
      return { ...framsteg, kapitel: 0, steg: 0, lage: framsteg.lage === "aktiv" ? "pausad" : framsteg.lage };
    }
    return framsteg;
  } catch {
    return NYTT_FRAMSTEG;
  }
}

/** Stabil ögonblicksbild för useSyncExternalStore: samma objekt så länge raden är densamma. */
export function lasFramsteg(nyckel: string, kapitel: VisningsKapitel[]): Framsteg {
  const rad = lasRad(nyckel);
  const sparad = cache.get(kapitel);
  if (sparad && sparad.nyckel === nyckel && sparad.rad === rad) return sparad.varde;
  const varde = tolka(rad, kapitel);
  cache.set(kapitel, { nyckel, rad, varde });
  return varde;
}

export function sparaFramsteg(nyckel: string, framsteg: Framsteg): void {
  const rad = JSON.stringify(framsteg);
  try {
    window.localStorage.setItem(nyckel, rad);
  } catch {
    minne.set(nyckel, rad);
  }
  lyssnare.forEach((l) => l());
}

function prenumerera(lyssna: () => void): () => void {
  lyssnare.add(lyssna);
  // En annan flik med samma demo håller samma framsteg.
  window.addEventListener("storage", lyssna);
  return () => {
    lyssnare.delete(lyssna);
    window.removeEventListener("storage", lyssna);
  };
}

/** Framsteget för demon, eller null på servern och under hydreringen. */
export function useFramsteg(nyckel: string, kapitel: VisningsKapitel[]): Framsteg | null {
  return useSyncExternalStore(
    prenumerera,
    () => lasFramsteg(nyckel, kapitel),
    () => null,
  );
}
