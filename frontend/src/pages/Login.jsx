import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      if (!data.token) {
        throw new Error(
          "Login successful, but no token was received."
        );
      }

      // Save JWT
      localStorage.setItem(
        "token",
        data.token
      );

      // Save user information
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      console.log(
        "USER SAVED:",
        data.user
      );

      console.log(
        "ROLE:",
        data.user?.role
      );

      // ===============================
      // ADMIN REDIRECT
      // ===============================

      if (data.user?.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }

    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to login. Please make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #241442 0%, #0b0614 45%, #05030a 100%)",
        color: "#fff",
        paddingBottom: "60px",
      }}
    >

      {/* ================= NAVBAR ================= */}

      <nav
        style={{
          height: "75px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 7%",
          borderBottom:
            "1px solid rgba(255,255,255,0.08)",
          background:
            "rgba(5,3,10,0.85)",
          backdropFilter: "blur(15px)",
        }}
      >

        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#d9ad63",
            fontSize: "21px",
            fontFamily:
              'Georgia, "Times New Roman", serif',
          }}
        >
          🌙 Shwetha Cosmic
        </a>

        <div
          style={{
            display: "flex",
            gap: "25px",
          }}
        >

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

          <a href="/register" style={navLink}>
            Register
          </a>

        </div>
      </nav>


      {/* ================= LOGIN SECTION ================= */}

      <section
        style={{
          minHeight:
            "calc(100vh - 75px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          boxSizing: "border-box",
        }}
      >

        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            background:
              "rgba(20,12,32,0.9)",
            border:
              "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "45px 35px",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >

          {/* HEADER */}

          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
            }}
          >

            <div
              style={{
                fontSize: "55px",
                marginBottom: "12px",
              }}
            >
              🌙
            </div>

            <p
              style={{
                color: "#d9ad63",
                letterSpacing: "4px",
                fontSize: "11px",
                marginBottom: "12px",
              }}
            >
              SHWETHA COSMIC
            </p>

            <h1
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
                fontSize: "40px",
                fontWeight: "500",
                margin: 0,
              }}
            >
              Welcome{" "}
              <span
                style={{
                  color: "#d9ad63",
                }}
              >
                Back
              </span>
            </h1>

            <p
              style={{
                color: "#938a9f",
                fontSize: "14px",
                marginTop: "12px",
              }}
            >
              Login to continue your
              cosmic journey.
            </p>

          </div>


          {/* ERROR */}

          {error && (
            <div
              style={{
                padding: "13px",
                marginBottom: "20px",
                borderRadius: "9px",
                background:
                  "rgba(255,80,80,0.1)",
                border:
                  "1px solid rgba(255,80,80,0.25)",
                color: "#ff8585",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}


          {/* FORM */}

          <form onSubmit={handleSubmit}>

            {/* EMAIL */}

            <label style={labelStyle}>
              EMAIL ADDRESS
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              required
              autoComplete="email"
              style={inputStyle}
            />


            {/* PASSWORD */}

            <label style={labelStyle}>
              PASSWORD
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              style={inputStyle}
            />


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "25px",
                border: "none",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, #d9ad63, #b8893f)",
                color: "#160d20",
                fontWeight: "700",
                fontSize: "15px",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                opacity: loading
                  ? 0.7
                  : 1,
              }}
            >
              {loading
                ? "Logging in..."
                : "Login ✨"}
            </button>

          </form>


          {/* REGISTER */}

          <p
            style={{
              textAlign: "center",
              color: "#938a9f",
              fontSize: "13px",
              marginTop: "25px",
            }}
          >
            Don't have an account?{" "}

            <a
              href="/register"
              style={{
                color: "#d9ad63",
                textDecoration: "none",
              }}
            >
              Create Account
            </a>

          </p>

        </div>

      </section>


      {/* FOOTER */}

      <footer
        style={{
          textAlign: "center",
          padding: "25px",
          borderTop:
            "1px solid rgba(255,255,255,0.08)",
          color: "#777080",
        }}
      >

        <p
          style={{
            color: "#d9ad63",
            fontFamily:
              'Georgia, "Times New Roman", serif',
          }}
        >
          🌙 Shwetha Cosmic
        </p>

        <p>
          Astrology • Guidance • Destiny
        </p>

        <p
          style={{
            fontSize: "12px",
          }}
        >
          © 2026 Shwetha Cosmic.
          All rights reserved.
        </p>

      </footer>

    </div>
  );
}


const navLink = {
  color: "#b8afc0",
  textDecoration: "none",
  fontSize: "14px",
};


const labelStyle = {
  display: "block",
  color: "#d9ad63",
  fontSize: "11px",
  letterSpacing: "1.5px",
  marginTop: "20px",
  marginBottom: "9px",
};


const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "15px",
  borderRadius: "9px",
  border:
    "1px solid rgba(255,255,255,0.1)",
  background: "#0b0613",
  color: "#fff",
  outline: "none",
  fontSize: "14px",
};


export default Login;