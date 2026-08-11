import Image from "next/image";
import { getSiteContent, listActiveServices } from "@/lib/services";
import { WelcomeModal } from "./welcome-modal";

export default async function Home() {
  const services = await listActiveServices();
  const content = await getSiteContent();

  return (
    <main className="site-shell">
      <WelcomeModal />
      <header className="site-header">
        <a className="brand" href="#home" aria-label="TMWC Youth Services home">
          <Image
            src="/images/tmwc-logo.jpg"
            alt="The Master's Work Church logo"
            width={64}
            height={64}
            priority
          />
          <span>TMWC Youth Services</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="/request">Request Service</a>
          <a href="/dashboard">Staff</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div>
          <p className="eyebrow">Church Connect</p>
          <h1>Welcome to Our Church Services</h1>
          <p className="hero-copy">
            Connecting our community through faith, learning, creativity, and
            service.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="/request">
              Request a service
            </a>
            <a className="secondary-link" href="#services">
              View services
            </a>
          </div>
        </div>
      </section>

      <section className="split-section" aria-label="Mission and vision">
        <article className="panel">
          <h2>Mission</h2>
          <p>{content.mission}</p>
        </article>
        <article className="panel">
          <h2>Vision</h2>
          <p>{content.vision}</p>
        </article>
      </section>

      <section className="content-section" id="services">
        <div className="section-heading">
          <p className="eyebrow">Services</p>
          <h2>Ways youth can serve</h2>
        </div>
        {services.length > 0 ? (
          <div className="service-grid">
            {services.map((service) => (
              <article className="panel" key={service.id}>
                <p className="service-icon" aria-hidden="true">
                  {"icon" in service && service.icon ? service.icon : "🤝"}
                </p>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <article className="panel empty-state">
            <h3>No services available at the moment</h3>
            <p>
              Please check again soon. The team is still preparing the service
              list.
            </p>
          </article>
        )}
      </section>

      <footer>
        <p>&copy; 2026 The Master&apos;s Work Church. All rights reserved.</p>
      </footer>
    </main>
  );
}
