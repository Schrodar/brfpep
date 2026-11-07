"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { antalAvklarade, type Framsteg } from "./framsteg";
import { kapitelgranser, medNamn, type VisningsKapitel } from "./kapitel";
import { Kontaktformular } from "./kontaktformular";
import { Bock, Dialogruta, knapp, Progressbar, Progressring, StangIkon, TillvalEtikett } from "./ui";

/** "fem kapitel" – kapitel är ett ett-ord. */
const RAKNEORD = ["noll", "ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio"];

/** Första besöket: guidad visning eller utforska själv. */
export function Valkomst({
  kapitel,
  forening,
  onStarta,
  onUtforska,
}: {
  kapitel: VisningsKapitel[];
  forening: string | null;
  onStarta: () => void;
  onUtforska: () => void;
}) {
  return (
    <Dialogruta rubrik="Välkommen till demon" onEscape={onUtforska}>
      <div className="bg-bone/70 px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-moss">Guidad visning</p>
        <p className="mt-3 font-display text-[1.75rem] font-normal leading-[1.15] tracking-tight text-ink sm:text-[2rem]">
          {forening ? `Välkommen, ${forening}` : "Välkommen till er nya hemsida"}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Följ med på en kort rundtur i {RAKNEORD[kapitel.length] ?? kapitel.length} kapitel och se hur hemsidan
          sparar tid för styrelsen och gör vardagen enklare för de boende.
        </p>
      </div>
      <ol className="space-y-1 px-6 py-5 sm:px-8">
        {kapitel.map((k, i) => (
          <li key={k.id} className="flex items-baseline gap-3 text-sm">
            <span className="w-4 shrink-0 text-right font-display text-moss tabular-nums">{i + 1}</span>
            <span className="text-ink">
              {medNamn(k.rubrik, forening)}
              {k.tillval ? <TillvalEtikett /> : null}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <button type="button" onClick={onUtforska} className={knapp.sekundar}>
          Utforska själv
        </button>
        <button type="button" onClick={onStarta} data-autofocus className={knapp.primar}>
          Starta guidad visning
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="px-6 pb-5 text-xs leading-relaxed text-muted sm:px-8">
        Du kan pausa, välja kapitel och fortsätta när du vill – knappen nere till vänster tar dig tillbaka.
        <span className="hidden sm:inline"> Med tangentbordet bläddrar du med ← → och pausar med Esc.</span>
      </p>
    </Dialogruta>
  );
}

/** Belöningen efter ett kapitel: bock, nyttan i korthet och vägen vidare. */
export function KapitelKlart({
  kapitel,
  kapitelIndex,
  procent,
  forening,
  onFortsatt,
  onPausa,
}: {
  kapitel: VisningsKapitel[];
  kapitelIndex: number;
  procent: number;
  forening: string | null;
  onFortsatt: () => void;
  onPausa: () => void;
}) {
  const k = kapitel[kapitelIndex];
  const nasta = kapitel[kapitelIndex + 1];
  return (
    <Dialogruta rubrik={`Kapitel ${kapitelIndex + 1} av ${kapitel.length} avklarat`} onEscape={onPausa}>
      <div className="px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
        <div className="flex items-center gap-3">
          <Bock ritad className="h-9 w-9 shrink-0 text-moss" />
          <p className="text-sm font-semibold text-moss">
            Kapitel {kapitelIndex + 1} av {kapitel.length} avklarat
          </p>
        </div>
        <p className="mt-4 font-display text-[1.6rem] font-normal leading-tight tracking-tight text-ink">
          {medNamn(k.rubrik, forening)}
        </p>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Det här vinner ni</p>
        <ul className="mt-3 space-y-2.5">
          {k.nytta.map((rad, i) => (
            <li
              key={rad}
              className="visning-in flex gap-3 text-[15px] leading-snug text-ink"
              style={{ animationDelay: `${250 + i * 110}ms` }}
            >
              <span aria-hidden="true" className="mt-0.5 text-moss">
                ✓
              </span>
              {medNamn(rad, forening)}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center gap-3">
          <Progressbar procent={procent} kapitelgranser={kapitelgranser(kapitel)} className="flex-1" />
          <span className="text-xs font-semibold tabular-nums text-muted">{procent} %</span>
        </div>
      </div>
      <div className="border-t border-line px-6 py-5 sm:px-8">
        {nasta ? (
          <p className="mb-4 text-sm text-muted">
            Nästa: <span className="font-semibold text-ink">{medNamn(nasta.rubrik, forening)}</span>
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onPausa} className={cn(knapp.sekundar, "whitespace-nowrap")}>
            Pausa här
          </button>
          <button type="button" onClick={onFortsatt} data-autofocus className={cn(knapp.primar, "whitespace-nowrap")}>
            {nasta ? `Fortsätt till kapitel ${kapitelIndex + 2}` : "Fortsätt"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </Dialogruta>
  );
}

/** Kapitelval och översikt: vad som är gjort, vad som återstår, fortsätt eller börja om. */
export function Kapitelmeny({
  kapitel,
  framsteg,
  procent,
  forening,
  onValj,
  onFortsatt,
  onStartaOm,
  onSammanfattning,
  onStang,
}: {
  kapitel: VisningsKapitel[];
  framsteg: Framsteg;
  procent: number;
  forening: string | null;
  onValj: (kapitelIndex: number) => void;
  onFortsatt: () => void;
  onStartaOm: () => void;
  onSammanfattning: () => void;
  onStang: () => void;
}) {
  const avklarade = antalAvklarade(framsteg, kapitel);
  const paborjad = framsteg.lage === "aktiv" || framsteg.lage === "pausad";
  const harFramsteg = procent > 0 || avklarade > 0;

  return (
    <Dialogruta rubrik="Guidad visning – kapitel" onEscape={onStang}>
      <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-7">
        <div className="flex items-center gap-4">
          <div className="relative text-moss">
            <Progressring procent={procent} storlek={56} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-ink">
              {procent}%
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-moss">Guidad visning</p>
            <p className="mt-1 font-display text-2xl font-normal tracking-tight text-ink">Kapitel</p>
            <p className="mt-0.5 text-sm text-muted">
              {avklarade} av {kapitel.length} avklarade
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStang}
          aria-label="Stäng"
          className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink focus-visible:outline-moss"
        >
          <StangIkon />
        </button>
      </div>

      <ol className="mt-5 space-y-1 px-3 sm:px-5">
        {kapitel.map((k, i) => {
          const klart = framsteg.avklaradeKapitel.includes(k.id);
          const overhoppat = !klart && framsteg.overhoppadeKapitel.includes(k.id);
          const pagar = paborjad && framsteg.kapitel === i;
          return (
            <li key={k.id}>
              <button
                type="button"
                onClick={() => onValj(i)}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-bone focus-visible:outline-moss",
                  pagar && "bg-bone",
                )}
              >
                {klart ? (
                  <Bock className="h-8 w-8 shrink-0 text-moss" />
                ) : (
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm tabular-nums",
                      pagar ? "border-moss text-moss" : "border-line text-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">
                    {medNamn(k.rubrik, forening)}
                    {k.tillval ? <TillvalEtikett /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">{medNamn(k.kort, forening)}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {klart ? "Avklarat" : overhoppat ? "Överhoppat" : pagar ? "Pågår" : `${k.steg.length} steg`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        {harFramsteg ? (
          <button type="button" onClick={onStartaOm} className={knapp.sekundar}>
            Börja om
          </button>
        ) : (
          <span />
        )}
        {framsteg.lage === "klar" ? (
          <button type="button" onClick={onSammanfattning} data-autofocus className={knapp.primar}>
            Se sammanfattningen
          </button>
        ) : (
          <button type="button" onClick={onFortsatt} data-autofocus className={knapp.primar}>
            {paborjad || harFramsteg ? "Fortsätt där du var" : "Starta visningen"}
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </Dialogruta>
  );
}

/** Avslutningen: vad hemsidan ger föreningen, och en diskret väg vidare. */
export function Avslutning({
  kapitel,
  forening,
  avklarade,
  kontaktEpost,
  onStang,
}: {
  kapitel: VisningsKapitel[];
  forening: string | null;
  /** Antal avklarade (inte överhoppade) kapitel. */
  avklarade: number;
  /** Mottagaren för kontaktformuläret, som reserv om det inte går att skicka. */
  kontaktEpost?: string;
  onStang: () => void;
}) {
  const [kontakt, setKontakt] = useState(false);

  if (kontakt) {
    return (
      <Dialogruta rubrik="Kontakta oss" onEscape={onStang} bred>
        <Kontaktformular
          forening={forening}
          kontaktEpost={kontaktEpost}
          onTillbaka={() => setKontakt(false)}
          onStang={onStang}
        />
      </Dialogruta>
    );
  }

  return (
    <Dialogruta rubrik="Visningen är klar" onEscape={onStang} bred>
      <div className="bg-bone/70 px-6 pb-6 pt-7 sm:px-9 sm:pt-9">
        <div className="flex items-center gap-3">
          <Bock ritad className="h-8 w-8 shrink-0 text-moss" />
          <p className="text-sm font-semibold text-moss">
            {avklarade === kapitel.length
              ? `Alla ${kapitel.length} kapitel genomgångna`
              : `Visningen är klar · ${avklarade} av ${kapitel.length} kapitel avklarade`}
          </p>
        </div>
        <p className="mt-4 font-display text-[1.75rem] font-normal leading-[1.15] tracking-tight text-ink sm:text-[2.125rem]">
          {medNamn("En hemsida som arbetar för {forening}", forening)}
        </p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Mindre administration, enklare kommunikation och tydligare ansvar – samlat på ett ställe. Styrelsen
          sköter innehållet, vi sköter tekniken.
        </p>
      </div>

      <ul className="grid gap-x-6 gap-y-4 px-6 py-6 sm:grid-cols-2 sm:px-9">
        {kapitel.map((k, i) => (
          <li
            key={k.id}
            className="visning-in flex gap-3"
            style={{ animationDelay: `${200 + i * 90}ms` }}
          >
            <span aria-hidden="true" className="mt-0.5 text-moss">
              ✓
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">
                {medNamn(k.rubrik, forening)}
                {k.tillval ? <TillvalEtikett /> : null}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-muted">{medNamn(k.kort, forening)}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Fast i rutans nederkant, så att knapparna syns utan att man rullar. */}
      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-9">
        <button type="button" onClick={() => setKontakt(true)} className={knapp.primar}>
          Kontakta oss
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={onStang} data-autofocus className={knapp.sekundar}>
          Utforska sidan på egen hand
        </button>
      </div>
    </Dialogruta>
  );
}
