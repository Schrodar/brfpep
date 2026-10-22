"use client";

import { useEffect } from "react";
import { useDemoForening } from "@/components/demo/use-demo-forening";

/**
 * Fliktiteln i demoläget: öppnad via en personlig demolänk byts demonamnet i
 * titeln mot föreningens, t.ex. "Om föreningen | Brf Skulptrisen". Next sätter
 * titeln vid varje sidbyte, så head bevakas och titeln rättas efter varje byte.
 */
export function DemoTitel({ namn }: { namn: string }) {
  const demoNamn = useDemoForening();

  useEffect(() => {
    if (!demoNamn || demoNamn === namn) return;
    const byt = () => {
      // Villkoret på demoNamn hindrar en slinga när det ena namnet innehåller det andra.
      if (document.title.includes(namn) && !document.title.includes(demoNamn)) {
        document.title = document.title.split(namn).join(demoNamn);
      }
    };
    byt();
    const vakt = new MutationObserver(byt);
    vakt.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => vakt.disconnect();
  }, [demoNamn, namn]);

  return null;
}
