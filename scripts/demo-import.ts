// Fyller demons egen databas från fixturen demo/data.json (se demo-export.ts):
//
//   npm run demo:import                    tom databas (efter npm run demo:db:push)
//   npm run demo:import -- --aterstall     tar först bort demoföreningens rader,
//                                          så att demon blir som i fixturen igen
//
// Skriver bara till DATABASE_URL och vägrar om den pekar på Supabase – kundernas
// delade databas. Raderna behåller sina id:n, så att länkar som trapphustavlans
// /tavla/<token> fortsätter att fungera.

import { readFileSync } from "node:fs";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  avbryt,
  delegat,
  demodatabasensUrl,
  FIXTUR,
  iNyckelordning,
  jsonFaltSomKanVaraNull,
  type Rad,
} from "./demo-databas";
import { loadEnv } from "./load-env";

loadEnv();

const aterstall = process.argv.includes("--aterstall");
const prisma = new PrismaClient({ datasources: { db: { url: demodatabasensUrl() } } });

type Skrivare = {
  count: (args: unknown) => Promise<number>;
  createMany: (args: unknown) => Promise<{ count: number }>;
  deleteMany: (args: unknown) => Promise<{ count: number }>;
};
const klient = prisma as unknown as Record<string, Skrivare>;

interface Fixtur {
  version: number;
  slug: string;
  associationId: string;
  modeller: Record<string, Rad[]>;
}

/** Null i ett Json?-fält måste skickas som Prisma.DbNull. */
function forbered(modell: string, rader: Rad[]): Rad[] {
  const jsonFalt = jsonFaltSomKanVaraNull(modell);
  if (!jsonFalt.length) return rader;
  return rader.map((rad) => {
    const kopia: Rad = { ...rad };
    for (const falt of jsonFalt) if (kopia[falt] === null) kopia[falt] = Prisma.DbNull;
    return kopia;
  });
}

async function main() {
  const fixtur = JSON.parse(readFileSync(FIXTUR, "utf8")) as Fixtur;
  if (fixtur.version !== 1) avbryt(`Okänd version av ${FIXTUR}: ${fixtur.version}`);
  const id = fixtur.associationId;
  const ordning = iNyckelordning(Object.keys(fixtur.modeller));

  const finns = await prisma.association.count({ where: { id } });
  if (finns && !aterstall) {
    avbryt(`Föreningen "${fixtur.slug}" finns redan i demodatabasen. Kör med --aterstall för att ersätta den.`);
  }

  // Borttagning i omvänd nyckelordning: först det som pekar på annat.
  const borttagning = [...ordning].reverse().map((modell) => {
    if (modell === "Association") return klient.association.deleteMany({ where: { id } });
    if (modell === "PlatformAdmin") {
      const ids = fixtur.modeller.PlatformAdmin.map((r) => r.id);
      return klient.platformAdmin.deleteMany({ where: { id: { in: ids } } });
    }
    return klient[delegat(modell)].deleteMany({ where: { associationId: id } });
  });
  const inlaggning = ordning.map((modell) =>
    klient[delegat(modell)].createMany({ data: forbered(modell, fixtur.modeller[modell]) }),
  );

  // Allt i en transaktion: antingen hela demon eller ingenting.
  const resultat = await prisma.$transaction([
    ...(finns ? borttagning : []),
    ...inlaggning,
  ] as unknown as Prisma.PrismaPromise<{ count: number }>[]);
  const skapade = resultat.slice(finns ? borttagning.length : 0);

  console.info(`${fixtur.slug} → demodatabasen${finns ? " (återställd)" : ""}`);
  ordning.forEach((modell, i) => console.info(`  ${modell}: ${skapade[i].count}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
