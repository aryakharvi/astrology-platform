import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("User data error:", error);
  }

  const userName = user?.name || "User";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0712",
        color: "white",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <h2
          style={{
            color: "#d9ad63",
            margin: 0,
          }}
        >
          ✨ Shwetha Cosmic
        </h2>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid #d9ad63",
            background: "transparent",
            color: "#d9ad63",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* WELCOME */}

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto 40px",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            marginBottom: "8px",
          }}
        >
          Welcome, {userName} 👋
        </h1>

        <p
          style={{
            color: "#aaa",
            fontSize: "18px",
          }}
        >
          Explore your cosmic journey.
        </p>
      </div>

      {/* CARDS */}

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "25px",
        }}
      >
        {/* PROFILE */}

        <div
          onClick={() => navigate("/profile")}
          style={cardStyle}
        >
          <div style={iconStyle}>👤</div>

          <h2 style={titleStyle}>My Profile</h2>

          <p style={descriptionStyle}>
            View and manage your profile
          </p>
        </div>

        {/* KUNDLI */}

        <div
          onClick={() => navigate("/kundli")}
          style={cardStyle}
        >
          <div style={iconStyle}>🔮</div>

          <h2 style={titleStyle}>My Kundli</h2>

          <p style={descriptionStyle}>
            Create and view your birth chart
          </p>
        </div>

        {/* ASTROLOGERS */}

        <div
          onClick={() => navigate("/astrologer")}
          style={cardStyle}
        >
          <div style={iconStyle}>✨</div>

          <h2 style={titleStyle}>Astrologers</h2>

          <p style={descriptionStyle}>
            Connect with expert astrologers
          </p>
        </div>

        {/* BOOKING */}

        <div
          onClick={() => navigate("/booking")}
          style={cardStyle}
        >
          <div style={iconStyle}>📅</div>

          <h2 style={titleStyle}>My Bookings</h2>

          <p style={descriptionStyle}>
            View your astrology appointments
          </p>
        </div>

        {/* SERVICES */}

        <div
          onClick={() => navigate("/services")}
          style={cardStyle}
        >
          <div style={iconStyle}>🌙</div>

          <h2 style={titleStyle}>Services</h2>

          <p style={descriptionStyle}>
            Explore our astrology services
          </p>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#171020",
  padding: "30px",
  borderRadius: "18px",
  border: "1px solid #29202f",
  cursor: "pointer",
  transition: "transform 0.2s",
};

const iconStyle = {
  fontSize: "45px",
  marginBottom: "15px",
};

const titleStyle = {
  color: "#d9ad63",
  marginBottom: "8px",
};

const descriptionStyle = {
  color: "#aaa",
  lineHeight: "1.5",
};

export default Dashboard;