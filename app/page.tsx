import Image from "next/image";

export default function Home() {
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
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div>
          <p className="eyebrow">Youth Business Idea Test</p>
          <h1>Serving people with purpose, faith, and practical action.</h1>
          <p className="hero-copy">
            A simple home for youth service ideas at The Master's Work Church,
            focused on using time, energy, and resources to serve others and
            share the gospel.
          </p>
        </div>
      </section>

      <section className="split-section" aria-label="Mission and vision">
        <article className="panel">
          <h2>Mission</h2>
          <p>
            We share what God has given us and use it to serve other people.
            Money is not the goal; it is one of the resources that helps carry
            out the mission. Energy, time, and money are used in service, and
            growth matters when it helps the work move forward.
          </p>
        </article>
        <article className="panel">
          <h2>Vision</h2>
          <p>
            To grow youth-led ideas into faithful, useful services that bless
            people, build responsibility, and keep the mission at the center.
          </p>
        </article>
      </section>

      <section className="content-section" id="services">
        <div className="section-heading">
          <p className="eyebrow">Services</p>
          <h2>Ways youth can serve</h2>
        </div>
        <div className="service-grid">
          <article className="panel">
            <h3>Community Help</h3>
            <p>
              Practical support projects for people who need encouragement,
              assistance, or a helpful hand.
            </p>
          </article>
          <article className="panel">
            <h3>Business Ideas</h3>
            <p>
              Small youth-led service concepts that teach stewardship,
              responsibility, and care for others.
            </p>
          </article>
          <article className="panel">
            <h3>Church Support</h3>
            <p>
              Volunteer work that supports ministry, events, outreach, and the
              everyday needs of the church family.
            </p>
          </article>
        </div>
      </section>

      <section className="content-section contact-section" id="contact">
        <div className="section-heading">
          <p className="eyebrow">Contact</p>
          <h2>Get in touch</h2>
        </div>
        <div className="service-grid two-column">
          <article className="panel">
            <h3>Contact Info</h3>
            <p>Email / Phone Placeholder</p>
          </article>
          <article className="panel">
            <h3>Working Hours</h3>
            <p>Mon - Fri: 9am - 5pm</p>
          </article>
        </div>
      </section>

      <footer>
        <p>&copy; 2016 The Master's Work Church. All rights reserved.</p>
      </footer>
    </main>
  );
}
