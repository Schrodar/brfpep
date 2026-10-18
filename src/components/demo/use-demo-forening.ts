"use client";

import { useSyncExternalStore } from "react";
import { DEMO_COOKIE, DEMO_MAX_LANGD } from "@/lib/demo";

/**
 * Föreningens namn från demolänken (cookien som proxyn sätter), eller null.
 *
 * Sidorna är statiska, så namnet läses i webbläsaren. På servern och under
 * hydreringen är värdet null; React byter sedan till cookiens värde utan
 * varning om att innehållet skiljer sig.
 */
export function useDemoForening(): string | null {
  return useSyncExternalStore(ingenPrenumeration, lasCookie, () => null);
}

const ingenPrenumeration = () => () => {};

function lasCookie(): string | null {
  const rad = document.cookie.split("; ").find((c) => c.startsWith(`${DEMO_COOKIE}=`));
  if (!rad) return null;
  try {
    const namn = decodeURIComponent(rad.slice(DEMO_COOKIE.length + 1)).slice(0, DEMO_MAX_LANGD);
    return namn || null;
  } catch {
    return null;
  }
}
