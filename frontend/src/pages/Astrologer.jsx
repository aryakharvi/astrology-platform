import { useEffect, useState } from "react";

function Astrologer() {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAstrologers();
  }, []);

  const loadAstrologers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/astrologers"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load astrologers"
        );
      }

      setAstrologers(data.astrologers || []);
    } catch (err) {
      console.error("Astrologer loading error:", err);
      setError(
        err.message || "Unable to load astrologers."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (astrologer) => {
    localStorage.setItem(
      "selectedAstrologer",
      JSON.stringify(astrologer)
    );

    window.location.href = "/booking";
  };

  return (
    <div style={pageStyle}>

      {/* ================= NAVBAR ================= */}

      <nav style={navbarStyle}>

        <a href="/" style={logoStyle}>
          🌙 Shwetha Cosmic
        </a>

        <div style={navLinksStyle}>

          <a href="/" style={navLinkStyle}>
            Home
          </a>

          <a href="/services" style={navLinkStyle}>
            Services
          </a>

          <a
            href="/astrologer"
            style={{
              ...navLinkStyle,
              color: "#d9ad63",
            }}
          >
            Astrologer
          </a>

          <a href="/booking" style={navLinkStyle}>
            Booking
          </a>

          <a href="/kundli" style={navLinkStyle}>
            Kundli
          </a>

          <a href="/profile" style={navLinkStyle}>
            Profile
          </a>

        </div>

      </nav>

      {/* ================= HEADER ================= */}

      <section style={headerStyle}>

        <div style={iconStyle}>
          🔮
        </div>

        <p style={labelStyle}>
          SHWETHA COSMIC
        </p>

        <h1 style={titleStyle}>
          Connect With{" "}
          <span style={{ color: "#d9ad63" }}>
            Expert Astrologers
          </span>
        </h1>

        <p style={subtitleStyle}>
          Get personalized guidance from experienced
          astrologers for love, career, finance and life.
        </p>

      </section>

      {/* ================= CONTENT ================= */}

      <section style={contentStyle}>

        {loading && (
          <div style={messageCardStyle}>
            <div style={loadingIconStyle}>
              🔮
            </div>

            <h2 style={messageTitleStyle}>
              Finding Your Astrologers...
            </h2>

            <p style={messageTextStyle}>
              Connecting with our cosmic experts.
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div style={messageCardStyle}>

            <div style={loadingIconStyle}>
              ⚠️
            </div>

            <h2 style={messageTitleStyle}>
              Unable to Load Astrologers
            </h2>

            <p style={messageTextStyle}>
              {error}
            </p>

            <button
              onClick={loadAstrologers}
              style={retryButtonStyle}
            >
              Try Again
            </button>

          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          astrologers.length === 0 && (
            <div style={messageCardStyle}>

              <div style={loadingIconStyle}>
                🌙
              </div>

              <h2 style={messageTitleStyle}>
                No Astrologers Available
              </h2>

              <p style={messageTextStyle}>
                Please check again later.
              </p>

            </div>
          )}

        {/* ASTROLOGER CARDS */}

        {!loading &&
          !error &&
          astrologers.length > 0 && (

            <div style={gridStyle}>

              {astrologers.map((astrologer) => (

                <div
                  key={astrologer.id}
                  style={cardStyle}
                >

                  {/* PROFILE */}

                  <div style={profileTopStyle}>

                    <div style={avatarStyle}>
                      {astrologer.name
                        ? astrologer.name
                            .charAt(0)
                            .toUpperCase()
                        : "A"}
                    </div>

                    <div>

                      <h2 style={nameStyle}>
                        {astrologer.name}
                      </h2>

                      <p style={specializationStyle}>
                        {astrologer.specialization}
                      </p>

                    </div>

                  </div>

                  {/* ONLINE STATUS */}

                  <div style={statusRowStyle}>

                    <span
                      style={{
                        ...statusDotStyle,
                        background:
                          astrologer.is_online
                            ? "#4ade80"
                            : "#777",
                      }}
                    />

                    <span
                      style={{
                        color:
                          astrologer.is_online
                            ? "#71e0a5"
                            : "#999",
                      }}
                    >
                      {astrologer.is_online
                        ? "Online"
                        : "Offline"}
                    </span>

                  </div>

                  {/* RATING */}

                  <div style={ratingStyle}>

                    <span>
                      ⭐ {astrologer.rating}
                    </span>

                    <span style={experienceStyle}>
                      {astrologer.experience} years
                      experience
                    </span>

                  </div>

                  {/* BIO */}

                  <p style={bioStyle}>
                    {astrologer.bio ||
                      "Experienced astrologer providing personalized cosmic guidance."}
                  </p>

                  {/* LANGUAGES */}

                  <div style={infoBoxStyle}>

                    <div>
                      <span style={infoLabelStyle}>
                        LANGUAGES
                      </span>

                      <span style={infoValueStyle}>
                        {astrologer.languages ||
                          "English"}
                      </span>
                    </div>

                    <div>
                      <span style={infoLabelStyle}>
                        CONSULTATION
                      </span>

                      <span style={priceStyle}>
                        ₹
                        {Number(
                          astrologer.price_per_minute
                        ).toFixed(0)}
                        /min
                      </span>
                    </div>

                  </div>

                  {/* BOOK BUTTON */}

                  <button
                    onClick={() =>
                      handleBook(astrologer)
                    }
                    style={{
                      ...bookButtonStyle,
                      opacity:
                        astrologer.is_online
                          ? 1
                          : 0.65,
                    }}
                  >
                    {astrologer.is_online
                      ? "Book Consultation ✨"
                      : "Book for Later →"}
                  </button>

                </div>

              ))}

            </div>
          )}

      </section>

      {/* ================= FOOTER ================= */}

      <footer style={footerStyle}>

        <div style={footerLogoStyle}>
          🌙 Shwetha Cosmic
        </div>

        <p>
          Astrology • Guidance • Destiny
        </p>

        <p style={copyrightStyle}>
          © 2026 Shwetha Cosmic. All rights reserved.
        </p>

      </footer>

    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, #241442 0%, #0b0614 45%, #05030a 100%)",
  color: "#fff",
  paddingBottom: "60px",
};

const navbarStyle = {
  height: "75px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 7%",
  borderBottom:
    "1px solid rgba(255,255,255,0.08)",
  background: "rgba(5,3,10,0.85)",
  backdropFilter: "blur(15px)",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const logoStyle = {
  textDecoration: "none",
  color: "#d9ad63",
  fontSize: "21px",
  fontFamily:
    'Georgia, "Times New Roman", serif',
};

const navLinksStyle = {
  display: "flex",
  gap: "24px",
  alignItems: "center",
};

const navLinkStyle = {
  color: "#b8afc0",
  textDecoration: "none",
  fontSize: "14px",
};

const headerStyle = {
  textAlign: "center",
  padding: "70px 20px 50px",
};

const iconStyle = {
  fontSize: "55px",
  marginBottom: "15px",
};

const labelStyle = {
  color: "#d9ad63",
  letterSpacing: "4px",
  fontSize: "12px",
  marginBottom: "12px",
};

const titleStyle = {
  fontFamily:
    'Georgia, "Times New Roman", serif',
  fontSize: "45px",
  fontWeight: "500",
  margin: 0,
};

const subtitleStyle = {
  color: "#a59dae",
  maxWidth: "650px",
  margin: "18px auto",
  lineHeight: "1.7",
};

const contentStyle = {
  width: "90%",
  maxWidth: "1200px",
  margin: "auto",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "25px",
};

const cardStyle = {
  background:
    "rgba(20, 12, 32, 0.88)",
  border:
    "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "28px",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.25)",
  transition: "transform 0.2s ease",
};

const profileTopStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const avatarStyle = {
  width: "65px",
  height: "65px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, #d9ad63, #8d6630)",
  color: "#160d20",
  fontSize: "25px",
  fontWeight: "700",
};

const nameStyle = {
  margin: 0,
  fontFamily:
    'Georgia, "Times New Roman", serif',
  fontSize: "23px",
  fontWeight: "500",
};

const specializationStyle = {
  color: "#d9ad63",
  fontSize: "13px",
  marginTop: "6px",
};

const statusRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginTop: "18px",
  fontSize: "13px",
};

const statusDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
};

const ratingStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "18px",
  paddingBottom: "15px",
  borderBottom:
    "1px solid rgba(255,255,255,0.08)",
  fontSize: "14px",
};

const experienceStyle = {
  color: "#aaa1b0",
};

const bioStyle = {
  color: "#9d94a7",
  lineHeight: "1.7",
  fontSize: "14px",
  minHeight: "70px",
};

const infoBoxStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
  marginTop: "15px",
  padding: "15px",
  borderRadius: "10px",
  background: "rgba(217,173,99,0.06)",
};

const infoLabelStyle = {
  display: "block",
  color: "#807687",
  fontSize: "9px",
  letterSpacing: "1px",
  marginBottom: "5px",
};

const infoValueStyle = {
  color: "#ddd5e2",
  fontSize: "12px",
};

const priceStyle = {
  color: "#d9ad63",
  fontWeight: "700",
  fontSize: "14px",
};

const bookButtonStyle = {
  width: "100%",
  marginTop: "20px",
  padding: "14px",
  border: "none",
  borderRadius: "10px",
  background:
    "linear-gradient(135deg, #d9ad63, #b8893f)",
  color: "#160d20",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
};

const messageCardStyle = {
  maxWidth: "600px",
  margin: "30px auto",
  padding: "50px 30px",
  textAlign: "center",
  background:
    "rgba(20, 12, 32, 0.88)",
  border:
    "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
};

const loadingIconStyle = {
  fontSize: "50px",
  marginBottom: "15px",
};

const messageTitleStyle = {
  fontFamily:
    'Georgia, "Times New Roman", serif',
  fontWeight: "500",
};

const messageTextStyle = {
  color: "#9d94a7",
};

const retryButtonStyle = {
  marginTop: "15px",
  padding: "12px 25px",
  border: "none",
  borderRadius: "8px",
  background: "#d9ad63",
  color: "#160d20",
  fontWeight: "700",
  cursor: "pointer",
};

const footerStyle = {
  textAlign: "center",
  marginTop: "80px",
  paddingTop: "30px",
  borderTop:
    "1px solid rgba(255,255,255,0.08)",
  color: "#777080",
};

const footerLogoStyle = {
  color: "#d9ad63",
  fontFamily:
    'Georgia, "Times New Roman", serif',
  fontSize: "18px",
};

const copyrightStyle = {
  fontSize: "12px",
};

export default Astrologer;