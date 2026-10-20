/**
 * =============================================================================
 * SITECONFIG – det som hör till själva sajten, inte till föreningen.
 * =============================================================================
 * Föreningens uppgifter – namn, kortnamn, org.nr, adress, kontakt och
 * förvaltare – ligger i databasen och redigeras av styrelsen under
 * Admin → Föreningsinfo → Namn och kontakt. Läs dem med getAssociationProfile()
 * från "@/lib/data", aldrig härifrån.
 *
 * Här ligger det som följer med deployen:
 *
 *   1. Logotypfilerna i public/images/.
 *   2. Bakgrunden i heron (film eller bild).
 *   3. Interna nyckelrutter.
 *   4. Sajtens adress (för absoluta länkar i metadata och mejl).
 *
 *   import { siteConfig } from "@/config/siteConfig";
 *
 * Navigationens struktur (menygrupper/länkar) ligger i src/config/site.ts.
 * Färger/typsnitt ändras i src/app/globals.css.
 */

export interface HeroBackground {
  /** Bakgrundsfilm. Går före bilden, som då blir poster tills filmen laddat. */
  video?: string;
  /** Bakgrundsbild. Visas när ingen film används. */
  image?: string;
}

/**
 * BAKGRUNDEN I HERON på startsidan. Kommentera ut raden du inte vill använda:
 *
 *   video – spelas om den finns och går före bilden
 *   image – visas när ingen film används
 *   båda bortkommenterade → den gröna bakgrunden (brand-800)
 *
 * Brf Pep (demon) har sin film i repot: public/videos/hero.mp4, komprimerad
 * till 2,5 MB (1280×720, H.264, utan ljud, faststart). NEXT_PUBLIC_HERO_VIDEO
 * går före om den är satt. Med film blir bilden poster: första rutan ur filmen,
 * så att inget byter motiv när filmen börjar. Stillbilden från tiden före
 * filmen ligger kvar som public/images/hero.webp.
 * Raden och filerna är sajtspecifika – se README.
 */
const hero: HeroBackground = {
  video: process.env.NEXT_PUBLIC_HERO_VIDEO || "/videos/hero.mp4",
  image: "/images/hero-poster.webp",
};

export const siteConfig = {
  /** Kort beskrivning – visas som ingress i sidomenyn. */
  description: "Information för boende, besökare och blivande medlemmar.",

  hero,

  logo: {
    /** Primär logotyp (mörk, för ljus bakgrund). */
    src: "/images/logo.svg",
    /** Ljus/inverterad logotyp för mörka ytor. Lämna tom om den saknas. */
    lightSrc: "/images/logo-light.svg",
    /** Favicon (SVG eller .ico). */
    favicon: "/images/logo.svg",
  },

  /** Interna nyckelrutter (används av knappar/länkar). */
  links: {
    contact: "/kontakt",
    faultReport: "/felanmalan",
    login: "/logga-in",
  },

  seo: {
    /** Sajtens adress – bas för absoluta länkar i metadata och mejl. */
    siteUrl: "https://www.exempelgarden.se",
  },
} as const;

export type SiteConfig = typeof siteConfig;
