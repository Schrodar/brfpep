// Exporterar demoföreningen ur den delade databasen till en fixtur, som demons
// egen databas fylls från (scripts/demo-import.ts):
//
//   npm run demo:export                 föreningen i ASSOCIATION_SLUG (brf-pep)
//   npm run demo:export -- <slug>
//
// Läser bara. Kräver DELAD_DATABASE_URL (den delade Supabase-databasen) och
// NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY för att hämta filerna.
// Skriver demo/data.json och filerna till public/demofiler/<bucket>/<sökväg>.
//
// Bygger på säkerhetskopian i scripts/delete-association.ts: samma rader (alla
// tabeller med associationId) och samma filer (<associationId>/ i bucketarna).
// Utelämnar DeviceToken (appen) och tar med PlatformAdmin-raderna som
// supportloggen och inbjudningarna pekar på.
//
// E-post till medlemmar, inbjudna och felanmälare byts mot påhittade adresser
// (…@brfpep.example) överallt i datan, och supportadminen får ett nytt userId –
// demon har inga inloggningskonton. demo/ ligger i .gitignore: repot är publikt
// och fixturen innehåller namn, så den stannar lokalt (spara en kopia).

import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { avbryt, deladDatabasUrl, delegat, DEMOFILER, FIXTUR, type Rad } from "./demo-databas";
import { loadEnv } from "./load-env";

loadEnv();

const slug = process.argv[2]?.trim() || process.env.ASSOCIATION_SLUG || "brf-pep";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) avbryt("Saknar NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (för filerna).");

const prisma = new PrismaClient({ datasources: { db: { url: deladDatabasUrl() } } });
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

type Lasare = { findMany: (args: unknown) => Promise<Rad[]> };
const klient = prisma as unknown as Record<string, Lasare>;

/** Tabeller som inte hör hemma i demon. */
const UTELAMNA = new Set(["DeviceToken"]);

/**
 * Fält som pekar på filer, och deras bucket (se src/lib/storage.ts). Filerna
 * hämtas även när de inte ligger under föreningens prefix – en nyhetsbild kan
 * ha laddats upp under ett annat.
 */
const FILFALT: [modell: string, falt: string, bucket: string][] = [
  ["NewsPost", "imagePath", "news-images"],
  ["Notice", "imagePath", "news-images"],
  ["Document", "storagePath", "documents"],
  ["Apartment", "floorPlanPath", "floor-plans"],
  ["ApartmentPhoto", "path", "apartment-photos"],
];

/** Fält med personers e-post. Adresserna byts ut överallt där de förekommer. */
const PERSONADRESSER: [modell: string, falt: string, roll: string][] = [
  ["Member", "email", "medlem"],
  ["MemberInvitation", "email", "inbjuden"],
  ["MaintenanceRequest", "email", "felanmalare"],
];

function ersattOveralt(varde: unknown, ersatt: Map<string, string>): unknown {
  if (typeof varde === "string") {
    let ut = varde;
    for (const [fran, till] of ersatt) {
      ut = ut.replace(new RegExp(fran.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), till);
    }
    return ut;
  }
  if (Array.isArray(varde)) return varde.map((v) => ersattOveralt(v, ersatt));
  if (varde && typeof varde === "object" && !(varde instanceof Date)) {
    return Object.fromEntries(Object.entries(varde).map(([k, v]) => [k, ersattOveralt(v, ersatt)]));
  }
  return varde;
}

async function main() {
  const association = await prisma.association.findUnique({ where: { slug } });
  if (!association) avbryt(`Ingen förening med slug "${slug}" i den delade databasen.`);
  const where = { associationId: association.id };

  // 1. Raderna: föreningen och alla tabeller med associationId.
  const modeller: Record<string, Rad[]> = { Association: [association as unknown as Rad] };
  for (const modell of Prisma.dmmf.datamodel.models) {
    if (UTELAMNA.has(modell.name) || !modell.fields.some((f) => f.name === "associationId")) continue;
    modeller[modell.name] = await klient[delegat(modell.name)].findMany({ where });
  }

  // PlatformAdmin är global – bara de som demons rader pekar på följer med.
  const adminIds = new Set(
    ["SupportSession", "MemberInvitation", "AuditEvent"]
      .flatMap((m) => modeller[m] ?? [])
      .map((r) => r.platformAdminId)
      .filter((id): id is string => typeof id === "string"),
  );
  modeller.PlatformAdmin = (await prisma.platformAdmin.findMany({ where: { id: { in: [...adminIds] } } })).map(
    (admin) => ({ ...admin, userId: randomUUID() }) as unknown as Rad,
  );

  // 2. Personers e-post blir påhittade adresser, samma ersättning överallt.
  const ersatt = new Map<string, string>();
  const raknare = new Map<string, number>();
  for (const [modell, falt, roll] of PERSONADRESSER) {
    for (const rad of modeller[modell] ?? []) {
      const adress = String(rad[falt] ?? "").trim().toLowerCase();
      if (!adress || ersatt.has(adress)) continue;
      const n = (raknare.get(roll) ?? 0) + 1;
      raknare.set(roll, n);
      ersatt.set(adress, `${roll}${n}@brfpep.example`);
    }
  }
  const anonymiserat = ersattOveralt(modeller, ersatt) as Record<string, Rad[]>;

  // 3. Filerna till public/demofiler/: allt under <associationId>/ i bucketarna,
  // plus filer som raderna pekar på under andra prefix.
  const underPrefix = await prisma.$queryRaw<{ bucket_id: string; name: string }[]>`
    select bucket_id, name from storage.objects
    where name like ${`${association.id}/%`}
    order by bucket_id, name`;
  const allaFiler = new Map(underPrefix.map((f) => [`${f.bucket_id}/${f.name}`, f]));
  for (const [modell, falt, bucket] of FILFALT) {
    for (const rad of modeller[modell] ?? []) {
      const sokvag = rad[falt];
      if (typeof sokvag === "string" && sokvag) allaFiler.set(`${bucket}/${sokvag}`, { bucket_id: bucket, name: sokvag });
    }
  }
  const filer = [...allaFiler.values()];
  for (const fil of filer) {
    const { data, error } = await supabase.storage.from(fil.bucket_id).download(fil.name);
    if (error || !data) avbryt(`Kunde inte hämta ${fil.bucket_id}/${fil.name}: ${error?.message}`);
    const mal = path.join(DEMOFILER, fil.bucket_id, fil.name);
    mkdirSync(path.dirname(mal), { recursive: true });
    writeFileSync(mal, Buffer.from(await data.arrayBuffer()));
  }

  mkdirSync(path.dirname(FIXTUR), { recursive: true });
  const fixtur = {
    version: 1,
    exporterad: new Date().toISOString(),
    slug: association.slug,
    associationId: association.id,
    modeller: Object.fromEntries(Object.entries(anonymiserat).filter(([, rader]) => rader.length)),
  };
  writeFileSync(FIXTUR, `${JSON.stringify(fixtur, null, 2)}\n`);

  console.info(`${association.name} (${association.slug}) → ${FIXTUR}`);
  for (const [modell, rader] of Object.entries(fixtur.modeller)) console.info(`  ${modell}: ${rader.length}`);
  console.info(`  filer → ${DEMOFILER}: ${filer.length}`);
  console.info(`  utbytta e-postadresser: ${ersatt.size}`);
  console.info("\ndemo/data.json stannar lokalt (.gitignore) – namn ligger kvar som i demon. Spara en kopia.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
