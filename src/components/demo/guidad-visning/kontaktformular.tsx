"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field, FormError, Input, Textarea } from "@/components/ui";
import { DEMO_KONTAKT_STANDARD } from "@/lib/demo-kontakt";
import { HONEYPOT_FIELD } from "@/lib/form";
import { Bock, knapp } from "./ui";

type Status =
  | { typ: "redo" }
  | { typ: "skickar" }
  | { typ: "skickat"; epost: string }
  | { typ: "fel"; text: string; detalj?: string };

/**
 * Kontaktformuläret i avslutningen. Skickas till /api/demo-kontakt, som mejlar
 * via Resend med föreningens namn som avsändare och besökarens adress som
 * svarsadress. Knapparna ligger fast i rutans nederkant, så att de alltid syns.
 */
export function Kontaktformular({
  forening,
  kontaktEpost,
  onTillbaka,
  onStang,
}: {
  forening: string | null;
  kontaktEpost?: string;
  onTillbaka: () => void;
  onStang: () => void;
}) {
  const [status, setStatus] = useState<Status>({ typ: "redo" });
  const forstaFalt = useRef<HTMLInputElement>(null);
  const tackRef = useRef<HTMLButtonElement>(null);
  const skickaRef = useRef<HTMLButtonElement>(null);
  const reservadress = kontaktEpost || DEMO_KONTAKT_STANDARD;

  // Fokus till första fältet när formuläret visas, till knappen efter tacket och
  // tillbaka till Skicka efter ett fel (knappen tappar fokus medan den är avstängd).
  useEffect(() => {
    forstaFalt.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (status.typ === "skickat") tackRef.current?.focus({ preventScroll: true });
    if (status.typ === "fel") skickaRef.current?.focus({ preventScroll: true });
  }, [status.typ]);

  async function skicka(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setStatus({ typ: "skickar" });
    try {
      const res = await fetch("/api/demo-kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const svar = (await res.json().catch(() => ({}))) as { ok?: boolean; fel?: string; detalj?: string };
      // Routen svarar ok bara när Resend tagit emot mejlet (200).
      if (res.ok && svar.ok) setStatus({ typ: "skickat", epost: String(data.epost ?? "") });
      else setStatus({ typ: "fel", text: svar.fel ?? "Det gick inte att skicka just nu.", detalj: svar.detalj });
    } catch {
      setStatus({ typ: "fel", text: "Det gick inte att skicka just nu." });
    }
  }

  if (status.typ === "skickat") {
    return (
      <>
        <div className="px-6 pb-8 pt-9 sm:px-9">
          <Bock ritad className="h-10 w-10 text-moss" />
          <p className="mt-4 font-display text-[1.75rem] font-normal leading-tight tracking-tight text-ink">
            Tack för ditt meddelande!
          </p>
          <p role="status" className="mt-2 text-[15px] leading-relaxed text-muted">
            Det har kommit fram till oss, och vi svarar till {status.epost} så snart vi kan.
          </p>
        </div>
        <div className="sticky bottom-0 flex justify-end border-t border-line bg-surface px-6 py-4 sm:px-9">
          <button ref={tackRef} type="button" onClick={onStang} className={knapp.primar}>
            Utforska sidan på egen hand
          </button>
        </div>
      </>
    );
  }

  const skickar = status.typ === "skickar";
  return (
    <form onSubmit={skicka}>
      <div className="bg-bone/70 px-6 pb-5 pt-7 sm:px-9 sm:pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-moss">Kontakta oss</p>
        <p className="mt-2 font-display text-[1.6rem] font-normal leading-tight tracking-tight text-ink">
          Se hemsidan för {forening ?? "er förening"}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Lämna era uppgifter så hör vi av oss – gärna för att visa hemsidan på ert nästa styrelsemöte.
        </p>
      </div>

      <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-9">
        {/* Honeypot mot spam: dolt för både ögon och skärmläsare, och går inte att tabba till. */}
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="demo-kontakt-website">Lämna det här fältet tomt</label>
          <input id="demo-kontakt-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
        <Field label="Ditt namn" htmlFor="demo-kontakt-namn" required>
          <Input ref={forstaFalt} id="demo-kontakt-namn" name="namn" required maxLength={100} autoComplete="name" />
        </Field>
        <Field label="Förening" htmlFor="demo-kontakt-forening">
          <Input
            id="demo-kontakt-forening"
            name="forening"
            maxLength={120}
            autoComplete="organization"
            defaultValue={forening ?? ""}
          />
        </Field>
        <Field label="E-post" htmlFor="demo-kontakt-epost" required>
          <Input id="demo-kontakt-epost" name="epost" type="email" required maxLength={200} autoComplete="email" />
        </Field>
        <Field label="Telefon (valfritt)" htmlFor="demo-kontakt-telefon">
          <Input id="demo-kontakt-telefon" name="telefon" type="tel" maxLength={40} autoComplete="tel" />
        </Field>
        <Field label="Meddelande (valfritt)" htmlFor="demo-kontakt-meddelande" className="sm:col-span-2">
          <Textarea
            id="demo-kontakt-meddelande"
            name="meddelande"
            rows={3}
            maxLength={2000}
            className="min-h-20"
            placeholder="T.ex. när det passar att höras."
          />
        </Field>
        {status.typ === "fel" ? (
          <div className="sm:col-span-2" role="alert">
            <FormError>
              {status.text} Du kan också mejla{" "}
              <a href={`mailto:${reservadress}`} className="font-medium underline">
                {reservadress}
              </a>
              .
            </FormError>
            {/* Bara vid utveckling: Resends svar, så att felet går att rätta. */}
            {status.detalj ? <p className="mt-1.5 break-words font-mono text-xs text-muted">{status.detalj}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-surface px-6 py-4 sm:px-9">
        <button type="button" onClick={onTillbaka} className={knapp.sekundar}>
          Tillbaka
        </button>
        <button ref={skickaRef} type="submit" disabled={skickar} className={knapp.primar}>
          {skickar ? "Skickar…" : "Skicka"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
