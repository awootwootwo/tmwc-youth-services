import Link from "next/link";
import { listActiveServices } from "@/lib/services";
import { RequestForm } from "../request-form";

export default async function RequestPage() {
  const services = await listActiveServices();

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand text-brand" href="/">
          ⛪ Church Connect
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <Link href="/request">Request Service</Link>
          <Link href="/dashboard">Sign In</Link>
        </nav>
      </header>

      <section className="content-section request-section">
        <div className="section-heading">
          <p className="eyebrow">Request Service</p>
          <h1>Request a service</h1>
          <p>
            Share the details needed for the team to review your request and
            respond.
          </p>
        </div>
        <RequestForm services={services} />
      </section>
    </main>
  );
}
