import type { Metadata } from "next";
import Link from "next/link";
import { categoryLabel, getEconomyFigures, getPublicDocuments } from "@/lib/data";
import { DOCUMENT_PAGES } from "@/lib/document-pages";
import { publishedFigures, type FigureOk } from "@/lib/key-figures";
import type { DocumentItem } from "@/lib/types";
import { Container, PageIntro, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Ekonomi och dokument",
  description: "Föreningens nyckeltal, årsredovisningar och stadgar på ett ställe.",
};

/**
 * Nyckeltalen, årsredovisningarna och stadgarna på en sida – nyckeltalen överst och
 * störst. Sidan finns för den guidade visningen (steget "dokument" i
 * src/components/demo/guidad-visning/kapitel.ts), som visar alla tre i ett steg. Den
 * ligger inte i menyn; /ekonomi, /arsredovisningar och /stadgar finns kvar som förut
 * och länkas härifrån.
 *
 * Det markerade blocket (data-tour) är smalare än sidan med flit: på datorn får
 * visningens informationsruta plats bredvid det, där förklaringen av nyckeltalen
 * annars står. På mobilen ligger rutan längst ned, och nyckeltalen överst i blocket
 * syns ovanför den.
 */
export default async function EkonomiOchDokumentPage() {
  const [economy, documents] = await Promise.all([
    getEconomyFigures(),
    getPublicDocuments(),
  ]);
  const figures = publishedFigures(economy);

  return (
    <Section>
      <Container>
        <PageIntro
          eyebrow="Om föreningen"
          title="Ekonomi och dokument"
          description="Nyckeltalen, årsredovisningarna och stadgarna, samlade på ett ställe för boende, mäklare och köpare."
        />

        <div className="mt-10 grid gap-12 sm:mt-12 lg:grid-cols-[minmax(0,41rem)_minmax(0,1fr)] lg:gap-14">
          <div data-tour="ekonomi-och-dokument" className="space-y-4 sm:space-y-5">
            <Nyckeltal figures={figures} fiscalYear={economy.fiscalYear} />

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <Dokumentkort
                id="arsredovisningar"
                rubrik="Årsredovisningar"
                href="/arsredovisningar"
                rader={arsredovisningar(documents)}
              />
              <Dokumentkort
                id="stadgar"
                rubrik="Stadgar och regler"
                href="/stadgar"
                rader={stadgarOchRegler(documents)}
              />
            </div>
          </div>

          <OmNyckeltalen figures={figures} />
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Nyckeltalen – mörk yta i föreningens färg, som startsidans hero
// ---------------------------------------------------------------------------

function Nyckeltal({ figures, fiscalYear }: { figures: FigureOk[]; fiscalYear: string }) {
  if (figures.length === 0) return null;

  return (
    <section
      aria-labelledby="nyckeltal-rubrik"
      className="relative isolate overflow-hidden rounded-[1.25rem] bg-brand-900 px-5 py-5 text-white shadow-[0_28px_56px_-30px_rgb(22_24_21/0.55)] sm:px-8 sm:py-8"
    >
      {/* Ett svagt ljus uppe till höger, i samma ton som heron (--color-brand-*). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(110% 85% at 100% 0%, color-mix(in srgb, var(--color-brand-600) 50%, transparent) 0%, transparent 62%)",
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id="nyckeltal-rubrik" className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
          Nyckeltal
        </h2>
        {fiscalYear ? (
          <p className="rounded-full border border-white/20 px-3 py-0.5 text-xs font-medium text-white/80">
            Räkenskapsåret {fiscalYear}
          </p>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 sm:mt-8 sm:gap-x-8 sm:gap-y-7">
        {figures.map(({ figure, number, unit }) => (
          <div key={figure.id} className="border-t border-white/15 pt-3 sm:pt-4">
            <dt className="text-xs font-medium text-white/70 sm:text-sm">{figure.title}</dt>
            <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-2 sm:mt-2">
              <span className="font-display text-[1.875rem] font-light leading-none tracking-tight tabular-nums sm:text-[2.75rem]">
                {number}
              </span>
              <span className="whitespace-nowrap text-xs text-white/65 sm:text-sm">{unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Vad talen betyder – bredvid dem på datorn, under dokumenten på mobilen. */
function OmNyckeltalen({ figures }: { figures: FigureOk[] }) {
  if (figures.length === 0) return null;

  return (
    <aside aria-labelledby="om-nyckeltalen" className="lg:pt-1">
      <h2 id="om-nyckeltalen" className="eyebrow">
        Så läser du nyckeltalen
      </h2>
      <dl className="mt-5 space-y-5">
        {figures.map(({ figure }) => (
          <div key={figure.id}>
            <dt className="font-display text-[1.0625rem] leading-snug text-ink">{figure.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{figure.description}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted">
        Uträknade enligt årsredovisningslagens definitioner, på samma sätt som i
        årsredovisningen.
      </p>
      <Link href="/ekonomi" className="link-more mt-4">
        Mer om föreningens ekonomi <span aria-hidden="true" className="arrow">→</span>
      </Link>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Dokumenten
// ---------------------------------------------------------------------------

/** Ett dokument med namnet det visas med i översikten. */
interface Rad {
  doc: DocumentItem;
  namn: string;
}

/** Hur många årsredovisningar översikten visar – resten finns på /arsredovisningar. */
const ANTAL_ARSREDOVISNINGAR = 3;

/**
 * Räkenskapsåret ur titeln, som på /arsredovisningar: "Årsredovisning 2024" → 2024,
 * brutet räkenskapsår "2024/2025" → 2025. Null om titeln saknar årtal.
 */
function rakenskapsar(title: string): number | null {
  const years = title.match(/(?<!\d)(?:19|20)\d{2}(?!\d)/g);
  return years ? Math.max(...years.map(Number)) : null;
}

/**
 * Nyast räkenskapsår först, som på /arsredovisningar. Namnet blir "Årsredovisning
 * 2025" när titeln har ett årtal – samma form för alla år, oavsett hur titeln skrevs
 * vid uppladdningen.
 */
function arsredovisningar(documents: DocumentItem[]): Rad[] {
  return documents
    .filter((d) => DOCUMENT_PAGES.arsredovisningar.categories.includes(d.category))
    .map((doc) => ({ doc, ar: rakenskapsar(doc.title) }))
    .sort((a, b) => {
      if (a.ar === b.ar) return 0;
      if (a.ar === null) return 1;
      if (b.ar === null) return -1;
      return b.ar - a.ar;
    })
    .slice(0, ANTAL_ARSREDOVISNINGAR)
    .map(({ doc, ar }) => ({ doc, namn: ar ? `Årsredovisning ${ar}` : doc.title }));
}

/**
 * Stadgarna först, sedan ordningsreglerna. Ett ensamt dokument i sin kategori heter
 * som kategorin ("Stadgar"); finns flera visas titlarna, så att de går att skilja åt.
 */
function stadgarOchRegler(documents: DocumentItem[]): Rad[] {
  return DOCUMENT_PAGES.stadgar.categories.flatMap((category) => {
    const iKategorin = documents.filter((d) => d.category === category);
    return iKategorin.map((doc) => ({
      doc,
      namn: iKategorin.length === 1 ? categoryLabel(category) : doc.title,
    }));
  });
}

function Dokumentkort({
  id,
  rubrik,
  href,
  rader,
}: {
  id: string;
  rubrik: string;
  href: string;
  rader: Rad[];
}) {
  const rubrikId = `dokument-${id}`;
  return (
    <section
      aria-labelledby={rubrikId}
      className="rounded-card border border-border bg-surface px-5 pb-3 pt-5 shadow-[var(--card-shadow)] sm:px-6 sm:pt-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={rubrikId} className="title-card">
          {rubrik}
        </h2>
        <Link href={href} className="link-more text-[13px]">
          Till sidan <span aria-hidden="true" className="arrow">→</span>
        </Link>
      </div>

      {rader.length === 0 ? (
        <p className="pb-3 pt-4 text-sm text-muted">Inga dokument ännu.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {rader.map((rad) => (
            <li key={rad.doc.id}>
              <Dokumentrad {...rad} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Filtypen ur filnamnet, t.ex. "PDF". */
function filtyp(fileName: string): string | null {
  const match = fileName.match(/\.([a-z0-9]{2,5})$/i);
  return match ? match[1].toUpperCase() : null;
}

function Dokumentrad({ doc, namn }: Rad) {
  const typ = filtyp(doc.fileName);
  const meta = [typ, doc.sizeLabel].filter(Boolean).join(" · ");
  const innehall = (
    <>
      <span
        aria-hidden="true"
        className="flex h-10 w-9 shrink-0 items-end justify-center rounded-md border border-border bg-bone pb-1.5 text-[9px] font-bold tracking-[0.08em] text-moss"
      >
        {typ ?? "DOK"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-foreground transition-colors duration-200 group-hover:text-moss">
          {namn}
        </span>
        {meta ? <span className="mt-0.5 block text-xs text-muted">{meta}</span> : null}
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-moss transition-transform duration-300 group-hover:translate-y-0.5"
      >
        <path
          d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );

  // Utan uppladdad fil (demorad) visas posten, men inte som länk – som i DocumentList.
  return doc.hasFile ? (
    <a
      href={doc.fileUrl}
      target="_blank"
      rel="noopener"
      className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-200 hover:bg-sand/30"
    >
      {innehall}
    </a>
  ) : (
    <div className="flex items-center gap-3 py-3 opacity-60">{innehall}</div>
  );
}
