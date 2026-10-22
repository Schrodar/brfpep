"use client";

import { useDemoForening } from "@/components/demo/use-demo-forening";

/**
 * Föreningens namn där sajten visar det (sidfoten, menyn, sidorna): namnet från
 * demolänken i demoläget, annars föreningens vanliga namn. Med ort läggs orten
 * till efter namnet, men bara för den egna föreningen – demoföreningens ort
 * hör inte ihop med namnet från en demolänk.
 */
export function DemoNamn({ namn, ort }: { namn: string; ort?: string }) {
  const demoNamn = useDemoForening();
  if (demoNamn) return <>{demoNamn}</>;
  return <>{ort ? `${namn}, ${ort}` : namn}</>;
}
