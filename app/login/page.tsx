import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="site-shell auth-shell">
      <header className="site-header">
        <Link className="brand text-brand" href="/">
          ⛪ Church Connect
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">Home</Link>
        </nav>
      </header>

      <section className="content-section narrow-section">
        <div className="section-heading">
          <p className="eyebrow">Staff Access</p>
          <h1>Staff sign in</h1>
          <p>
            Enter your registered email to access your dashboard.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
