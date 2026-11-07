import { EmailLink, PhoneLink } from "@/components/association";
import { Card, CardBody } from "@/components/ui";

/**
 * Leverantörerna på kontaktsidan – påhittade exempel på demosajten, inte
 * föreningens kontaktregister i databasen. Numren ligger i PTS serie för
 * fiktiv användning (070-174 06 05–99) och adresserna på den reserverade
 * domänen .example, så att ingen riktig mottagare nås.
 */
const LEVERANTORER = [
  { omrade: "Hiss", namn: "KONE", telefon: "070-174 06 21", epost: "hiss@kone.example" },
  {
    omrade: "Vaktmästare",
    namn: "JP Properties",
    telefon: "070-174 06 42",
    epost: "vaktmastare@jpproperties.example",
  },
];

/** Samma uppställning som styrelsens ruta på kontaktsidan. */
export function DemoLeverantorer() {
  return (
    <Card>
      <CardBody>
        <h2 className="title-card">Leverantörer</h2>
        <p className="mt-2 text-sm text-muted">
          Hissen och fastighetsskötseln sköts av föreningens leverantörer.
          Kontakta dem direkt.
        </p>
        <div className="mt-4 divide-y divide-border">
          {LEVERANTORER.map((leverantor) => (
            <ul key={leverantor.namn} className="space-y-2 py-4 text-sm first:pt-0 last:pb-0">
              <li>
                <span className="text-muted">{leverantor.omrade}: </span>
                <span className="font-medium text-foreground">{leverantor.namn}</span>
              </li>
              <li>
                <span className="text-muted">Telefon: </span>
                <PhoneLink phone={leverantor.telefon} className="link-inline" />
              </li>
              <li>
                <span className="text-muted">E-post: </span>
                <EmailLink email={leverantor.epost} className="link-inline" />
              </li>
            </ul>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
