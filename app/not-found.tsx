import { ErrorActions } from "./error-actions";

export default function NotFound() {
  return (
    <main className="site-shell error-shell">
      <section className="error-panel">
        <p className="eyebrow">Page not found</p>
        <h1>This page is not available.</h1>
        <p>
          The link may be old, mistyped, or no longer part of the TMWC Youth
          Services MVP.
        </p>
        <ErrorActions />
      </section>
    </main>
  );
}
