import React from "react";
import { useNavigate } from "react-router-dom";

function Kundli() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0712",
        color: "white",
        padding: "40px",
      }}
    >
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          padding: "10px 20px",
          background: "transparent",
          color: "#d9ad63",
          border: "1px solid #d9ad63",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ← Dashboard
      </button>

      <div
        style={{
          maxWidth: "600px",
          margin: "60px auto",
          background: "#171020",
          padding: "40px",
          borderRadius: "20px",
        }}
      >
        <h1>🔮 Create Your Kundli</h1>

        <p style={{ color: "#aaa" }}>
          Enter your birth details.
        </p>

        <input
          type="text"
          placeholder="Full Name"
          style={inputStyle}
        />

        <input
          type="date"
          style={inputStyle}
        />

        <input
          type="time"
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Place of Birth"
          style={inputStyle}
        />

        <button
          style={{
            width: "100%",
            padding: "14px",
            background: "#9b6cff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
          }}
        >
          Create Kundli 🔮
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px",
  margin: "10px 0",
  boxSizing: "border-box",
  background: "#0f0a16",
  color: "white",
  border: "1px solid #444",
  borderRadius: "8px",
};

export default Kundli;