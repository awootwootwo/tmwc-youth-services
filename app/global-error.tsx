"use client";

import { useEffect } from "react";
import { ErrorActions } from "./error-actions";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="site-shell error-shell">
          <section className="error-panel">
            <p className="eyebrow">Site error</p>
            <h1>The site hit an unexpected problem.</h1>
            <p>
              The public pages are protected by a fallback screen while the team
              checks the app settings.
            </p>
            <ErrorActions reset={reset} />
          </section>
        </main>
      </body>
    </html>
  );
}
