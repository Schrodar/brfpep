// Gemensamt för demons databasskript (demo:export, demo:db:push, demo:import).
//
// Demon (Brf Pep) har en egen Postgres i Coolify på HostUp. Kundföreningarna
// delar en Supabase-databas, och den får demons skript aldrig skriva till:
// demodatabasens adress ligger i DATABASE_URL, och skripten vägrar köra om den
// pekar på Supabase. Exporten läser den delade databasen via DELAD_DATABASE_URL.

import { Prisma } from "@prisma/client";

export const FIXTUR = "demo/data.json";
/** Filerna serveras härifrån när DEMO_FILER=statiska (se src/lib/storage.ts). */
export const DEMOFILER = "public/demofiler";

export function avbryt(text: string): never {
  console.error(`✖ ${text}`);
  process.exit(1);
}

function vard(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return avbryt("Databasadressen går inte att läsa.");
  }
}

/** Demodatabasens adress. Avbryter om den saknas eller pekar på kundernas Supabase. */
export function demodatabasensUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) avbryt("DATABASE_URL saknas – den ska peka på demons egen databas.");
  const host = vard(url);
  if (host.includes("supabase")) {
    avbryt(`DATABASE_URL pekar på Supabase (${host}), alltså kundernas delade databas. Peka den på demons egen databas.`);
  }
  if (process.env.DELAD_DATABASE_URL && process.env.DELAD_DATABASE_URL === url) {
    avbryt("DATABASE_URL och DELAD_DATABASE_URL är samma adress.");
  }
  return url;
}

/** Den delade databasens adress – bara för att läsa demoföreningen därifrån. */
export function deladDatabasUrl(): string {
  const url = process.env.DELAD_DATABASE_URL;
  if (!url) avbryt("DELAD_DATABASE_URL saknas – den ska peka på den delade Supabase-databasen.");
  return url;
}

export type Rad = Record<string, unknown>;

/** Prisma-modellernas klientnamn: "MaintenanceRequest" → "maintenanceRequest". */
export function delegat(modell: string): string {
  return modell.charAt(0).toLowerCase() + modell.slice(1);
}

/**
 * Modellerna i en ordning där varje tabell kommer efter de tabeller den pekar
 * på (främmande nycklar), räknad ur schemat. Borttagning sker i omvänd ordning.
 */
export function iNyckelordning(modeller: string[]): string[] {
  const valda = new Set(modeller);
  const beroenden = new Map<string, Set<string>>();
  for (const modell of Prisma.dmmf.datamodel.models) {
    if (!valda.has(modell.name)) continue;
    const pekarPa = new Set<string>();
    for (const falt of modell.fields) {
      if (falt.kind === "object" && falt.relationFromFields?.length && falt.type !== modell.name && valda.has(falt.type)) {
        pekarPa.add(falt.type);
      }
    }
    beroenden.set(modell.name, pekarPa);
  }
  const ordning: string[] = [];
  const kvar = new Set(valda);
  while (kvar.size) {
    const redo = [...kvar].filter((m) => [...(beroenden.get(m) ?? [])].every((b) => !kvar.has(b)));
    if (!redo.length) avbryt(`Cirkulära nycklar mellan: ${[...kvar].join(", ")}`);
    for (const m of redo.sort()) {
      ordning.push(m);
      kvar.delete(m);
    }
  }
  return ordning;
}

/** Json-fält som får vara null – Prisma vill ha Prisma.DbNull i stället för null. */
export function jsonFaltSomKanVaraNull(modell: string): string[] {
  const m = Prisma.dmmf.datamodel.models.find((x) => x.name === modell);
  return (m?.fields ?? []).filter((f) => f.type === "Json" && !f.isRequired).map((f) => f.name);
}
