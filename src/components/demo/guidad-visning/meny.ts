/**
 * Sidomenyn (components/layout/nav-drawer.tsx) i menysteget. Visningen styr den
 * med menyns egen knapp, så att menyn själv sköter animering och rullningslås.
 * Väljarna följer menyns markup – byts den ut behöver de ses över.
 */

/** Menyknappen: ⋯ när menyn är stängd, × när den är öppen. */
export const MENYKNAPP = '[aria-controls="nav-drawer-panel"]';
/** Den utfällda menyn. Ligger utanför skärmen när menyn är stängd. */
export const MENYPANEL = "#nav-drawer-panel";

function menyknapp(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(MENYKNAPP);
}

function arOppen(knapp: HTMLButtonElement): boolean {
  return knapp.getAttribute("aria-expanded") === "true";
}

/** Öppnar menyn – som ett klick på ⋯. */
export function oppnaMenyn(): void {
  const knapp = menyknapp();
  if (knapp && !arOppen(knapp)) knapp.click();
}

/** Är menyn öppen och har den glidit klart på plats? */
export function menynArFramme(): boolean {
  const knapp = menyknapp();
  const panel = document.querySelector<HTMLElement>(MENYPANEL);
  if (!knapp || !panel || !arOppen(knapp)) return false;
  const plats = (panel.offsetParent?.getBoundingClientRect().left ?? 0) + panel.offsetLeft;
  return Math.abs(panel.getBoundingClientRect().left - plats) < 1;
}

/**
 * Stänger menyn om den är öppen. Menyn ger då sin knapp fokus (nav-drawer.tsx);
 * i visningen flyttas fokus tillbaka till visningens ruta eller dialog – deras
 * huvudknapp har data-autofocus – så att Enter fortsätter visningen.
 */
export function stangMenyn(): void {
  const knapp = menyknapp();
  if (!knapp || !arOppen(knapp)) return;
  knapp.click();
  const start = performance.now();
  const aterstall = () => {
    if (document.activeElement === knapp) {
      document.querySelector<HTMLElement>("[role=dialog] [data-autofocus]")?.focus({ preventScroll: true });
      return;
    }
    if (performance.now() - start < 500) window.requestAnimationFrame(aterstall);
  };
  window.requestAnimationFrame(aterstall);
}
