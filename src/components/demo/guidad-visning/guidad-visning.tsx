"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDemoForening } from "@/components/demo/use-demo-forening";
import { useTransition } from "@/components/page-transition/TransitionProvider";
import { DEMO_ADMIN_COOKIE } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { Avslutning, KapitelKlart, Kapitelmeny, Valkomst } from "./dialoger";
import {
  antalAvklarade,
  lasFramsteg,
  nyckelFor,
  NYTT_FRAMSTEG,
  procentKlart,
  sparaFramsteg,
  stegId,
  useFramsteg,
  type Framsteg,
} from "./framsteg";
import { kapitelFor, medNamn, type VisningsSteg } from "./kapitel";
import { MENYKNAPP, MENYPANEL, menynArFramme, oppnaMenyn, stangMenyn } from "./meny";
import { Pekare } from "./pekare";
import { rektFor, Spotlight, type Rekt } from "./spotlight";
import { STARTA_HANDELSE } from "./starta-knapp";
import { StegRuta } from "./steg-ruta";
import { Progressring, useReduceradRorelse } from "./ui";

type Vy = { typ: "kapitelKlart"; kapitel: number } | { typ: "meny" } | { typ: "avslutning" } | null;

/** Hur länge ett steg väntar på att dess element ska dyka upp (dynamiskt innehåll). */
const VANTA_PA_MAL_MS = 4000;
/** Välkomstrutan väntar tills heron hunnit tona fram. */
const VALKOMST_FORDROJNING_MS = 1600;
/** Ungefärlig höjd på informationsrutan inklusive avstånd – vid autoscroll. */
const RUTANS_HOJD = 390;
/** Senast då står ett ingenRullning-steg i toppen och låses, även om den mjuka rullningen avbröts. */
const TOPPEN_SENAST_MS = 1500;
/**
 * Attribut på <html> som låser rullningen (globals.css). Inte inline-stil:
 * sidomenyn låser med inline-stil och återställer den när den stängs.
 */
const LAS = "data-visning-las";
/** Menysteget: när pekaren trycker på ⋯ (i takt med .visning-pekare), och senast då menyn räknas som framme. */
const PEKAREN_KLICKAR_MS = 640;
const MENYN_GLIDER_SENAST_MS = 1000;
const MENYPANELEN = [MENYPANEL];

type MenyFas = "pekar" | "oppnar" | "oppen";

/**
 * Den guidade visningen: välkomstruta vid första besöket, kapitel med markerade
 * funktioner, sammanfattning efter varje kapitel och en avslutning. Kapitlen och
 * texterna ligger i kapitel.ts.
 *
 * Renderas av SiteChrome på demosajten, även utan DEMO_MODE – aldrig på
 * föreningarnas riktiga hemsidor. Med `demo` (DEMO_MODE=true) tas adminsidorna med.
 */
export function GuidadVisning({ demo, kontaktEpost }: { demo: boolean; kontaktEpost?: string }) {
  const kapitel = kapitelFor(demo);
  const forening = useDemoForening();
  const nyckel = nyckelFor(forening);
  const framsteg = useFramsteg(nyckel, kapitel);
  const pathname = usePathname();
  const router = useRouter();
  const { isTransitioning, startTransition } = useTransition();
  const reducerad = useReduceradRorelse();

  const [vy, setVy] = useState<Vy>(null);
  const [notis, setNotis] = useState<string | null>(null);
  const [valkomstRedo, setValkomstRedo] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setValkomstRedo(true), VALKOMST_FORDROJNING_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!notis) return;
    const t = window.setTimeout(() => setNotis(null), 4500);
    return () => window.clearTimeout(t);
  }, [notis]);

  const spara = useCallback(
    (andring: Partial<Framsteg>) => sparaFramsteg(nyckel, { ...lasFramsteg(nyckel, kapitel), ...andring }),
    [nyckel, kapitel],
  );

  const aktiv = framsteg?.lage === "aktiv" && vy === null;
  const kIndex = framsteg?.kapitel ?? 0;
  const sIndex = framsteg?.steg ?? 0;
  const steg: VisningsSteg | null = aktiv ? (kapitel[kIndex]?.steg[sIndex] ?? null) : null;
  const procent = framsteg ? procentKlart(framsteg, kapitel) : 0;

  const gaTill = useCallback(
    (sida: string) => {
      // Adminsidorna (bara med i demoläget) kräver visningslägets cookie. Routen sätter
      // den och laddar om sidan; visningen fortsätter sedan från det sparade framsteget.
      if (sida.startsWith("/admin") && !harAdminCookie()) {
        window.location.assign("/admin/demo");
        return;
      }
      if (reducerad) router.push(sida);
      else startTransition(() => router.push(sida));
    },
    [reducerad, router, startTransition],
  );

  // --- Rätt sida för steget -------------------------------------------------
  const forvantadSida = useRef<string | null>(null);
  const sistaSida = useRef(pathname);
  const pausaRef = useRef<() => void>(() => {});

  useEffect(() => {
    const bytt = sistaSida.current !== pathname;
    sistaSida.current = pathname;
    if (!steg) return;
    if (pathname === steg.sida) {
      forvantadSida.current = null;
      return;
    }
    // Besökaren har själv gått till en annan sida (t.ex. bakåtknappen):
    // pausa i stället för att dra tillbaka hen.
    if (bytt && forvantadSida.current !== steg.sida) {
      pausaRef.current();
      return;
    }
    if (forvantadSida.current === steg.sida) return;
    forvantadSida.current = steg.sida;
    gaTill(steg.sida);
  }, [pathname, steg, gaTill]);

  const stegNyckel = `${kIndex}/${sIndex}`;
  const paSidan = steg !== null && pathname === steg.sida && !isTransitioning;

  // --- Menysteget: pekaren klickar på ⋯ och menyn öppnas --------------------
  const [meny, setMeny] = useState<{ steg: string; fas: MenyFas } | null>(null);
  const menySteg = paSidan && steg?.oppnaMeny ? stegNyckel : null;
  const menyFas = menySteg !== null && meny?.steg === menySteg ? meny.fas : null;
  const vantaPaToppen = steg?.ingenRullning === true;

  useEffect(() => {
    if (!menySteg) return;
    const html = document.documentElement;
    const timers: number[] = [];
    let raf = 0;
    const borja = () => {
      // Menyn låser rullningen när den öppnas, och då avbryter Firefox en mjuk
      // rullning – vänta tills sidan står still i toppen.
      if (vantaPaToppen && !html.hasAttribute(LAS)) {
        raf = window.requestAnimationFrame(borja);
        return;
      }
      if (reducerad) {
        oppnaMenyn();
        setMeny({ steg: menySteg, fas: "oppen" });
        return;
      }
      setMeny({ steg: menySteg, fas: "pekar" });
      timers.push(
        window.setTimeout(() => {
          oppnaMenyn();
          setMeny({ steg: menySteg, fas: "oppnar" });
          // Rutan visas när menyn glidit på plats – annars följer den med i glidet.
          const start = performance.now();
          const glider = () => {
            if (menynArFramme() || performance.now() - start > MENYN_GLIDER_SENAST_MS) {
              setMeny({ steg: menySteg, fas: "oppen" });
              return;
            }
            raf = window.requestAnimationFrame(glider);
          };
          raf = window.requestAnimationFrame(glider);
        }, PEKAREN_KLICKAR_MS),
      );
    };
    raf = window.requestAnimationFrame(borja);
    return () => {
      window.cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      stangMenyn();
      setMeny(null);
    };
  }, [menySteg, vantaPaToppen, reducerad]);

  // --- Hitta och följa det markerade elementet ------------------------------
  // Menysteget markerar ⋯ medan pekaren klickar och sedan den öppna menyn.
  const malValjare = steg?.oppnaMeny ? (menyFas === "pekar" ? steg.mal : MENYPANELEN) : steg?.mal;
  const malNyckel = steg?.oppnaMeny ? (menyFas === null ? null : menyFas === "pekar" ? "knapp" : "meny") : "mal";
  const pastegNyckel = paSidan && malNyckel ? `${stegNyckel}/${malNyckel}` : null;
  const [hittat, setHittat] = useState<{ nyckel: string; el: Element | null } | null>(null);

  useEffect(() => {
    if (!pastegNyckel || !steg) return;
    const start = Date.now();
    const leta = () => {
      const el = hittaMal(malValjare);
      if (!el && malValjare?.length && Date.now() - start < VANTA_PA_MAL_MS) return false;
      // Steg med ingenRullning rullas till toppen av effekten som låser rullningen.
      if (el && !steg.ingenRullning) scrollaTill(el, reducerad);
      setHittat({ nyckel: pastegNyckel, el });
      return true;
    };
    // Vänta en bildruta så att sidbytets innehåll hunnit renderas.
    const id = window.setInterval(() => {
      if (leta()) window.clearInterval(id);
    }, 120);
    return () => window.clearInterval(id);
  }, [pastegNyckel, steg, malValjare, reducerad]);

  // Samma steg: det förra målet ligger kvar tills nästa hittats (menystegets faser).
  const mal = hittat && pastegNyckel && hittat.nyckel.startsWith(`${stegNyckel}/`) ? hittat.el : undefined;
  const [rekt, setRekt] = useState<{ el: Element; rekt: Rekt | null } | null>(null);

  useEffect(() => {
    if (!mal) return;
    let raf = 0;
    let forra = "";
    const folj = () => {
      const r = rektFor(mal);
      const nu = r ? `${r.top}|${r.left}|${r.width}|${r.height}` : "-";
      if (nu !== forra) {
        forra = nu;
        setRekt({ el: mal, rekt: r });
      }
      raf = window.requestAnimationFrame(folj);
    };
    raf = window.requestAnimationFrame(folj);
    return () => window.cancelAnimationFrame(raf);
  }, [mal]);

  const aktuellRekt = mal && rekt?.el === mal ? rekt.rekt : null;

  // Demobanderollen göms medan ett steg visas – på mobilen ligger den annars
  // över heron, mitt i det som markeras.
  const visarSteg = steg !== null;
  useEffect(() => {
    if (!visarSteg) return;
    document.documentElement.setAttribute("data-guidad-visning", "");
    return () => document.documentElement.removeAttribute("data-guidad-visning");
  }, [visarSteg]);

  // Steg med ingenRullning (startsidans film, menyn) visar sidan från toppen och
  // låser rullningen medan steget visas. Låset slås på först när sidan nått
  // toppen: Firefox avbryter annars den mjuka rullningen, och sidan blir stående
  // låst där den var (t.ex. vid Tillbaka).
  const toppSteg = steg?.ingenRullning === true && pathname === steg.sida ? stegNyckel : null;
  useEffect(() => {
    if (!toppSteg) return;
    const html = document.documentElement;
    let last = false;
    let reserv = 0;

    function las() {
      if (last) return;
      last = true;
      window.removeEventListener("scroll", vidRullning);
      window.clearTimeout(reserv);
      // Avbröts den mjuka rullningen (t.ex. med hjulet) hoppar sidan sista biten.
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
      html.setAttribute(LAS, "");
    }
    function vidRullning() {
      if (window.scrollY < 1) las();
    }

    if (reducerad || window.scrollY < 1) {
      las();
    } else {
      window.addEventListener("scroll", vidRullning, { passive: true });
      reserv = window.setTimeout(las, TOPPEN_SENAST_MS);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return () => {
      window.removeEventListener("scroll", vidRullning);
      window.clearTimeout(reserv);
      html.removeAttribute(LAS);
    };
  }, [toppSteg, reducerad]);

  // --- Handlingar -----------------------------------------------------------
  const pausa = useCallback(() => {
    spara({ lage: "pausad" });
    setVy(null);
    setNotis("Visningen är pausad – fortsätt när du vill.");
  }, [spara]);

  useEffect(() => {
    pausaRef.current = pausa;
  }, [pausa]);

  const visaAvslutning = useCallback(() => {
    setVy({ typ: "avslutning" });
    if (pathname !== "/") gaTill("/");
  }, [gaTill, pathname]);

  // Avslutningen visas ovanpå startsidans hero, med föreningens namn i bakgrunden.
  const visarAvslutning = vy?.typ === "avslutning";
  useEffect(() => {
    if (visarAvslutning && pathname === "/") window.scrollTo({ top: 0, behavior: "instant" });
  }, [visarAvslutning, pathname]);

  const nasta = useCallback(() => {
    const f = lasFramsteg(nyckel, kapitel);
    const k = kapitel[f.kapitel];
    const klaraSteg = Array.from(new Set([...f.klaraSteg, stegId(kapitel, f.kapitel, f.steg)]));
    if (f.steg + 1 < k.steg.length) {
      spara({ steg: f.steg + 1, klaraSteg });
      return;
    }
    const avklaradeKapitel = Array.from(new Set([...f.avklaradeKapitel, k.id]));
    const overhoppadeKapitel = f.overhoppadeKapitel.filter((id) => id !== k.id);
    const sista = f.kapitel + 1 >= kapitel.length;
    spara({
      klaraSteg,
      avklaradeKapitel,
      overhoppadeKapitel,
      kapitel: sista ? 0 : f.kapitel + 1,
      steg: 0,
      lage: sista ? "klar" : "aktiv",
    });
    if (sista) visaAvslutning();
    else setVy({ typ: "kapitelKlart", kapitel: f.kapitel });
  }, [nyckel, kapitel, spara, visaAvslutning]);

  const tillbaka = useCallback(() => {
    const f = lasFramsteg(nyckel, kapitel);
    if (f.steg > 0) spara({ steg: f.steg - 1 });
    else if (f.kapitel > 0) spara({ kapitel: f.kapitel - 1, steg: kapitel[f.kapitel - 1].steg.length - 1 });
  }, [nyckel, kapitel, spara]);

  const hoppaOver = useCallback(() => {
    const f = lasFramsteg(nyckel, kapitel);
    const k = kapitel[f.kapitel];
    const overhoppadeKapitel = f.avklaradeKapitel.includes(k.id)
      ? f.overhoppadeKapitel
      : Array.from(new Set([...f.overhoppadeKapitel, k.id]));
    if (f.kapitel + 1 < kapitel.length) {
      spara({ kapitel: f.kapitel + 1, steg: 0, overhoppadeKapitel });
    } else {
      spara({ kapitel: 0, steg: 0, overhoppadeKapitel, lage: "klar" });
      visaAvslutning();
    }
  }, [nyckel, kapitel, spara, visaAvslutning]);

  const startaKapitel = useCallback(
    (index: number) => {
      spara({ lage: "aktiv", kapitel: index, steg: 0 });
      setVy(null);
    },
    [spara],
  );

  const startaOm = useCallback(() => {
    sparaFramsteg(nyckel, { ...NYTT_FRAMSTEG, lage: "aktiv" });
    setVy(null);
  }, [nyckel]);

  const fortsatt = useCallback(() => {
    spara({ lage: "aktiv" });
    setVy(null);
  }, [spara]);

  // Demokortets knapp (StartaVisningKnapp) startar visningen – eller fortsätter där besökaren var.
  useEffect(() => {
    const starta = () => {
      setNotis(null);
      if (lasFramsteg(nyckel, kapitel).lage === "klar") startaOm();
      else fortsatt();
    };
    window.addEventListener(STARTA_HANDELSE, starta);
    return () => window.removeEventListener(STARTA_HANDELSE, starta);
  }, [nyckel, kapitel, startaOm, fortsatt]);

  // Piltangenter bläddrar, Esc pausar – bara medan ett steg visas.
  useEffect(() => {
    if (!steg) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") nasta();
      else if (event.key === "ArrowLeft") tillbaka();
      else if (event.key === "Escape") pausa();
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [steg, nasta, tillbaka, pausa]);

  // --- Rendering ------------------------------------------------------------
  if (!framsteg) return null;

  if (framsteg.lage === "ny" && vy === null) {
    if (!valkomstRedo) return null;
    return (
      <Valkomst
        kapitel={kapitel}
        forening={forening}
        onStarta={() => spara({ lage: "aktiv", kapitel: 0, steg: 0 })}
        onUtforska={() => {
          spara({ lage: "utforskar" });
          setNotis("Den guidade visningen finns här när du vill.");
        }}
      />
    );
  }

  if (vy?.typ === "kapitelKlart") {
    return (
      <KapitelKlart
        kapitel={kapitel}
        kapitelIndex={vy.kapitel}
        procent={procent}
        forening={forening}
        onFortsatt={() => setVy(null)}
        onPausa={pausa}
      />
    );
  }

  if (vy?.typ === "avslutning") {
    return (
      <Avslutning
        kapitel={kapitel}
        forening={forening}
        avklarade={antalAvklarade(framsteg, kapitel)}
        kontaktEpost={kontaktEpost}
        onStang={() => {
          setVy(null);
          setNotis("Klicka runt fritt – visningen finns kvar här nere.");
        }}
      />
    );
  }

  if (vy?.typ === "meny") {
    return (
      <Kapitelmeny
        kapitel={kapitel}
        framsteg={framsteg}
        forening={forening}
        procent={procent}
        onValj={startaKapitel}
        onFortsatt={fortsatt}
        onStartaOm={startaOm}
        onSammanfattning={() => setVy({ typ: "avslutning" })}
        onStang={() => setVy(null)}
      />
    );
  }

  if (steg) {
    // Medan sidan byts eller elementet letas fram syns bara toningen. I menysteget
    // visas rutan först när menyn har glidit fram.
    const visaRuta = mal !== undefined && (!steg.oppnaMeny || menyFas === "oppen");
    return (
      <>
        <Spotlight rekt={aktuellRekt} stegNyckel={stegNyckel} />
        {steg.oppnaMeny && menyFas !== null ? (
          <Pekare valjare={MENYKNAPP} undvik={MENYPANEL} text={medNamn(steg.oppnaMeny.pekare, forening)} />
        ) : null}
        {visaRuta ? (
          <StegRuta
            kapitel={kapitel}
            kapitelIndex={kIndex}
            stegIndex={sIndex}
            rekt={aktuellRekt}
            procent={procent}
            forening={forening}
            onNasta={nasta}
            onTillbaka={tillbaka}
            onPausa={pausa}
            onHoppaOver={hoppaOver}
            onKapitel={() => setVy({ typ: "meny" })}
          />
        ) : null}
      </>
    );
  }

  return (
    <Visningsknapp
      framsteg={framsteg}
      procent={procent}
      notis={notis}
      onClick={() => {
        setNotis(null);
        setVy({ typ: "meny" });
      }}
    />
  );
}

/** Diskret knapp nere till vänster – demobanderollen ligger till höger (mobil: överst). */
function Visningsknapp({
  framsteg,
  procent,
  notis,
  onClick,
}: {
  framsteg: Framsteg;
  procent: number;
  notis: string | null;
  onClick: () => void;
}) {
  const klar = framsteg.lage === "klar";
  const etikett = klar
    ? "Guidad visning"
    : framsteg.lage === "pausad" || procent > 0
      ? "Fortsätt visningen"
      : "Guidad visning";

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 font-body sm:bottom-6 sm:left-6">
      {notis ? (
        <p role="status" className="visning-in max-w-[16rem] rounded-2xl border border-line bg-surface/95 px-4 py-2.5 text-xs leading-snug text-ink shadow-lg backdrop-blur">
          {notis}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        aria-label={`${etikett}, ${procent} procent genomgånget`}
        className={cn(
          "visning-in group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-line bg-surface/95 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-ink shadow-[0_12px_32px_-14px_rgb(22_24_21/0.45)] backdrop-blur",
          "transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-surface focus-visible:outline-moss motion-reduce:hover:translate-y-0",
        )}
      >
        <span className="relative inline-flex h-8 w-8 items-center justify-center text-moss">
          <Progressring procent={klar ? 100 : procent} storlek={32} className="absolute inset-0" />
          <span aria-hidden="true" className="text-[11px]">
            {klar ? "✓" : "▶"}
          </span>
        </span>
        {etikett}
        {!klar && procent > 0 ? <span className="font-medium tabular-nums text-muted">{procent} %</span> : null}
      </button>
    </div>
  );
}

function harAdminCookie(): boolean {
  return document.cookie.split("; ").some((c) => c === `${DEMO_ADMIN_COOKIE}=1`);
}

/** Första väljaren som pekar på ett synligt element. */
function hittaMal(valjare: string[] | undefined): Element | null {
  for (const v of valjare ?? []) {
    let el: Element | null = null;
    try {
      el = document.querySelector(v);
    } catch {
      continue;
    }
    if (el && el.getClientRects().length > 0) return el;
  }
  return null;
}

function arFast(el: Element): boolean {
  for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) {
    if (getComputedStyle(e).position === "fixed") return true;
  }
  return false;
}

/**
 * Rullar elementet till en bekväm plats: en bit under överkanten. På mobilen
 * ligger rutan som ett ark längst ned, så elementet hamnar högt upp.
 */
function scrollaTill(el: Element, reducerad: boolean) {
  if (arFast(el)) return;
  const r = el.getBoundingClientRect();
  const hojd = window.innerHeight;
  const mobil = window.innerWidth < 640;
  const topp = mobil ? 88 : 72;
  // Utrymmet under elementet som informationsrutan behöver (mobil: arket).
  const reserv = mobil ? hojd * 0.5 : RUTANS_HOJD;
  if (r.top >= topp && r.bottom + reserv <= hojd) return;
  const onskad = mobil ? topp : Math.max(topp, (hojd - r.height - RUTANS_HOJD) / 2);
  window.scrollTo({ top: window.scrollY + r.top - onskad, behavior: reducerad ? "auto" : "smooth" });
}
