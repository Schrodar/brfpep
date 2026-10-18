"use client";

import { useDemoForening } from "@/components/demo/use-demo-forening";

/**
 * Föreningens namn där en serverkomponent (t.ex. footern) visar det: namnet från
 * demolänken i demoläget, annars föreningens vanliga namn.
 */
export function DemoNamn({ namn }: { namn: string }) {
  return <>{useDemoForening() ?? namn}</>;
}
