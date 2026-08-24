import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

function Kundli() {
  const [form, setForm] = useState({
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: "",
    gender: "",
  });

  const [kundli, setKundli] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingKundli, setLoadingKundli] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Get JWT token
  const token = localStorage.getItem("token");

  // ==========================================
  // LOAD SAVED KUNDLI
  // ==========================================

  useEffect(() => {
    loadKundli();
  }, []);

  const loadKundli = async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      setLoadingKundli(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/kundli`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      console.log("GET /api/kundli:", data);

      if (response.status === 401) {
        setError("Your login session has expired. Please login again.");
        localStorage.removeItem("token");
        setLoadingKundli(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load Kundli");
      }

      if (data.kundli) {
        setKundli(data.kundli);

        setForm({
          dateOfBirth: formatDate(data.kundli.date_of_birth),
          timeOfBirth: formatTime(data.kundli.time_of_birth),
          placeOfBirth: data.kundli.place_of_birth || "",
          gender: data.kundli.gender || "",
        });
      } else {
        setKundli(null);
      }
    } catch (err) {
      console.error("Load Kundli error:", err);
      setError(err.message || "Unable to load Kundli.");
    } finally {
      setLoadingKundli(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "";

    if (typeof date === "string") {
      return date.substring(0, 10);
    }

    return "";
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (time) => {
    if (!time) return "";

    if (typeof time === "string") {
      return time.substring(0, 5);
    }

    return "";
  };

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // ==========================================
  // SAVE KUNDLI
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      setError("Please login before saving your Kundli.");
      return;
    }

    if (
      !form.dateOfBirth ||
      !form.timeOfBirth ||
      !form.placeOfBirth ||
      !form.gender
    ) {
      setError("Please fill in all birth details.");
      return;
    }

    setLoading(true);

    try {
      console.log("Sending Kundli:", form);

      const response = await fetch(`${API_URL}/api/kundli`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          dateOfBirth: form.dateOfBirth,
          timeOfBirth: form.timeOfBirth,
          placeOfBirth: form.placeOfBirth,
          gender: form.gender,
        }),
      });

      const data = await response.json();

      console.log("POST /api/kundli:", data);

      if (response.status === 401) {
        localStorage.removeItem("token");
        setError("Your login session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save Kundli"
        );
      }

      setMessage("✨ Your Kundli has been saved successfully!");

      // Reload saved Kundli
      await loadKundli();
    } catch (err) {
      console.error("Save Kundli error:", err);

      setError(
        err.message ||
          "Unable to connect to the backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div style={pageStyle}>

      {/* NAVBAR */}

      <nav style={navbarStyle}>

        <a href="/" style={logoStyle}>
          🌙 Shwetha Cosmic
        </a>

        <div style={navContainerStyle}>

          <a href="/" style={navLink}>
            Home
          </a>

          <a href="/services" style={navLink}>
            Services
          </a>

          <a href="/astrologer" style={navLink}>
            Astrologer
          </a>

          <a href="/booking" style={navLink}>
            Booking
          </a>

          <a href="/profile" style={navLink}>
            Profile
          </a>

        </div>

      </nav>

      {/* HEADER */}

      <section style={headerStyle}>

        <div style={headerIconStyle}>
          🔮
        </div>

        <p style={labelTopStyle}>
          SHWETHA COSMIC
        </p>

        <h1 style={titleStyle}>
          Your{" "}
          <span style={{ color: "#d9ad63" }}>
            Kundli
          </span>
        </h1>

        <p style={subtitleStyle}>
          Enter your birth details to create your
          personalized cosmic birth chart.
        </p>

      </section>

      {/* MAIN */}

      <section style={mainStyle}>

        {/* FORM */}

        <div style={cardStyle}>

          <h2 style={headingStyle}>
            ✨ Birth Details
          </h2>

          <p style={descriptionStyle}>
            Your birth information helps us understand
            your cosmic profile.
          </p>

          {/* SUCCESS */}

          {message && (
            <div style={successStyle}>
              {message}
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

          {/* LOGIN WARNING */}

          {!token && (
            <div style={warningStyle}>
              Please login to save your Kundli.
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* DATE */}

            <label style={labelStyle}>
              DATE OF BIRTH
            </label>

            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              style={inputStyle}
              required
            />

            {/* TIME */}

            <label style={labelStyle}>
              TIME OF BIRTH
            </label>

            <input
              type="time"
              name="timeOfBirth"
              value={form.timeOfBirth}
              onChange={handleChange}
              style={inputStyle}
              required
            />

            {/* PLACE */}

            <label style={labelStyle}>
              PLACE OF BIRTH
            </label>

            <input
              type="text"
              name="placeOfBirth"
              value={form.placeOfBirth}
              onChange={handleChange}
              placeholder="Example: Mangalore"
              style={inputStyle}
              required
            />

            {/* GENDER */}

            <label style={labelStyle}>
              GENDER
            </label>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              style={inputStyle}
              required
            >

              <option value="">
                Select Gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>

            </select>

            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading || !token}
              style={{
                ...buttonStyle,
                opacity:
                  loading || !token ? 0.6 : 1,
                cursor:
                  loading || !token
                    ? "not-allowed"
                    : "pointer",
              }}
            >

              {loading
                ? "Saving Kundli..."
                : "Save My Kundli ✨"}

            </button>

          </form>

        </div>

        {/* SAVED KUNDLI */}

        <div style={cardStyle}>

          <h2 style={headingStyle}>
            🌌 Saved Kundli
          </h2>

          {loadingKundli ? (

            <p style={descriptionStyle}>
              Loading your Kundli...
            </p>

          ) : kundli ? (

            <div>

              <InfoRow
                label="Date of Birth"
                value={formatDate(kundli.date_of_birth)}
              />

              <InfoRow
                label="Time of Birth"
                value={formatTime(kundli.time_of_birth)}
              />

              <InfoRow
                label="Place of Birth"
                value={kundli.place_of_birth}
              />

              <InfoRow
                label="Gender"
                value={kundli.gender}
              />

              <div style={cosmicBoxStyle}>

                <div style={{ fontSize: "35px" }}>
                  ✨
                </div>

                <p
                  style={{
                    color: "#d9ad63",
                    margin: "10px 0 0",
                  }}
                >
                  Your cosmic journey begins here.
                </p>

              </div>

            </div>

          ) : (

            <div style={emptyStyle}>

              <div style={{ fontSize: "50px" }}>
                🌙
              </div>

              <p
                style={{
                  color: "#a59dae",
                  lineHeight: "1.7",
                }}
              >
                You haven't saved your Kundli yet.
                <br />
                Enter your birth details to begin.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* FOOTER */}

      <footer style={footerStyle}>

        <p style={footerLogoStyle}>
          🌙 Shwetha Cosmic
        </p>

        <p>
          Astrology • Guidance • Destiny
        </p>

        <p style={{ fontSize: "12px" }}>
          © 2026 Shwetha Cosmic. All rights reserved.
        </p>

      </footer>

    </div>
  );
}

// ==========================================
// INFO ROW
// ==========================================

function InfoRow({ label, value }) {
  return (
    <div style={infoRowStyle}>

      <p style={infoLabelStyle}>
        {label}
      </p>

      <p style={infoValueStyle}>
        {value || "Not available"}
      </p>

    </div>
  );
}

// ==========================================
// STYLES
// ==========================================

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, #241442 0%, #0b0614 45%, #05030a 100%)",
  color: "#fff",
  paddingBottom: "80px",
};

const navbarStyle = {
  height: "75px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 7%",
  borderBottom:
    "1px solid rgba(255,255,255,0.08)",
  background: "rgba(5,3,10,0.8)",
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

const navContainerStyle = {
  display: "flex",
  gap: "25px",
};

const navLink = {
  color: "#b8afc0",
  textDecoration: "none",
  fontSize: "14px",
};

const headerStyle = {
  textAlign: "center",
  padding: "70px 20px 35px",
};

const headerIconStyle = {
  fontSize: "55px",
  marginBottom: "15px",
};

const labelTopStyle = {
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
  maxWidth: "600px",
  margin: "18px auto",
  lineHeight: "1.7",
};

const mainStyle = {
  width: "90%",
  maxWidth: "1100px",
  margin: "auto",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "30px",
};

const cardStyle = {
  background:
    "rgba(20, 12, 32, 0.85)",
  border:
    "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "35px",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.25)",
};

const headingStyle = {
  fontFamily:
    'Georgia, "Times New Roman", serif',
  fontSize: "27px",
  fontWeight: "500",
  marginTop: 0,
};

const descriptionStyle = {
  color: "#938a9f",
  lineHeight: "1.7",
};

const labelStyle = {
  display: "block",
  color: "#d9ad63",
  fontSize: "11px",
  letterSpacing: "1.5px",
  marginTop: "22px",
  marginBottom: "9px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px",
  borderRadius: "9px",
  border:
    "1px solid rgba(255,255,255,0.1)",
  background: "#0b0613",
  color: "#fff",
  outline: "none",
  fontSize: "14px",
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  marginTop: "15px",
  border: "none",
  borderRadius: "10px",
  background:
    "linear-gradient(135deg, #d9ad63, #b8893f)",
  color: "#160d20",
  fontWeight: "700",
  fontSize: "15px",
};

const successStyle = {
  padding: "12px",
  borderRadius: "8px",
  background: "rgba(50,200,120,0.1)",
  border:
    "1px solid rgba(50,200,120,0.2)",
  color: "#71e0a5",
  fontSize: "13px",
  marginBottom: "15px",
};

const errorStyle = {
  padding: "12px",
  borderRadius: "8px",
  background: "rgba(255,80,80,0.1)",
  border:
    "1px solid rgba(255,80,80,0.2)",
  color: "#ff8585",
  fontSize: "13px",
  marginBottom: "15px",
};

const warningStyle = {
  padding: "12px",
  borderRadius: "8px",
  background: "rgba(217,173,99,0.08)",
  border:
    "1px solid rgba(217,173,99,0.2)",
  color: "#d9ad63",
  fontSize: "13px",
  marginBottom: "15px",
};

const infoRowStyle = {
  padding: "17px 0",
  borderBottom:
    "1px solid rgba(255,255,255,0.08)",
};

const infoLabelStyle = {
  color: "#d9ad63",
  fontSize: "11px",
  letterSpacing: "1.5px",
  margin: "0 0 7px",
};

const infoValueStyle = {
  color: "#fff",
  margin: 0,
  fontSize: "16px",
};

const cosmicBoxStyle = {
  marginTop: "30px",
  padding: "22px",
  borderRadius: "12px",
  textAlign: "center",
  background:
    "rgba(217,173,99,0.08)",
  border:
    "1px solid rgba(217,173,99,0.2)",
};

const emptyStyle = {
  textAlign: "center",
  padding: "50px 20px",
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

export default Kundli;