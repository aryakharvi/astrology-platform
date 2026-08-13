function Home() {
  return (
    <div className="home-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          🌙 <span>Shwetha Cosmic</span>
        </div>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/astrologer">Astrologer</a>
          <a href="/booking">Booking</a>
          <a href="/login">Login</a>
        </div>

        <a href="/register">
          <button className="register-btn">Register</button>
        </a>
      </nav>

      {/* HERO */}
      <section className="hero">

        <div className="hero-content">

          <p className="eyebrow">
            ✦ ASTROLOGY • GUIDANCE • DESTINY ✦
          </p>

          <h1>
            Discover Your
            <br />
            <span>Cosmic Path</span>
          </h1>

          <p className="hero-description">
            Explore the wisdom of the stars and discover
            meaningful guidance for your journey through life.
          </p>

          <div className="hero-buttons">

            <a href="/booking">
              <button className="primary-btn">
                🔮 Consult Shwetha
              </button>
            </a>

            <a href="/services">
              <button className="secondary-btn">
                Explore Services
              </button>
            </a>

          </div>

        </div>

        {/* DECORATIVE MOON */}
        <div className="hero-moon">
          🌙
        </div>

        <div className="star star-1">✦</div>
        <div className="star star-2">✧</div>
        <div className="star star-3">✦</div>
        <div className="star star-4">✧</div>

      </section>

      {/* SERVICES */}
      <section className="services">

        <div className="section-title">

          <p>WHAT WE OFFER</p>

          <h2>
            Explore Our <span>Services</span>
          </h2>

        </div>

        <div className="services-grid">

          <div className="service-card">
            <div className="service-icon">🔮</div>

            <h3>Kundli Reading</h3>

            <p>
              Understand your birth chart and discover
              insights about your life.
            </p>

            <a href="/services">Learn More →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">🌙</div>

            <h3>Horoscope</h3>

            <p>
              Explore personalized horoscope guidance
              based on your zodiac sign.
            </p>

            <a href="/services">Learn More →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">💫</div>

            <h3>Personal Consultation</h3>

            <p>
              Get one-to-one astrology guidance from
              Shwetha.
            </p>

            <a href="/booking">Book Now →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">❤️</div>

            <h3>Love & Relationship</h3>

            <p>
              Explore compatibility and relationship
              guidance.
            </p>

            <a href="/services">Learn More →</a>
          </div>

        </div>

      </section>

      {/* ABOUT */}
      <section className="about">

        <div className="about-visual">
          <div className="cosmic-circle">
            ☾
          </div>
        </div>

        <div className="about-content">

          <p className="section-label">
            MEET YOUR ASTROLOGER
          </p>

          <h2>
            Guidance from
            <br />
            <span>Shwetha</span>
          </h2>

          <p>
            Welcome to Shwetha Cosmic. Discover a
            personalized astrology experience designed to
            help you explore your cosmic journey and find
            meaningful guidance.
          </p>

          <div className="stats">

            <div>
              <strong>500+</strong>
              <small>Consultations</small>
            </div>

            <div>
              <strong>4.9</strong>
              <small>Client Rating</small>
            </div>

            <div>
              <strong>5+</strong>
              <small>Years Experience</small>
            </div>

          </div>

          <a href="/astrologer">
            <button className="primary-btn">
              Meet Shwetha →
            </button>
          </a>

        </div>

      </section>

      {/* CALL TO ACTION */}
      <section className="cta">

        <p>YOUR JOURNEY STARTS HERE</p>

        <h2>
          Ready to discover
          <br />
          your <span>cosmic path?</span>
        </h2>

        <a href="/booking">
          <button className="primary-btn">
            Book a Consultation ✦
          </button>
        </a>

      </section>

      {/* FOOTER */}
      <footer>

        <div className="footer-logo">
          🌙 Shwetha Cosmic
        </div>

        <p>
          Astrology • Guidance • Destiny
        </p>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/astrologer">Astrologer</a>
          <a href="/booking">Booking</a>
        </div>

        <p className="copyright">
          © 2026 Shwetha Cosmic. All rights reserved.
        </p>

      </footer>

    </div>
  );
}

export default Home;