import { ErrorActions } from "../error-actions";

export default function UnauthorizedPage() {
  return (
    <main className="site-shell error-shell">
      <section className="error-panel">
        <p className="eyebrow">Sign in required</p>
        <h1>Please sign in to continue.</h1>
        <p>
          Staff and admin tools are protected so guest requests and contact
          details stay private.
        </p>
        <ErrorActions />
      </section>
    </main>
  );
}
