/**
 * =============================================================================
 * GUIDAD VISNING – kapitel och steg
 * =============================================================================
 * Den guidade visningen finns bara på demosajten (Brf Pep), aldrig på föreningarnas
 * riktiga hemsidor. Redigera texterna här; komponenterna i samma mapp läser allt härifrån.
 *
 * Fyra kapitel som tar ett par minuter: hemsidan, styrelsens verktyg, försäljningen och
 * det JnM sköter – med priset sist. Ett kapitel med tillval: true märks "Tillval" i
 * kapitellistorna. Steg utan mal visar rutan mitt på skärmen.
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

/**
 * Priset som visningens sista kapitel och avslutningen nämner. Samma som i säljbrevet
 * (webcrawlerns inställning Pris i brevet) – ändras det, ändra båda.
 */
export const PRIS = "280 kr i månaden";
export const PRIS_MOMS = "inklusive moms";

export const kapitel: VisningsKapitel[] = [
  {
    id: "hemsidan",
    rubrik: "{foreningens} hemsida",
    kort: "Ansikte utåt, nyheter, ekonomi och dokument – allt de boende behöver på ett ställe",
    steg: [
      {
        id: "forstasida",
        sida: "/",
        // Hela startsidans hero (sidhuvudet) med filmen, inte bara rubriken.
        mal: ["header"],
        ingenRullning: true,
        rubrik: "Ett ansikte utåt för {forening}",
        text: "Det första boende, köpare och mäklare möter är föreningens namn och bild – gärna en film av huset, filmad med drönare. Ett vårdat intryck som visar att föreningen sköts ordentligt.",
        nytta: "Förtroende från första klicket",
      },
      {
        id: "nyheter",
        sida: "/",
        mal: ['[data-tour="senaste-nytt"]'],
        rubrik: "Nyheter i stället för lappar",
        text: "Styrelsen publicerar nyheter med bild direkt från adminpanelen, på några minuter. De syns på startsidan och finns kvar för den som missade lappen i trapphuset.",
        nytta: "Ersätter lappar, utskick och långa mejlkedjor",
      },
      {
        // Nyckeltalen, årsredovisningarna och stadgarna i ett steg, på en sida som finns
        // för visningen. På datorn ligger rutan bredvid blocket, på mobilen syns
        // nyckeltalen ovanför arket.
        id: "dokument",
        sida: "/ekonomi-och-dokument",
        mal: ['[data-tour="ekonomi-och-dokument"]', "main header"],
        rubrik: "Ekonomin i klartext, dokumenten ett klick bort",
        text: "Nyckeltalen gör ekonomin begriplig för alla, och under dem ligger årsredovisningar, stadgar och ordningsregler redo att laddas ner. Siffrorna uppdaterar vi åt er varje år – skicka bara den nya årsredovisningen.",
        nytta: "Slipp mejla ut samma dokument om och om igen",
      },
    ],
    nytta: [
      "Ett professionellt ansikte utåt för {forening}",
      "Nyheter som når alla boende",
      "Ekonomin och dokumenten som alla hittar själva",
    ],
  },
  {
    id: "styrelsen",
    rubrik: "Styrelsens arbetsverktyg",
    kort: "Felanmälningar som ärenden med historik och mötesunderlag på några minuter",
    steg: [
      {
        id: "oversikt",
        sida: "/admin",
        mal: ['[data-tour="admin-oversikt"]', ADMIN],
        rubrik: "Allt styrelsen arbetar med, på ett ställe",
        text: "Adminpanelen är styrelsens arbetsverktyg. Översikten visar vad som väntar: öppna ärenden, annonser och utkast. Det här är ett visningsläge – klicka gärna runt efteråt, inget sparas.",
      },
      {
        id: "arenden",
        sida: "/admin/felanmalningar",
        mal: [adminBlock(2), ADMIN],
        rubrik: "Felanmälningar blir ärenden",
        text: "Det de boende anmäler blir ärenden med status, ansvarig och leverantör. Allt som görs sparas i ärendets historik – den finns kvar även när styrelsen byts.",
        nytta: "Inget faller mellan stolarna",
      },
      {
        id: "moteslage",
        sida: "/admin/felanmalningar/mote",
        mal: [adminBlock(1), ADMIN],
        rubrik: "Mötesunderlag på några minuter",
        text: "Månadens ärenden samlade på en sida inför styrelsemötet: gå igenom dem rad för rad och kopiera sedan färdig protokolltext.",
        nytta: "Felanmälningspunkten på mötet går på några minuter",
      },
    ],
    nytta: [
      "Mindre administration – allt sköts från ett ställe",
      "Ärenden och mötesunderlag utan extra arbete",
      "Historiken finns kvar när styrelsen byts",
    ],
  },
  {
    id: "forsaljning",
    rubrik: "När någon säljer",
    kort: "Mäklare och köpare hittar föreningsfakta själva",
    steg: [
      {
        id: "maklare",
        sida: "/for-maklare",
        mal: ['[data-tour="maklare-fakta"]', "main header"],
        rubrik: "Mäklarfrågorna besvarar sig själva",
        text: "Föreningsfakta, renoveringar och ekonomi på en sida som mäklare och köpare hittar själva. Den som säljer kan också lägga upp sin lägenhet, och styrelsen godkänner annonsen innan den syns.",
        nytta: "Färre samtal och mejl från mäklare",
      },
    ],
    nytta: ["Mäklare och köpare får rätt uppgifter direkt", "Färre samtal och mejl till styrelsen"],
  },
  {
    id: "support",
    rubrik: "Vi sköter resten",
    kort: `Nyckeltalen, medlemmarnas inloggning och tekniken – ${PRIS}`,
    // Att vi uppdaterar nyckeltalen berättar steget "dokument" i första kapitlet, där
    // nyckeltalen visas.
    steg: [
      {
        id: "medlemmar",
        sida: "/admin/supportlogg",
        mal: [adminBlock(2), ADMIN],
        rubrik: "Vi hjälper medlemmarna",
        text: "Har någon problem att logga in, eller ska nya ledamöter in när styrelsen byts? Det sköter vi, liksom drift och uppdateringar. Allt vi gör i adminpanelen loggas här, så att ni alltid ser vad som ändrats.",
        nytta: "Styrelsen slipper teknikfrågorna",
      },
      {
        id: "pris",
        // Ingen markering: rutan visas mitt på startsidan.
        sida: "/",
        ingenRullning: true,
        rubrik: `${PRIS} – allt ingår`,
        text: `Hemsidan med adminpanel, en databas för bilder, filer och nyheter, drift, support och egen domän – och hjälpen med nyckeltal och inloggning. Priset är ${PRIS_MOMS}. Första året binder ni er i tolv månader, sedan finns ingen bindningstid. Digitala trapphustavlor finns som tillval.`,
      },
    ],
    nytta: [
      "Nyckeltalen uppdateras efter varje årsredovisning",
      "Hjälp med inloggning och nya ledamöter",
      `${PRIS} ${PRIS_MOMS} – allt ingår`,
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
