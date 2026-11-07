// Lägger schemat i demons egen databas: prisma db push mot DATABASE_URL.
//
//   npm run demo:db:push
//
// Vägrar om DATABASE_URL pekar på Supabase – kundernas delade databas, vars
// schema ägs av BrfStart. Kör det här efter varje schemaändring som förs över
// från BrfStart. prisma db push frågar själv innan något som raderar data.

import { spawnSync } from "node:child_process";
import { demodatabasensUrl } from "./demo-databas";
import { loadEnv } from "./load-env";

loadEnv();

const url = demodatabasensUrl();
const resultat = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  // Demodatabasen har ingen pooler: samma adress för direkt anslutning.
  env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
});
process.exit(resultat.status ?? 1);
