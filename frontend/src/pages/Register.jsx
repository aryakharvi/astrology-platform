import { useState } from "react";

function Register() {
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData(e.target);

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Check passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      console.log("Registration successful:", data);

      setRegistered(true);
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">

      {/* ================= NAVBAR ================= */}

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

        <a href="/login">
          <button className="register-btn">
            Login
          </button>
        </a>

      </nav>

      {/* ================= REGISTER SECTION ================= */}

      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "100px",
        }}
      >

        <div
          className="service-card"
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "45px 35px",
          }}
        >

          {/* ================= SUCCESS SCREEN ================= */}

          {registered ? (

            <div style={{ textAlign: "center" }}>

              <div
                style={{
                  fontSize: "60px",
                  marginBottom: "20px",
                }}
              >
                ✨
              </div>

              <p className="section-label">
                SHWETHA COSMIC
              </p>

              <h1
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                  fontSize: "38px",
                  fontWeight: "500",
                  marginBottom: "18px",
                }}
              >
                Welcome to{" "}
                <span style={{ color: "#d9ad63" }}>
                  Shwetha Cosmic
                </span>
              </h1>

              <p
                style={{
                  color: "#aaa3b2",
                  lineHeight: "1.8",
                  marginBottom: "30px",
                }}
              >
                Your account has been created successfully.
                You can now continue to your login page.
              </p>

              <a href="/login">
                <button className="primary-btn">
                  Continue to Login →
                </button>
              </a>

            </div>

          ) : (

            <>
              {/* ================= HEADER ================= */}

              <div
                style={{
                  textAlign: "center",
                  marginBottom: "35px",
                }}
              >

                <div
                  style={{
                    fontSize: "45px",
                    marginBottom: "15px",
                  }}
                >
                  🌙
                </div>

                <p className="section-label">
                  SHWETHA COSMIC
                </p>

                <h1
                  style={{
                    fontFamily:
                      'Georgia, "Times New Roman", serif',
                    fontSize: "40px",
                    fontWeight: "500",
                    marginBottom: "12px",
                  }}
                >
                  Create{" "}
                  <span style={{ color: "#d9ad63" }}>
                    Account
                  </span>
                </h1>

                <p
                  style={{
                    color: "#8f879b",
                    fontSize: "14px",
                  }}
                >
                  Begin your cosmic journey with us.
                </p>

              </div>

              {/* ================= ERROR MESSAGE ================= */}

              {error && (
                <p
                  style={{
                    color: "#ff6b6b",
                    textAlign: "center",
                    marginBottom: "20px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(255, 107, 107, 0.08)",
                  }}
                >
                  {error}
                </p>
              )}

              {/* ================= FORM ================= */}

              <form onSubmit={handleSubmit}>

                {/* FULL NAME */}

                <div style={{ marginBottom: "20px" }}>

                  <label
                    htmlFor="name"
                    style={{
                      display: "block",
                      color: "#d9ad63",
                      fontSize: "12px",
                      letterSpacing: "1px",
                      marginBottom: "9px",
                    }}
                  >
                    FULL NAME
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      background: "#0c0716",
                      color: "white",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                </div>

                {/* EMAIL */}

                <div style={{ marginBottom: "20px" }}>

                  <label
                    htmlFor="email"
                    style={{
                      display: "block",
                      color: "#d9ad63",
                      fontSize: "12px",
                      letterSpacing: "1px",
                      marginBottom: "9px",
                    }}
                  >
                    EMAIL ADDRESS
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      background: "#0c0716",
                      color: "white",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                </div>

                {/* PHONE */}

                <div style={{ marginBottom: "20px" }}>

                  <label
                    htmlFor="phone"
                    style={{
                      display: "block",
                      color: "#d9ad63",
                      fontSize: "12px",
                      letterSpacing: "1px",
                      marginBottom: "9px",
                    }}
                  >
                    PHONE NUMBER
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    required
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      background: "#0c0716",
                      color: "white",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                </div>

                {/* PASSWORD */}

                <div style={{ marginBottom: "20px" }}>

                  <label
                    htmlFor="password"
                    style={{
                      display: "block",
                      color: "#d9ad63",
                      fontSize: "12px",
                      letterSpacing: "1px",
                      marginBottom: "9px",
                    }}
                  >
                    PASSWORD
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    minLength="6"
                    required
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      background: "#0c0716",
                      color: "white",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                </div>

                {/* CONFIRM PASSWORD */}

                <div style={{ marginBottom: "28px" }}>

                  <label
                    htmlFor="confirmPassword"
                    style={{
                      display: "block",
                      color: "#d9ad63",
                      fontSize: "12px",
                      letterSpacing: "1px",
                      marginBottom: "9px",
                    }}
                  >
                    CONFIRM PASSWORD
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    minLength="6"
                    required
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      background: "#0c0716",
                      color: "white",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                </div>

                {/* SUBMIT BUTTON */}

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    opacity: loading ? 0.7 : 1,
                    cursor: loading
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {loading
                    ? "Creating Account..."
                    : "Create Account ✦"}
                </button>

              </form>

              {/* LOGIN LINK */}

              <p
                style={{
                  textAlign: "center",
                  color: "#8f879b",
                  fontSize: "13px",
                  marginTop: "25px",
                }}
              >
                Already have an account?{" "}

                <a
                  href="/login"
                  style={{
                    color: "#d9ad63",
                  }}
                >
                  Login
                </a>

              </p>

            </>

          )}

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer>

        <div className="footer-logo">
          🌙 Shwetha Cosmic
        </div>

        <p>
          Astrology • Guidance • Destiny
        </p>

        <p className="copyright">
          © 2026 Shwetha Cosmic. All rights reserved.
        </p>

      </footer>

    </div>
  );
}

export default Register;