"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isChunkLoadError, reloadOnce } from "@/lib/chunk-reload";
import { DEMO_ADMIN_COOKIE } from "@/lib/demo";
import { Button, Card, CardBody } from "@/components/ui";

/**
 * Felgränsen i adminpanelen. I demons visningsläge stoppas varje sparning med
 * ett fel (src/lib/demo-admin.ts) – då visas ett vänligt besked i stället för
 * ett felmeddelande, och "Fortsätt" tar besökaren tillbaka till sidan.
 *
 * I produktion når felets text aldrig webbläsaren, därför avgörs visningsläget
 * på cookien och inte på felet.
 */
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  // Versionsglapp efter en deploy (src/lib/chunk-reload.ts): ladda om i stället
  // för att visa ett fel.
  useEffect(() => {
    if (isChunkLoadError(error)) reloadOnce();
  }, [error]);

  const demo = useSyncExternalStore(
    () => () => {},
    () => document.cookie.split("; ").includes(`${DEMO_ADMIN_COOKIE}=1`),
    () => false,
  );

  return (
    <Card className="mx-auto max-w-lg">
      <CardBody className="space-y-3 text-center">
        {demo ? (
          <>
            <p className="text-lg font-semibold">Det här är en demo</p>
            <p className="text-sm text-muted">
              I visningsläget sparas inga ändringar. På er egen hemsida hade det
              du gjorde sparats direkt.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">Något gick fel</p>
            <p className="text-sm text-muted">
              Sidan kunde inte visas. Försök igen om en stund.
            </p>
          </>
        )}
        <div className="pt-1">
          <Button type="button" onClick={reset}>
            {demo ? "Fortsätt" : "Försök igen"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
