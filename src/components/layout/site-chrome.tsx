import { DemoBanderoll } from "@/components/demo/demo-banderoll";
import { DemoTitel } from "@/components/demo/demo-titel";
import { GuidadVisning } from "@/components/demo/guidad-visning/guidad-visning";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { TransitionProvider } from "@/components/page-transition/TransitionProvider";
import { PageTransition } from "@/components/page-transition/PageTransition";
import { getAssociationProfile, getSiteContent } from "@/lib/data";
import { demolageAktivt, somDemon } from "@/lib/demo";

/**
 * Header, innehåll och footer. Används av (site)/layout.tsx och av 404-sidan,
 * som ligger i roten och därför inte får sajtens layout på köpet.
 */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [siteContent, profile] = await Promise.all([
    getSiteContent(),
    getAssociationProfile(),
  ]);
  const association = somDemon(profile);

  return (
    <div className="flex min-h-screen flex-col">
      {/*
        SiteHeader är inte sticky längre.
        På startsidan är den en helskärmshero. På övriga sidor är den en
        vanlig statisk toppheader. NavDrawer renderas via portal till body.
      */}
      <TransitionProvider>
        <SiteHeader
          association={association}
          heroTitle={siteContent.heroTitle}
          heroSubtitle={siteContent.heroSubtitle}
          demo={demolageAktivt()}
        />

        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>

        <SiteFooter association={association} demo={demolageAktivt()} />
        {/* Syns bara när demon öppnats via en personlig demolänk (demoläget). */}
        <DemoBanderoll guidadVisning={demolageAktivt()} />
        {demolageAktivt() ? <DemoTitel namn={association.name} /> : null}
        {/* Guidad visning – även utan DEMO_MODE, men aldrig på föreningarnas riktiga
            hemsidor. Adminsidorna tas bara med i demoläget (visningsläget kräver det). */}
        <GuidadVisning demo={demolageAktivt()} kontaktEpost={process.env.DEMO_KONTAKT_EPOST || undefined} />
      </TransitionProvider>
    </div>
  );
}
