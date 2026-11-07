/**
 * =============================================================================
 * GUIDAD VISNING – kapitel och steg
 * =============================================================================
 * Den guidade visningen finns bara på demosajten (Brf Pep), aldrig på föreningarnas
 * riktiga hemsidor. Redigera texterna här; komponenterna i samma mapp läser allt härifrån.
 *
 * Sex kapitel: de fem första visar vad hemsidan ger föreningen, det sista
 * presenterar tillval (tillval: true – märks "Tillval" i kapitellistorna).
 *
 *   sida   sökvägen där steget visas. Visningen navigerar dit själv. Sidor under
 *          /admin öppnas i adminpanelens visningsläge (/admin/demo) vid behov. Det
 *          finns bara i demoläget (DEMO_MODE=true) – utan det hoppas de stegen över.
 *   mal    CSS-väljare i prioritetsordning – den första som finns och syns
 *          markeras. Saknas alla (eller mal) visas rutan mitt på skärmen.
 *          Fasta punkter på sidorna är märkta med data-tour="…".
 *   ingenRullning  sidan visas från toppen och går inte att rulla medan steget
 *          visas – för startsidans hero med filmen.
 *   oppnaMeny  en muspekare klickar på menyknappen (mal) med etiketten `pekare`,
 *          sidomenyn öppnas och markeringen flyttar till den öppna menyn.
 *          Informationsrutan visas bredvid menyn när den har glidit fram.
 *
 * Texterna – även kapitlens rubrik och kort – får innehålla {forening}
 * ("Brf Solbacken" / "er förening") och {foreningens} ("Brf Solbackens" /
 * "er förenings"), som byts mot namnet från den personliga demolänken.
 *
 * Byter du id på ett steg eller kapitel tappar besökarna det sparade framsteget
 * för just det steget – inget annat.
 */

import { MENYKNAPP } from "./meny";

export interface VisningsSteg {
  id: string;
  sida: string;
  mal?: string[];
  /** Sidan visas från toppen och går inte att rulla medan steget visas. */
  ingenRullning?: boolean;
  /** Muspekaren klickar på menyknappen (mal), menyn öppnas och markeras. */
  oppnaMeny?: { pekare: string };
  rubrik: string;
  text: string;
  /** Kort nyttorad under texten. */
  nytta?: string;
}

export interface VisningsKapitel {
  id: string;
  rubrik: string;
  /** En rad om kapitlet – i kapitellistan och i slutsammanfattningen. */
  kort: string;
  /** Tillägg utöver själva hemsidan – märks "Tillval" i kapitellistorna. */
  tillval?: boolean;
  steg: VisningsSteg[];
  /** Nyttan som sammanfattas när kapitlet är avklarat. */
  nytta: string[];
}

/** Adminsidornas innehåll (admin/layout.tsx). */
const ADMIN = '[data-tour="admin-innehall"]';

/** Block nummer n på en adminsida. Block 1 är sidans rubrik. */
function adminBlock(n: number): string {
  return `${ADMIN} > div > :nth-child(${n})`;
}

export const kapitel: VisningsKapitel[] = [
  {
    id: "hemsidan",
    rubrik: "{foreningens} hemsida",
    kort: "Nyheter, meddelanden och kontaktuppgifter – allt samlat på ett ställe",
    steg: [
      {
        id: "forstasida",
        sida: "/",
        // Hela startsidans hero (sidhuvudet) med filmen, inte bara rubriken.
        mal: ["header"],
        ingenRullning: true,
        rubrik: "Ett ansikte utåt för {forening}",
        text: "Det första boende, köpare och mäklare möter är föreningens namn och bild. Ni kan också få en video av fastigheten, filmad av en drönaroperatör. Ett vårdat intryck som visar att föreningen sköts ordentligt.",
        nytta: "Förtroende från första klicket",
      },
      {
        id: "meny",
        sida: "/",
        // ⋯-knappen. Pekaren klickar på den, menyn öppnas och ramas in, och
        // sidan står kvar i toppen med filmen bakom menyn.
        mal: [MENYKNAPP],
        oppnaMeny: { pekare: "Detta är menyn" },
        ingenRullning: true,
        rubrik: "All viktig information på ett ställe",
        text: "Menyn är ordnad efter vem som frågar: den som bor här, den som vill veta mer om föreningen och den som funderar på att köpa. Alla hittar rätt utan att behöva fråga styrelsen.",
        nytta: "Färre frågor till styrelsen",
      },
      {
        id: "nyheter",
        sida: "/",
        mal: ['[data-tour="senaste-nytt"]'],
        rubrik: "Nyheter och meddelanden",
        text: "Styrelsen publicerar nyheter och meddelanden direkt från adminpanelen, med bild, på några minuter. De senaste syns på startsidan och finns kvar för den som missade lappen i trapphuset.",
        nytta: "Ersätter lappar, utskick och långa mejlkedjor",
      },
      {
        id: "kontakt",
        sida: "/kontakt",
        // Styrelsens ruta och leverantörerna under den (kontakt/page.tsx).
        mal: ['[data-tour="kontakt-kort"]', "main header"],
        rubrik: "Kontaktuppgifter som alltid stämmer",
        text: "Styrelsen och föreningens leverantörer – som hissfirman och vaktmästaren – med telefon och e-post på ett ställe. Boende hör av sig till rätt person direkt, utan att gå via styrelsen.",
        nytta: "Rätt nummer när något händer",
      },
    ],
    nytta: [
      "Ett professionellt ansikte utåt för {forening}",
      "Nyheter och meddelanden som når alla boende",
      "Kontaktuppgifter som alltid är aktuella",
    ],
  },
  {
    id: "boende",
    rubrik: "För de boende",
    kort: "Årsredovisningar, stadgar, trivselregler och ekonomin i lättlästa nyckeltal",
    steg: [
      {
        id: "arsredovisningar",
        sida: "/arsredovisningar",
        mal: ['[data-tour="arsredovisningar-lista"]', "main header"],
        rubrik: "Årsredovisningarna samlade",
        text: "Alla årsredovisningar finns på ett ställe och går att ladda ner dygnet runt – för boende, mäklare och spekulanter.",
        nytta: "Slipp mejla ut samma dokument om och om igen",
      },
      {
        id: "stadgar",
        sida: "/stadgar",
        mal: ['[data-tour="stadgar-lista"]', "main header"],
        rubrik: "Stadgar och trivselregler",
        text: "Stadgarna och ordningsreglerna – det som gäller i vardagen – finns alltid i den senaste versionen. Interna dokument, som protokoll, visas bara för inloggade medlemmar.",
      },
      {
        id: "ekonomi",
        sida: "/ekonomi",
        mal: ['[data-tour="ekonomi"] > :first-child', "main header"],
        rubrik: "Ekonomin i lättlästa nyckeltal",
        text: "Nyckeltal, avgiftsnivå och planerat underhåll visas så att alla förstår – utan att behöva läsa en hel årsredovisning. Är årsredovisningen svår att tyda hjälper vår support styrelsen att få in rätt siffror.",
        nytta: "Boende och köpare förstår ekonomin",
      },
    ],
    nytta: [
      "Boende hittar svaren själva – utan att kontakta styrelsen",
      "Alltid den senaste versionen av stadgar och regler",
      "Ekonomin begriplig även för den som inte läser årsredovisningar",
    ],
  },
  {
    id: "styrelsen",
    rubrik: "Styrelsens arbetsverktyg",
    kort: "Ärenden, arbetslogg, mötesunderlag och leverantörer – och kunskap som stannar kvar",
    steg: [
      {
        id: "oversikt",
        sida: "/admin",
        mal: ['[data-tour="admin-oversikt"]', ADMIN],
        rubrik: "Allt styrelsen arbetar med, på ett ställe",
        text: "Adminpanelen är styrelsens arbetsverktyg. Översikten visar vad som väntar: nya medlemmar, öppna ärenden, annonser och utkast. Det här är ett visningsläge – klicka gärna runt efteråt, inget sparas.",
      },
      {
        id: "arenden",
        sida: "/admin/felanmalningar",
        mal: [adminBlock(2), ADMIN],
        rubrik: "Ärenden med arbetslogg",
        text: "Felanmälningar från de boende blir ärenden med status, ansvarig och noteringar. Allt som görs sparas i ärendets historik – en arbetslogg som inte går att ändra i efterhand.",
        nytta: "Inget faller mellan stolarna",
      },
      {
        id: "leverantorer",
        sida: "/admin/felanmalningar",
        mal: [adminBlock(4), ADMIN],
        rubrik: "Leverantörerna samlade",
        text: "För varje kategori anger styrelsen vem som utför jobbet, med kontaktuppgifter och noteringar som avtalsnummer och jourtider. Då vet alla direkt vem som ska ringas.",
        nytta: "Rätt hantverkare direkt – även för nya ledamöter",
      },
      {
        id: "moteslage",
        sida: "/admin/felanmalningar/mote",
        mal: [adminBlock(1), ADMIN],
        rubrik: "Mötesunderlag på några minuter",
        text: "Månadens ärenden samlade på en sida inför styrelsemötet: gå igenom dem rad för rad och kopiera sedan färdig protokolltext.",
        nytta: "Felanmälningspunkten på mötet går på några minuter",
      },
      {
        id: "overlamning",
        sida: "/admin/medlemmar",
        mal: [adminBlock(1), ADMIN],
        rubrik: "Kunskapen stannar i föreningen",
        text: "När styrelsen byts ger ni de nya ledamöterna behörighet här. Ärenden med historik, dokument, leverantörer och föreningsfakta finns kvar – inget försvinner med den som avgår.",
        nytta: "Enkelt att lämna över när styrelsen byts",
      },
    ],
    nytta: [
      "Mindre administration – allt sköts från ett ställe",
      "Ärenden och mötesunderlag utan extra arbete",
      "Kunskapen bevaras när styrelsen byts",
    ],
  },
  {
    id: "forsaljning",
    rubrik: "Vid försäljning av bostaden",
    kort: "Säljaren förbereder försäljningen – mäklare och köpare hittar informationen själva",
    steg: [
      {
        id: "till-salu",
        sida: "/till-salu",
        mal: ["main header"],
        rubrik: "Försäljningen förbereds på hemsidan",
        text: "Den som ska sälja lägger själv upp sin lägenhet under Mina sidor, med bilder och planritning. Köpare hittar annonserna och föreningsfakta på samma ställe.",
      },
      {
        id: "godkannande",
        sida: "/admin/till-salu",
        mal: [adminBlock(1), ADMIN],
        rubrik: "Styrelsen har överblicken",
        text: "Styrelsen ser alla pågående försäljningar på ett ställe och godkänner annonserna innan de syns på hemsidan.",
      },
      {
        id: "maklare",
        sida: "/for-maklare",
        mal: ['[data-tour="maklare-fakta"]', "main header"],
        rubrik: "Mäklarfrågorna besvarar sig själva",
        text: "Föreningsfakta, renoveringar och ekonomi samlas på en sida som mäklare och köpare hittar själva. Uppgifterna är de styrelsen redan fyllt i under Föreningsinfo.",
        nytta: "Färre samtal och mejl från mäklare",
      },
    ],
    nytta: [
      "Säljaren förbereder försäljningen själv",
      "Mäklare och köpare får rätt uppgifter direkt",
      "Färre samtal och mejl till styrelsen",
    ],
  },
  {
    id: "tekniken",
    rubrik: "Vi tar hand om tekniken",
    kort: "Drift, uppdateringar och support – med full insyn för styrelsen",
    steg: [
      {
        id: "drift",
        sida: "/admin/supportlogg",
        mal: [adminBlock(1), ADMIN],
        rubrik: "Ni slipper tekniken",
        text: "JnM sköter drift, uppdateringar och support. Styrelsen behöver aldrig tänka på servrar eller tekniskt underhåll – bara på innehållet.",
        nytta: "Inget tekniskt underhåll för styrelsen",
      },
      {
        id: "supportlogg",
        sida: "/admin/supportlogg",
        mal: [adminBlock(2), ADMIN],
        rubrik: "Full insyn i supportloggen",
        text: "Varje gång supporten hjälper till i adminpanelen loggas det automatiskt: vem som var inne, varför och vad som ändrades. Loggen går inte att ändra i efterhand.",
        nytta: "Ni ser alltid vad som gjorts",
      },
    ],
    nytta: [
      "JnM sköter drift och uppdateringar",
      "Support när styrelsen behöver hjälp",
      "Full insyn i allt supporten gör",
    ],
  },
  {
    id: "tillval",
    rubrik: "Tillval och möjligheter",
    kort: "Digitala trapphustavlor med föreningens nyheter och meddelanden",
    tillval: true,
    // Fler tilläggstjänster presenteras som fler steg här.
    steg: [
      {
        id: "trapphustavlor",
        sida: "/admin/tavlor",
        mal: [adminBlock(1), ADMIN],
        rubrik: "Digitala trapphustavlor",
        text: "Skärmar i trapphusen visar föreningens nyheter och meddelanden direkt från hemsidan. De hämtar nytt innehåll automatiskt och visar det senaste även om nätet ligger nere.",
        nytta: "Anslagstavlan av papper blir ett minne blott",
      },
      {
        id: "anslag",
        sida: "/admin/tavlor",
        mal: [adminBlock(2), ADMIN],
        rubrik: "Anslag på några minuter",
        text: "Skriv ett anslag, lägg till en bild och välj när det ska visas. Skärmarna i trapphusen uppdateras av sig själva.",
      },
    ],
    nytta: [
      "Samma information på webben och i trapphuset",
      "Styrs från samma adminpanel som hemsidan",
    ],
  },
];

/** Kapitlen utan adminsidorna. Kapitel som bara visar adminpanelen faller bort helt. */
const kapitelUtanAdmin: VisningsKapitel[] = kapitel
  .map((k) => ({ ...k, steg: k.steg.filter((s) => !s.sida.startsWith("/admin")) }))
  .filter((k) => k.steg.length > 0);

/**
 * Kapitlen som visas. Adminpanelens visningsläge finns bara i demoläget
 * (src/lib/demo-admin.ts), så utan det hoppar visningen över adminsidorna.
 */
export function kapitelFor(demo: boolean): VisningsKapitel[] {
  return demo ? kapitel : kapitelUtanAdmin;
}

/** Stegets nummer bland alla steg i visningen (från 1), och hur många steg det finns. */
export function stegPlats(
  kapitel: VisningsKapitel[],
  kapitelIndex: number,
  stegIndex: number,
): { nummer: number; antal: number } {
  const fore = kapitel.slice(0, kapitelIndex).reduce((summa, k) => summa + k.steg.length, 0);
  const antal = kapitel.reduce((summa, k) => summa + k.steg.length, 0);
  return { nummer: fore + stegIndex + 1, antal };
}

/** Var varje nytt kapitel börjar, i procent av alla steg – markeras i förloppsindikatorn. */
export function kapitelgranser(kapitel: VisningsKapitel[]): number[] {
  const antal = kapitel.reduce((summa, k) => summa + k.steg.length, 0);
  let hittills = 0;
  return kapitel.slice(0, -1).map((k) => {
    hittills += k.steg.length;
    return (hittills / antal) * 100;
  });
}

/** Byter {forening} och {foreningens} mot demolänkens namn. */
export function medNamn(text: string, forening: string | null): string {
  const namn = forening ?? "er förening";
  const genitiv = forening ? (/[sxz]$/i.test(forening) ? forening : `${forening}s`) : "er förenings";
  const ersatt = text.replaceAll("{foreningens}", genitiv).replaceAll("{forening}", namn);
  // Platshållaren först i en mening ("er förenings …") ska ha stor bokstav.
  return ersatt.charAt(0).toUpperCase() + ersatt.slice(1);
}
