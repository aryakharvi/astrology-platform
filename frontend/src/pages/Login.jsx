import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
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

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      console.log("Login successful:", data);

      // Save logged-in user
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Go to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Make sure backend is running on port 5000."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0712",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
        boxSizing: "border-box",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#171020",
          padding: "40px",
          borderRadius: "20px",
          boxSizing: "border-box",
          boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              fontSize: "55px",
            }}
          >
            ✨
          </div>

          <h1
            style={{
              margin: "5px 0",
              color: "#ffffff",
            }}
          >
            Shwetha Cosmic
          </h1>

          <p
            style={{
              color: "#aaa",
              fontSize: "18px",
            }}
          >
            Welcome back
          </p>
        </div>

        {/* Error */}

        {error && (
          <div
            style={{
              background: "#4a1717",
              color: "#ffb3b3",
              padding: "14px",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}

        <form onSubmit={handleLogin}>
          {/* Email */}

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "16px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            required
            style={inputStyle}
          />

          {/* Password */}

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "16px",
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            style={inputStyle}
          />

          {/* Forgot Password */}

          <div
            style={{
              textAlign: "right",
              marginBottom: "25px",
            }}
          >
            <span
              style={{
                color: "#d9ad63",
                cursor: "pointer",
              }}
            >
              Forgot Password?
            </span>
          </div>

          {/* Login Button */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "10px",
              background: "#9b6cff",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logging in..." : "Login ✦"}
          </button>
        </form>

        {/* Register */}

        <p
          style={{
            textAlign: "center",
            marginTop: "30px",
            color: "#aaa",
          }}
        >
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{
              color: "#d9ad63",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Create Account
          </span>
        </p>

        {/* Home */}

        <button
          onClick={() => navigate("/")}
          style={{
            display: "block",
            margin: "20px auto 0",
            background: "transparent",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "22px",
  boxSizing: "border-box",
  background: "#0f0a16",
  color: "white",
  border: "1px solid #444",
  borderRadius: "8px",
  fontSize: "16px",
  outline: "none",
};

export default Login;