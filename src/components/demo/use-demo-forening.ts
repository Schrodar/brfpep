"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DEMO_COOKIE, DEMO_FAKTA_COOKIE, DEMO_MAX_LANGD, tolkaFakta, type DemoFakta } from "@/lib/demo";

/**
 * Föreningens namn från demolänken (cookien som proxyn sätter), eller null.
 *
 * Sidorna är statiska, så namnet läses i webbläsaren. På servern och under
 * hydreringen är värdet null; React byter sedan till cookiens värde utan
 * varning om att innehållet skiljer sig.
 */
export function useDemoForening(): string | null {
  return useSyncExternalStore(ingenPrenumeration, lasNamn, () => null);
}

/**
 * Föreningens adress och organisationsnummer från demolänken (se DemoFakta i src/lib/demo.ts),
 * eller null. Som namnet: null på servern och under hydreringen.
 */
export function useDemoFakta(): DemoFakta | null {
  // Cookiens text är stabil mellan anropen; objektet byggs bara när texten ändras.
  const json = useSyncExternalStore(ingenPrenumeration, lasFakta, () => null);
  return useMemo(() => tolkaFakta(json), [json]);
}

const ingenPrenumeration = () => () => {};

function lasCookie(namn: string): string | null {
  const rad = document.cookie.split("; ").find((c) => c.startsWith(`${namn}=`));
  if (!rad) return null;
  try {
    return decodeURIComponent(rad.slice(namn.length + 1)) || null;
  } catch {
    return null;
  }
}

function lasNamn(): string | null {
  return lasCookie(DEMO_COOKIE)?.slice(0, DEMO_MAX_LANGD) || null;
}

function lasFakta(): string | null {
  return lasCookie(DEMO_FAKTA_COOKIE);
}
