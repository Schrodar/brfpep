import { z } from "zod";

/**
 * Kontaktformuläret i den guidade visningens avslutning (demosajten). Skickas
 * via Resend till DEMO_KONTAKT_EPOST, eller hit om den inte är satt.
 *
 * Modulen saknar serverberoenden med flit – formuläret i webbläsaren läser
 * samma regler som routen (src/app/api/demo-kontakt/route.ts).
 */
export const DEMO_KONTAKT_STANDARD = "info@byjnm.se";

/** Fält på en rad: radbrytningar och upprepade mellanslag blir ett mellanslag. */
const enRad = (text: string) => text.replace(/\s+/g, " ");

export const demoKontaktSchema = z.object({
  namn: z.string().trim().min(1, "Skriv ditt namn.").max(100, "Namnet är för långt.").transform(enRad),
  forening: z.string().trim().max(120, "Föreningens namn är för långt.").transform(enRad).default(""),
  epost: z.string().trim().max(200, "Adressen är för lång.").email("Skriv en giltig e-postadress."),
  telefon: z.string().trim().max(40, "Telefonnumret är för långt.").transform(enRad).default(""),
  meddelande: z.string().trim().max(2000, "Meddelandet är för långt.").default(""),
});

export type DemoKontakt = z.infer<typeof demoKontaktSchema>;

/**
 * Namn i en avsändarrad. Resend nekar (422) namn med citattecken och en del
 * skiljetecken, så bara bokstäver, siffror, mellanslag, punkt och bindestreck
 * får vara kvar – utan citattecken runt.
 */
function somAvsandarnamn(text: string): string {
  return text
    .replace(/[^\p{L}\p{N} .-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Bara adressdelen, om miljövariabeln skrivits som "Namn <adress>". */
function adressdel(text: string): string {
  const inom = text.match(/<([^>]+)>/);
  return (inom ? inom[1] : text).trim();
}

/**
 * Mejlet till Resend (POST https://api.resend.com/emails). Resend skickar bara
 * från en domän som är verifierad där, så avsändaradressen är `fran` – men med
 * föreningens namn som avsändarnamn och besökarens adress som svarsadress, så
 * att ett svar går direkt till föreningen.
 */
export function byggKontaktmejl(
  kontakt: DemoKontakt,
  { till, fran }: { till: string; fran: string },
) {
  const avsandare = somAvsandarnamn(kontakt.forening || kontakt.namn) || "Demon";
  const rader = [
    "Ny förfrågan från den guidade visningen i demon.",
    "",
    `Namn: ${kontakt.namn}`,
    kontakt.forening ? `Förening: ${kontakt.forening}` : null,
    `E-post: ${kontakt.epost}`,
    kontakt.telefon ? `Telefon: ${kontakt.telefon}` : null,
    "",
    kontakt.meddelande ? `Meddelande:\n${kontakt.meddelande}` : "Inget meddelande.",
    "",
    `Svara på mejlet så går svaret till ${kontakt.epost}.`,
  ].filter((rad) => rad !== null);

  return {
    from: `${avsandare} <${adressdel(fran)}>`,
    to: [till],
    reply_to: kontakt.epost,
    subject: `Demoförfrågan från ${somAvsandarnamn(kontakt.forening || kontakt.namn)} (${kontakt.epost})`,
    text: rader.join("\n"),
  };
}
