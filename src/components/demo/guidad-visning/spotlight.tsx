"use client";

export interface Rekt {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TONING = "rgb(22 24 21 / 0.56)";

/**
 * Tonar ned sidan runt det markerade elementet. Ett genomskinligt lager under
 * tonar fångar klick, så att ett felklick inte lämnar visningen – rullning
 * fungerar som vanligt. Utan rekt tonas hela sidan (steg utan mål).
 */
export function Spotlight({ rekt, stegNyckel }: { rekt: Rekt | null; stegNyckel: string }) {
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-[90]" />
      {rekt ? (
        // Följer elementet utan fördröjning vid rullning; tonar in på nytt vid varje steg.
        <div key={stegNyckel} className="visning-tona pointer-events-none fixed inset-0 z-[91]">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[91] rounded-2xl"
            style={{
              ...rekt,
              boxShadow: `0 0 0 2px rgb(255 253 249 / 0.95), 0 0 0 9999px ${TONING}`,
            }}
          />
          {/* Mjuk, andande ring i föreningens mossgröna färg. */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[91] rounded-[1.25rem]"
            style={{
              top: rekt.top - 6,
              left: rekt.left - 6,
              width: rekt.width + 12,
              height: rekt.height + 12,
            }}
          >
            <div className="visning-andas h-full w-full rounded-[inherit] shadow-[0_0_0_4px_rgb(49_92_74/0.45),0_0_40px_6px_rgb(49_92_74/0.35)]" />
          </div>
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="visning-tona pointer-events-none fixed inset-0 z-[91]"
          style={{ background: TONING }}
        />
      )}
    </>
  );
}

const MARGINAL = 10;

/** Elementets ruta med luft runt, beskuren till fönstret. Null när det inte syns alls. */
export function rektFor(el: Element): Rekt | null {
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  const top = Math.max(8, r.top - MARGINAL);
  const left = Math.max(8, r.left - MARGINAL);
  const bottom = Math.min(window.innerHeight - 8, r.bottom + MARGINAL);
  const right = Math.min(window.innerWidth - 8, r.right + MARGINAL);
  if (bottom - top < 24 || right - left < 24) return null;
  return { top, left, width: right - left, height: bottom - top };
}
