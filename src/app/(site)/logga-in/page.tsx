import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardBody, Container, Section } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { demolageAktivt } from "@/lib/demo";
import { safeNextPath } from "@/lib/utils";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Logga in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, params] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);
  // requireAdmin/requireApprovedMember skickar hit med ?next=<skyddad sida>.
  const next = safeNextPath(params.next);
  if (user) {
    redirect(next ?? (user.role === "admin" ? "/admin" : "/medlem"));
  }

  return (
    <Section>
      <Container className="max-w-md">
        <h1 className="title-page text-center text-[2.5rem] sm:text-[3rem]">
          Logga in
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          För boende och styrelse i föreningen.
        </p>
        {/* Demoläget: besökaren har inget konto – visa vägen till visningsläget. */}
        {demolageAktivt() ? (
          <a
            href="/admin/demo"
            className="mt-6 block rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm text-brand-900 transition-colors hover:bg-brand-100"
          >
            <strong className="font-semibold">Det här är en demo.</strong> Prova
            styrelsens adminpanel utan inloggning →
          </a>
        ) : null}
        <Card className="mt-6">
          <CardBody>
            <LoginForm next={next} />
          </CardBody>
        </Card>
      </Container>
    </Section>
  );
}
