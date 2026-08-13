function Astrologer() {
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

      {/* PROFILE HERO */}
      <section className="hero">

        <div className="hero-content">

          <p className="eyebrow">
            ✦ MEET YOUR ASTROLOGER ✦
          </p>

          <h1>
            Meet
            <br />
            <span>Shwetha</span>
          </h1>

          <p className="hero-description">
            Professional astrology guidance to help you
            understand your cosmic journey, relationships,
            career and future.
          </p>

          <div className="hero-buttons">

            <a href="/booking">
              <button className="primary-btn">
                📅 Book Consultation
              </button>
            </a>

            <a href="/services">
              <button className="secondary-btn">
                View Services
              </button>
            </a>

          </div>

        </div>

        <div className="hero-moon">
          ✦
        </div>

      </section>

      {/* PROFILE SECTION */}
      <section className="about">

        {/* PHOTO PLACEHOLDER */}
        <div className="about-visual">

          <div className="cosmic-circle">
            🌙
          </div>

          <p
            style={{
              position: "absolute",
              marginTop: "280px",
              color: "#8f879b",
              fontSize: "13px",
            }}
          >
            Shwetha's Photo
          </p>

        </div>

        {/* INFORMATION */}
        <div className="about-content">

          <p className="section-label">
            ABOUT SHWETHA
          </p>

          <h2>
            Your Guide Through
            <br />
            <span>The Stars</span>
          </h2>

          <p>
            Shwetha provides personalized astrology
            consultations designed around your individual
            questions, experiences and goals.
          </p>

          <p style={{ marginTop: "18px" }}>
            Whether you want guidance about relationships,
            career, marriage or your personal journey,
            every consultation is focused on providing
            thoughtful and meaningful insights.
          </p>

          {/* STATS */}
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
              <strong>5+</strong>
              <small>Years Experience</small>
            </div>

          </div>

        </div>

      </section>

      {/* SPECIALIZATIONS */}
      <section className="services">

        <div className="section-title">

          <p>AREAS OF EXPERTISE</p>

          <h2>
            Astrology <span>Specializations</span>
          </h2>

        </div>

        <div className="services-grid">

          <div className="service-card">

            <div className="service-icon">
              🔮
            </div>

            <h3>Kundli Reading</h3>

            <p>
              Understand your birth chart and planetary
              influences.
            </p>

          </div>

          <div className="service-card">

            <div className="service-icon">
              ❤️
            </div>

            <h3>Love & Relationship</h3>

            <p>
              Explore compatibility and relationship
              guidance.
            </p>

          </div>

          <div className="service-card">

            <div className="service-icon">
              💼
            </div>

            <h3>Career & Finance</h3>

            <p>
              Discover potential career opportunities and
              financial guidance.
            </p>

          </div>

          <div className="service-card">

            <div className="service-icon">
              💍
            </div>

            <h3>Marriage</h3>

            <p>
              Explore compatibility and important
              relationship factors.
            </p>

          </div>

        </div>

      </section>

      {/* CONSULTATION OPTIONS */}
      <section>

        <div className="section-title">

          <p>CONSULT WITH SHWETHA</p>

          <h2>
            Choose Your
            <br />
            <span>Consultation</span>
          </h2>

        </div>

        <div className="services-grid">

          <div className="service-card">

            <div className="service-icon">
              💬
            </div>

            <h3>Live Chat</h3>

            <p>
              Chat directly with Shwetha and ask your
              astrology questions.
            </p>

            <strong
              style={{
                display: "block",
                color: "#d9ad63",
                marginBottom: "18px",
              }}
            >
              Starting from ₹499
            </strong>

            <a href="/booking">
              Book Chat →
            </a>

          </div>

          <div className="service-card">

            <div className="service-icon">
              📞
            </div>

            <h3>Audio Call</h3>

            <p>
              Have a private one-to-one astrology
              consultation over a call.
            </p>

            <strong
              style={{
                display: "block",
                color: "#d9ad63",
                marginBottom: "18px",
              }}
            >
              Starting from ₹699
            </strong>

            <a href="/booking">
              Book Call →
            </a>

          </div>

          <div className="service-card">

            <div className="service-icon">
              🎥
            </div>

            <h3>Video Call</h3>

            <p>
              Connect face-to-face with Shwetha for a
              personal consultation.
            </p>

            <strong
              style={{
                display: "block",
                color: "#d9ad63",
                marginBottom: "18px",
              }}
            >
              Starting from ₹999
            </strong>

            <a href="/booking">
              Book Video Call →
            </a>

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="cta">

        <p>READY TO BEGIN?</p>

        <h2>
          Your answers may be
          <br />
          <span>written in the stars.</span>
        </h2>

        <a href="/booking">
          <button className="primary-btn">
            Book With Shwetha ✦
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

export default Astrologer;