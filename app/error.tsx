"use client";

import { useEffect } from "react";
import { ErrorActions } from "./error-actions";

export default function Error({
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
    <main className="site-shell error-shell">
      <section className="error-panel">
        <p className="eyebrow">Something went wrong</p>
        <h1>We could not load this part of the site.</h1>
        <p>
          Please try again. If it keeps happening, check the Supabase and Render
          environment settings.
        </p>
        <ErrorActions reset={reset} />
      </section>
    </main>
  );
}
