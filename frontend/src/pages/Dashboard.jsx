import { useEffect, useState } from "react";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load profile"
        );
      }

      setUser(data.user);
    } catch (err) {
      console.error("Profile error:", err);

      setError(err.message);

      // Invalid/expired token
      if (
        err.message.toLowerCase().includes("token") ||
        err.message.toLowerCase().includes("access denied") ||
        err.message.toLowerCase().includes("unauthorized")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080510",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "50px",
              marginBottom: "20px",
            }}
          >
            🌙
          </div>

          <h2
            style={{
              color: "#d9ad63",
              fontWeight: "500",
            }}
          >
            Reading your cosmic profile...
          </h2>

          <p style={{ color: "#999" }}>
            Please wait
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080510",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            textAlign: "center",
            padding: "40px",
            background: "#120b1d",
            borderRadius: "18px",
            border:
              "1px solid rgba(217,173,99,0.2)",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "20px",
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              color: "#d9ad63",
              marginBottom: "15px",
            }}
          >
            Unable to load profile
          </h2>

          <p
            style={{
              color: "#aaa",
              marginBottom: "25px",
            }}
          >
            {error}
          </p>

          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            style={{
              padding: "13px 25px",
              border: "none",
              borderRadius: "10px",
              background: "#d9ad63",
              color: "#080510",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080510",
        color: "white",
        fontFamily:
          'Arial, Helvetica, sans-serif',
      }}
    >
      {/* ================= NAVBAR ================= */}

      <nav
        style={{
          height: "75px",
          padding: "0 6%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom:
            "1px solid rgba(255,255,255,0.08)",
          background: "#0c0716",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* LOGO */}

        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "white",
            fontSize: "21px",
            fontWeight: "600",
          }}
        >
          🌙{" "}
          <span style={{ color: "#d9ad63" }}>
            Shwetha Cosmic
          </span>
        </a>

        {/* NAVIGATION */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "25px",
          }}
        >
          <a
            href="/"
            style={{
              color: "#aaa",
              textDecoration: "none",
            }}
          >
            Home
          </a>

          <a
            href="/services"
            style={{
              color: "#aaa",
              textDecoration: "none",
            }}
          >
            Services
          </a>

          <a
            href="/astrologer"
            style={{
              color: "#aaa",
              textDecoration: "none",
            }}
          >
            Astrologers
          </a>

          <a
            href="/booking"
            style={{
              color: "#aaa",
              textDecoration: "none",
            }}
          >
            Booking
          </a>

          <button
            onClick={handleLogout}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border:
                "1px solid rgba(217,173,99,0.5)",
              background: "transparent",
              color: "#d9ad63",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ================= MAIN ================= */}

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "70px 30px",
        }}
      >
        {/* WELCOME */}

        <section
          style={{
            marginBottom: "45px",
          }}
        >
          <p
            style={{
              color: "#d9ad63",
              fontSize: "12px",
              letterSpacing: "3px",
              marginBottom: "12px",
            }}
          >
            SHWETHA COSMIC
          </p>

          <h1
            style={{
              fontFamily:
                'Georgia, "Times New Roman", serif',
              fontSize: "46px",
              fontWeight: "500",
              margin: "0 0 15px",
            }}
          >
            Welcome,{" "}
            <span style={{ color: "#d9ad63" }}>
              {user?.name || "User"}
            </span>{" "}
            ✨
          </h1>

          <p
            style={{
              color: "#999",
              fontSize: "16px",
            }}
          >
            Your personal cosmic journey begins here.
          </p>
        </section>

        {/* ================= PROFILE CARD ================= */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "25px",
            marginBottom: "50px",
          }}
        >
          {/* PROFILE */}

          <div
            style={{
              background:
                "linear-gradient(145deg, #151021, #0e0918)",
              border:
                "1px solid rgba(217,173,99,0.18)",
              borderRadius: "18px",
              padding: "30px",
            }}
          >
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "50%",
                background:
                  "rgba(217,173,99,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                marginBottom: "20px",
              }}
            >
              👤
            </div>

            <h2
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
                fontWeight: "500",
                marginBottom: "25px",
              }}
            >
              My Profile
            </h2>

            <ProfileRow
              label="Full Name"
              value={user?.name}
            />

            <ProfileRow
              label="Email"
              value={user?.email}
            />

            <ProfileRow
              label="Phone"
              value={user?.phone || "Not provided"}
            />

            <ProfileRow
              label="Account Type"
              value={user?.role || "user"}
            />
          </div>

          {/* COSMIC CARD */}

          <div
            style={{
              background:
                "linear-gradient(145deg, #171026, #0e0918)",
              border:
                "1px solid rgba(217,173,99,0.18)",
              borderRadius: "18px",
              padding: "30px",
            }}
          >
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "50%",
                background:
                  "rgba(217,173,99,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                marginBottom: "20px",
              }}
            >
              🌌
            </div>

            <h2
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
                fontWeight: "500",
                marginBottom: "15px",
              }}
            >
              Your Cosmic Journey
            </h2>

            <p
              style={{
                color: "#999",
                lineHeight: "1.8",
              }}
            >
              Discover your birth chart, explore
              planetary influences and connect
              with experienced astrologers.
            </p>

            <a
              href="/kundli"
              style={{
                display: "inline-block",
                marginTop: "20px",
                padding: "12px 20px",
                background: "#d9ad63",
                color: "#080510",
                borderRadius: "9px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Explore Kundli →
            </a>
          </div>
        </section>

        {/* ================= SERVICES ================= */}

        <section>
          <p
            style={{
              color: "#d9ad63",
              fontSize: "12px",
              letterSpacing: "2px",
              marginBottom: "10px",
            }}
          >
            EXPLORE
          </p>

          <h2
            style={{
              fontFamily:
                'Georgia, "Times New Roman", serif',
              fontSize: "34px",
              fontWeight: "500",
              marginBottom: "30px",
            }}
          >
            Your Astrology Services
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            <ServiceCard
              icon="🔮"
              title="Kundli"
              text="Discover your birth chart and planetary positions."
              link="/kundli"
            />

            <ServiceCard
              icon="⭐"
              title="Astrologers"
              text="Connect with experienced astrology experts."
              link="/astrologer"
            />

            <ServiceCard
              icon="📅"
              title="Bookings"
              text="Schedule a personal astrology consultation."
              link="/booking"
            />

            <ServiceCard
              icon="✨"
              title="Services"
              text="Explore our complete range of cosmic guidance."
              link="/services"
            />
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}

      <footer
        style={{
          marginTop: "50px",
          padding: "40px 20px",
          textAlign: "center",
          borderTop:
            "1px solid rgba(255,255,255,0.08)",
          color: "#777",
        }}
      >
        <div
          style={{
            color: "#d9ad63",
            fontSize: "20px",
            marginBottom: "10px",
          }}
        >
          🌙 Shwetha Cosmic
        </div>

        <p>
          Astrology • Guidance • Destiny
        </p>

        <p
          style={{
            fontSize: "12px",
            marginTop: "20px",
          }}
        >
          © 2026 Shwetha Cosmic. All rights reserved.
        </p>
      </footer>
    </div>
  );
}


// ==========================================
// PROFILE ROW
// ==========================================

function ProfileRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        padding: "14px 0",
        borderBottom:
          "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        style={{
          color: "#777",
          fontSize: "13px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "#eee",
          fontSize: "14px",
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}


// ==========================================
// SERVICE CARD
// ==========================================

function ServiceCard({
  icon,
  title,
  text,
  link,
}) {
  return (
    <a
      href={link}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          height: "100%",
          boxSizing: "border-box",
          padding: "25px",
          background: "#120b1d",
          border:
            "1px solid rgba(255,255,255,0.07)",
          borderRadius: "15px",
          transition: "0.3s",
        }}
      >
        <div
          style={{
            fontSize: "30px",
            marginBottom: "15px",
          }}
        >
          {icon}
        </div>

        <h3
          style={{
            color: "#d9ad63",
            fontWeight: "500",
            marginBottom: "10px",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            color: "#888",
            fontSize: "13px",
            lineHeight: "1.7",
          }}
        >
          {text}
        </p>
      </div>
    </a>
  );
}

export default Dashboard;