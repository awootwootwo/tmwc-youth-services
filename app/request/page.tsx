import { listActiveServices } from "@/lib/services";
import { SiteNav } from "../landing-nav";
import { RequestForm } from "../request-form";

export default async function RequestPage() {
  const services = await listActiveServices();

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand text-brand" href="/">
          Church Connect
        </a>
        <SiteNav />
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
