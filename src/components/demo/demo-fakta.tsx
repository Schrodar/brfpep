"use client";

import { AddressDetails } from "@/components/association";
import { useDemoFakta, useDemoForening } from "@/components/demo/use-demo-forening";
import type { AssociationProfile } from "@/lib/types";

/*
 * Föreningens adress och organisationsnummer i demoläget (se DemoFakta i src/lib/demo.ts).
 * Den som kommit via en personlig demolänk ser föreningens egna uppgifter från länken – eller
 * inga alls, aldrig demoföreningens tillsammans med sitt eget namn. Övriga besökare ser
 * demoföreningens. Demoföreningens uppgifter märks med data-demo-standard, så att de inte
 * syns medan sidan laddas för den som har en personlig länk.
 */

type Adress = Pick<AssociationProfile, "street" | "postalCode" | "city">;

/** Postadressen, som AddressDetails. */
export function DemoAdress({ address, className }: { address: Adress; className?: string }) {
  const demoNamn = useDemoForening();
  const fakta = useDemoFakta();
  if (!demoNamn) {
    return (
      <div data-demo-standard="">
        <AddressDetails address={address} className={className} />
      </div>
    );
  }
  if (!fakta?.adress && !fakta?.ort) return null;
  return (
    <AddressDetails
      address={{ street: fakta.adress, postalCode: fakta.postnummer, city: fakta.ort }}
      className={className}
    />
  );
}

/** Organisationsnumret med text före och efter, eller ingenting när det saknas. */
export function DemoOrgnr({ orgnr, fore = "", efter = "" }: { orgnr: string; fore?: string; efter?: string }) {
  const demoNamn = useDemoForening();
  const fakta = useDemoFakta();
  if (!demoNamn) return orgnr ? <span data-demo-standard="">{`${fore}${orgnr}${efter}`}</span> : null;
  return fakta?.orgnr ? <>{`${fore}${fakta.orgnr}${efter}`}</> : null;
}

/**
 * Under För mäklare: vilka uppgifter som är föreningens egna och att resten är exempel.
 * Visas bara för den som kommit via en personlig demolänk.
 */
export function DemoFaktaNotis({ className }: { className?: string }) {
  const demoNamn = useDemoForening();
  const fakta = useDemoFakta();
  if (!demoNamn) return null;
  const egna = fakta?.orgnr ? "Namnet och organisationsnumret" : "Namnet";
  return (
    <p className={className}>
      {egna} är era egna. Övriga uppgifter är exempel som byts mot era när hemsidan sätts upp.
    </p>
  );
}
