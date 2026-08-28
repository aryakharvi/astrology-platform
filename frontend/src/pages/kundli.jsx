import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

/* =====================================================
   KUNDLI — birth details form
   Generates a Kundli via the backend astronomy engine,
   then navigates to the result page.
===================================================== */
function Kundli() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: "",
    gender: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const token = localStorage.getItem("token");

  /* ================= AUTO-FILL FROM PROFILE ================= */
  // If the user's profile already has birth details, prefill them.
  // We never overwrite what the user types after editing.
  useEffect(() => {
    if (!token || profileLoaded) return;

    (async () => {
      try {
        const response = await fetch(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.ok && data.user) {
          const p = data.user;
          setForm((prev) => ({
            ...prev,
            name: prev.name || p.name || "",
            dateOfBirth: prev.dateOfBirth || p.date_of_birth || "",
            timeOfBirth: prev.timeOfBirth || p.time_of_birth || "",
            placeOfBirth: prev.placeOfBirth || p.place_of_birth || "",
            gender: prev.gender || p.gender || "",
          }));
        }
      } catch (e) {
        // profile prefetch is optional — ignore failures
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, [token, profileLoaded]);

  /* ================= INPUT ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  /* ================= VALIDATION ================= */

  const validate = () => {
    const errors = {};

    if (!form.dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required.";
    }

    if (!form.timeOfBirth) {
      errors.timeOfBirth = "Time of birth is required.";
    }

    if (!form.placeOfBirth || !form.placeOfBirth.trim()) {
      errors.placeOfBirth = "Place of birth is required.";
    }

    // Optional but validated if present
    if (form.dateOfBirth) {
      const today = new Date();
      const dob = new Date(`${form.dateOfBirth}T00:00:00`);
      if (Number.isNaN(dob.getTime())) {
        errors.dateOfBirth = "Please enter a valid date.";
      } else if (dob > today) {
        errors.dateOfBirth = "Date of birth cannot be in the future.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!validate()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    if (!token) {
      setError("Please login to generate your Kundli.");
      return;
    }

    setLoading(true);

    try {
      // 1. Generate (real calculation on the backend)
      const genResponse = await fetch(`${API_BASE}/kundli/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dateOfBirth: form.dateOfBirth,
          timeOfBirth: form.timeOfBirth,
        }),
      });

      const genData = await genResponse.json();

      if (!genResponse.ok) {
        throw new Error(genData.message || "Failed to generate Kundli");
      }

      // 2. Save (belongs to the logged-in user)
      const saveResponse = await fetch(`${API_BASE}/kundli`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name || "Unknown",
          dateOfBirth: form.dateOfBirth,
          timeOfBirth: form.timeOfBirth,
          placeOfBirth: form.placeOfBirth.trim(),
          gender: form.gender || null,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData.message || "Failed to save Kundli");
      }

      // 3. Navigate to the result page with the generated data
      const kundliId = saveData.kundliId || genData.kundli.id || null;

      navigate(`/kundli/${kundliId}`, {
        state: {
          kundli: {
            ...genData.kundli,
            id: kundliId,
            name: form.name || "Unknown",
            place_of_birth: form.placeOfBirth.trim(),
            gender: form.gender || null,
            date_of_birth: form.dateOfBirth,
            time_of_birth: form.timeOfBirth,
          },
        },
      });
    } catch (err) {
      console.error("Kundli generation error:", err);
      setError(err.message || "Unable to generate Kundli.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div style={styles.page}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <a href="/" style={styles.logo}>
          🌙 Shwetha Cosmic
        </a>

        <div style={styles.navLinks}>
          <a href="/" style={styles.navLink}>Home</a>
          <a href="/services" style={styles.navLink}>Services</a>
          <a href="/astrologer" style={styles.navLink}>Astrologer</a>
          <a href="/booking" style={styles.navLink}>Booking</a>
          <a href="/my-kundlis" style={styles.navLink}>My Kundlis</a>
          <a href="/profile" style={styles.navLink}>Profile</a>
        </div>
      </nav>

      {/* HEADER */}
      <section style={styles.header}>
        <div style={styles.headerIcon}>🔮</div>
        <p style={styles.eyebrow}>SHWETHA COSMIC</p>
        <h1 style={styles.title}>
          Your <span style={styles.gold}>Kundli</span>
        </h1>
        <p style={styles.subtitle}>
          Enter your birth details to generate your
          personalized cosmic birth chart.
        </p>
      </section>

      {/* FORM */}
      <section style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.heading}>✨ Birth Details</h2>
          <p style={styles.description}>
            Fields marked * are required to generate your Kundli.
            Your information stays private to your account.
          </p>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          {!token && (
            <div style={styles.warning}>
              Please login to generate and save your Kundli.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* NAME */}
            <label style={styles.label}>FULL NAME</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              style={styles.input}
            />

            {/* DATE */}
            <label style={styles.label}>DATE OF BIRTH *</label>
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              style={{ ...styles.input, borderColor: fieldErrors.dateOfBirth ? "#ff8585" : undefined }}
            />
            {fieldErrors.dateOfBirth && (
              <p style={styles.fieldError}>{fieldErrors.dateOfBirth}</p>
            )}

            {/* TIME */}
            <label style={styles.label}>TIME OF BIRTH *</label>
            <input
              type="time"
              name="timeOfBirth"
              value={form.timeOfBirth}
              onChange={handleChange}
              style={{ ...styles.input, borderColor: fieldErrors.timeOfBirth ? "#ff8585" : undefined }}
            />
            {fieldErrors.timeOfBirth && (
              <p style={styles.fieldError}>{fieldErrors.timeOfBirth}</p>
            )}

            {/* PLACE */}
            <label style={styles.label}>PLACE OF BIRTH *</label>
            <input
              type="text"
              name="placeOfBirth"
              value={form.placeOfBirth}
              onChange={handleChange}
              placeholder="Example: Mangalore, Karnataka"
              style={{ ...styles.input, borderColor: fieldErrors.placeOfBirth ? "#ff8585" : undefined }}
            />
            {fieldErrors.placeOfBirth && (
              <p style={styles.fieldError}>{fieldErrors.placeOfBirth}</p>
            )}

            {/* GENDER */}
            <label style={styles.label}>GENDER</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || !token}
              style={{
                ...styles.button,
                opacity: loading || !token ? 0.6 : 1,
                cursor: loading || !token ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={styles.loadingText}>
                  <span style={styles.spinner} /> Generating Kundli...
                </span>
              ) : (
                "✨ Generate My Kundli"
              )}
            </button>

            {profileLoaded && !token && (
              <p style={styles.loginHint}>
                <a href="/login" style={styles.loginLink}>Login to continue</a>
              </p>
            )}
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p style={styles.footerLogo}>🌙 Shwetha Cosmic</p>
        <p>Astrology • Guidance • Destiny</p>
        <p style={styles.copyright}>© 2026 Shwetha Cosmic. All rights reserved.</p>
      </footer>
    </div>
  );
}

/* =====================================================
   STYLES
===================================================== */
const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #241442 0%, #0b0614 45%, #05030a 100%)",
    color: "#fff",
    paddingBottom: "80px",
  },

  navbar: {
    height: "75px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 7%",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(5,3,10,0.8)",
    backdropFilter: "blur(15px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  logo: {
    textDecoration: "none",
    color: "#d9ad63",
    fontSize: "21px",
    fontFamily: 'Georgia, "Times New Roman", serif',
  },

  navLinks: {
    display: "flex",
    gap: "22px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  navLink: {
    color: "#b8afc0",
    textDecoration: "none",
    fontSize: "14px",
  },

  header: {
    textAlign: "center",
    padding: "70px 20px 35px",
  },

  headerIcon: { fontSize: "55px", marginBottom: "15px" },

  eyebrow: {
    color: "#d9ad63",
    letterSpacing: "4px",
    fontSize: "12px",
    marginBottom: "12px",
  },

  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "45px",
    fontWeight: "500",
    margin: 0,
  },

  gold: { color: "#d9ad63" },

  subtitle: {
    color: "#a59dae",
    maxWidth: "600px",
    margin: "18px auto",
    lineHeight: "1.7",
  },

  main: {
    width: "90%",
    maxWidth: "600px",
    margin: "auto",
  },

  card: {
    background: "rgba(20,12,32,0.85)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "35px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },

  heading: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "27px",
    fontWeight: "500",
    marginTop: 0,
  },

  description: { color: "#938a9f", lineHeight: "1.7" },

  error: {
    padding: "12px",
    borderRadius: "8px",
    background: "rgba(255,80,80,0.1)",
    border: "1px solid rgba(255,80,80,0.2)",
    color: "#ff8585",
    fontSize: "13px",
    marginBottom: "15px",
  },

  warning: {
    padding: "12px",
    borderRadius: "8px",
    background: "rgba(217,173,99,0.08)",
    border: "1px solid rgba(217,173,99,0.2)",
    color: "#d9ad63",
    fontSize: "13px",
    marginBottom: "15px",
  },

  label: {
    display: "block",
    color: "#d9ad63",
    fontSize: "11px",
    letterSpacing: "1.5px",
    marginTop: "22px",
    marginBottom: "9px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0613",
    color: "#fff",
    outline: "none",
    fontSize: "14px",
  },

  fieldError: {
    color: "#ff8585",
    fontSize: "12px",
    margin: "6px 0 0",
  },

  button: {
    width: "100%",
    padding: "16px",
    marginTop: "25px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #d9ad63, #b8893f)",
    color: "#160d20",
    fontWeight: "700",
    fontSize: "15px",
  },

  loadingText: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },

  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid rgba(22,13,32,0.3)",
    borderTopColor: "#160d20",
    animation: "spin 0.8s linear infinite",
  },

  loginHint: {
    textAlign: "center",
    marginTop: "20px",
    color: "#938a9f",
    fontSize: "13px",
  },

  loginLink: { color: "#d9ad63" },

  footer: {
    textAlign: "center",
    marginTop: "80px",
    paddingTop: "30px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    color: "#777080",
  },

  footerLogo: {
    color: "#d9ad63",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "18px",
  },

  copyright: { fontSize: "12px" },
};

export default Kundli;
