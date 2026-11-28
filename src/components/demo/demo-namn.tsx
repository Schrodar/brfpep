"use client";

import { useDemoFakta, useDemoForening } from "@/components/demo/use-demo-forening";

/**
 * Föreningens namn där sajten visar det (sidfoten, menyn, sidorna): namnet från
 * demolänken i demoläget, annars föreningens vanliga namn. Med ort läggs orten
 * till efter namnet: demolänkens ort när länken har en, annars den egna
 * föreningens – demoföreningens ort hör inte ihop med namnet från en demolänk.
 *
 * Demoföreningens namn märks med data-demo-standard, så att den som kommit via en
 * personlig länk inte ser det medan sidan laddas (se demoSkript i src/lib/demo.ts).
 */
export function DemoNamn({ namn, ort }: { namn: string; ort?: string }) {
  const demoNamn = useDemoForening();
  const fakta = useDemoFakta();
  if (demoNamn) return <>{ort !== undefined && fakta?.ort ? `${demoNamn}, ${fakta.ort}` : demoNamn}</>;
  return <span data-demo-standard="">{ort ? `${namn}, ${ort}` : namn}</span>;
}
