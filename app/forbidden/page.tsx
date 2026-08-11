import { ErrorActions } from "../error-actions";

export default function ForbiddenPage() {
  return (
    <main className="site-shell error-shell">
      <section className="error-panel">
        <p className="eyebrow">Access blocked</p>
        <h1>This account cannot open that page.</h1>
        <p>
          Some tools are limited to admins or assigned staff members. Use a
          different approved account if you need access.
        </p>
        <ErrorActions />
      </section>
    </main>
  );
}
