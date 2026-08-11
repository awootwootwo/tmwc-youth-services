import { LoginForm } from "./login-form";
import { SiteNav } from "../landing-nav";

export default function LoginPage() {
  return (
    <main className="site-shell auth-shell">
      <header className="site-header">
        <a className="brand text-brand" href="/">
          Church Connect
        </a>
        <SiteNav />
      </header>

      <section className="content-section narrow-section">
        <div className="section-heading">
          <p className="eyebrow">Staff Access</p>
          <h1>Staff sign in</h1>
          <p>
            Enter your registered email and password to access your dashboard.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
