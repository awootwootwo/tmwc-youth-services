import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="site-shell auth-shell">
      <header className="site-header">
        <a className="brand text-brand" href="/">
          TMWC Youth Services
        </a>
        <nav aria-label="Primary navigation">
          <a href="/">Home</a>
        </nav>
      </header>

      <section className="content-section narrow-section">
        <div className="section-heading">
          <p className="eyebrow">Staff Access</p>
          <h1>Sign in to manage requests.</h1>
          <p>
            Staff accounts are created by an admin. Public registration is not
            enabled for this MVP.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
