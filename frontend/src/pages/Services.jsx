function Services() {
  const services = [
    {
      icon: "🔮",
      title: "Kundli Reading",
      description:
        "Get a detailed understanding of your birth chart, planets, houses and important life influences.",
      price: "Starting from ₹499",
    },
    {
      icon: "🌙",
      title: "Daily Horoscope",
      description:
        "Discover personalized guidance for your day based on your zodiac sign and planetary movements.",
      price: "Free",
    },
    {
      icon: "❤️",
      title: "Love & Relationship",
      description:
        "Explore compatibility, relationship patterns and astrological guidance for your love life.",
      price: "Starting from ₹599",
    },
    {
      icon: "💫",
      title: "Career & Finance",
      description:
        "Get astrology-based insights to help you understand career opportunities and financial periods.",
      price: "Starting from ₹599",
    },
    {
      icon: "✨",
      title: "Personal Consultation",
      description:
        "Have a private one-to-one consultation with Shwetha for personalized astrology guidance.",
      price: "Starting from ₹799",
    },
    {
      icon: "🌟",
      title: "Marriage & Compatibility",
      description:
        "Explore compatibility between two birth charts and understand important relationship factors.",
      price: "Starting from ₹999",
    },
  ];

  return (
    <div className="home-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="logo">
          🌙 <span>Shwetha Cosmic</span>
        </a>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/astrologer">Astrologer</a>
          <a href="/booking">Booking</a>
          <a href="/login">Login</a>
        </div>

        <a href="/register">
          <button className="register-btn">
            Register
          </button>
        </a>
      </nav>

      {/* PAGE HERO */}
      <section
        className="hero"
        style={{ minHeight: "65vh" }}
      >
        <div className="hero-content">

          <p className="eyebrow">
            ✦ ASTROLOGY • GUIDANCE • DESTINY ✦
          </p>

          <h1>
            Discover Our
            <br />
            <span>Astrology Services</span>
          </h1>

          <p className="hero-description">
            Personalized astrology guidance designed to
            help you understand yourself, your relationships
            and your journey ahead.
          </p>

        </div>

        <div className="hero-moon">
          🌙
        </div>

      </section>

      {/* SERVICES */}
      <section className="services">

        <div className="section-title">

          <p>OUR SERVICES</p>

          <h2>
            Guidance For Every
            <br />
            <span>Part Of Your Journey</span>
          </h2>

        </div>

        <div className="services-grid">

          {services.map((service, index) => (
            <div className="service-card" key={index}>

              <div className="service-icon">
                {service.icon}
              </div>

              <h3>{service.title}</h3>

              <p>{service.description}</p>

              <strong
                style={{
                  display: "block",
                  color: "#d9ad63",
                  marginBottom: "18px",
                  fontSize: "13px",
                }}
              >
                {service.price}
              </strong>

              <a href="/booking">
                Book Consultation →
              </a>

            </div>
          ))}

        </div>

      </section>

      {/* WHY CHOOSE US */}
      <section className="about">

        <div className="about-visual">

          <div className="cosmic-circle">
            ✦
          </div>

        </div>

        <div className="about-content">

          <p className="section-label">
            WHY SHWETHA COSMIC?
          </p>

          <h2>
            Astrology With
            <br />
            <span>Personal Guidance</span>
          </h2>

          <p>
            Every consultation is designed around your
            individual questions and circumstances. Our goal
            is to provide clear, thoughtful and meaningful
            astrological guidance.
          </p>

          <div className="stats">

            <div>
              <strong>500+</strong>
              <small>Consultations</small>
            </div>

            <div>
              <strong>4.9★</strong>
              <small>Client Rating</small>
            </div>

            <div>
              <strong>24/7</strong>
              <small>Online Booking</small>
            </div>

          </div>

          <a href="/booking">
            <button className="primary-btn">
              Book Consultation →
            </button>
          </a>

        </div>

      </section>

      {/* CTA */}
      <section className="cta">

        <p>YOUR COSMIC JOURNEY</p>

        <h2>
          Have questions about
          <br />
          your <span>future?</span>
        </h2>

        <a href="/booking">
          <button className="primary-btn">
            Talk With Shwetha ✦
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

export default Services;