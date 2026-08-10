import Image from "next/image";
import Link from "next/link";
import { listActiveServices } from "@/lib/services";
import { RequestForm } from "./request-form";

export default async function Home() {
  const services = await listActiveServices();

  return (
    <main className="site-shell">
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
          <a href="#request">Request</a>
          <Link href="/login">Staff</Link>
        </nav>
      </header>

      <section className="hero" id="home">
        <div>
          <p className="eyebrow">Youth Service MVP</p>
          <h1>Serving people with purpose, faith, and practical action.</h1>
          <p className="hero-copy">
            A simple home for youth-led services at The Master&apos;s Work Church,
            focused on using time, energy, and resources to serve others and
            share the Gospel.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#request">
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
          <p>
            We share what God has given us and use it to serve other people.
            Money is not the goal; it is one of the resources that helps carry
            out the mission. The focus is serving people, stewarding gifts well,
            and sharing the Gospel with or without payment.
          </p>
        </article>
        <article className="panel">
          <h2>Vision</h2>
          <p>
            To help TMWC Youth use their God-given gifts in practical ways that
            bless people, build responsibility, and support the ministry&apos;s
            mission.
          </p>
        </article>
      </section>

      <section className="content-section" id="services">
        <div className="section-heading">
          <p className="eyebrow">Services</p>
          <h2>Ways youth can serve</h2>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article className="panel" key={service.id}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section request-section" id="request">
        <div className="section-heading">
          <p className="eyebrow">Request</p>
          <h2>Ask about a service</h2>
          <p>
            Share only the details needed for the team to respond. A staff
            member will review the request before confirming availability,
            pricing, date, and assigned youth staff.
          </p>
        </div>
        <RequestForm services={services} />
      </section>

      <footer>
        <p>&copy; 2026 The Master&apos;s Work Church. All rights reserved.</p>
      </footer>
    </main>
  );
}
