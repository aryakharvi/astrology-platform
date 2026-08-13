import React from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error("User data error:", error);
  }

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // If no user is stored
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b0712",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div>
          <h1>🔐 Please Login</h1>

          <p style={{ color: "#aaa" }}>
            Your login session was not found.
          </p>

          <button
            onClick={() => navigate("/login")}
            style={{
              marginTop: "20px",
              padding: "12px 25px",
              border: "none",
              borderRadius: "8px",
              background: "#9b6cff",
              color: "white",
              fontSize: "16px",
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
        background: "#0b0712",
        color: "white",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "50px",
        }}
      >
        <h2
          style={{
            color: "#d9ad63",
            margin: 0,
          }}
        >
          🌙 Shwetha Cosmic
        </h2>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "1px solid #d9ad63",
            background: "transparent",
            color: "#d9ad63",
            cursor: "pointer",
          }}
        >
          ← Dashboard
        </button>
      </header>

      {/* Main */}

      <main
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        {/* Profile heading */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "#9b6cff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "45px",
              margin: "0 auto 20px",
            }}
          >
            👤
          </div>

          <h1 style={{ marginBottom: "8px" }}>
            {user.name || "User"}
          </h1>

          <p style={{ color: "#aaa" }}>
            Your Shwetha Cosmic Profile
          </p>
        </div>

        {/* Profile information */}

        <div
          style={{
            background: "#171020",
            borderRadius: "18px",
            padding: "30px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <ProfileItem
            title="Full Name"
            value={user.name || "Not available"}
          />

          <ProfileItem
            title="Email"
            value={user.email || "Not available"}
          />

          <ProfileItem
            title="Account Type"
            value={user.role || "user"}
          />

          <ProfileItem
            title="User ID"
            value={user.id || "Not available"}
            last
          />
        </div>

        {/* Logout */}

        <button
          onClick={logout}
          style={{
            width: "100%",
            marginTop: "25px",
            padding: "14px",
            borderRadius: "10px",
            border: "none",
            background: "#8b3030",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🚪 Logout
        </button>
      </main>
    </div>
  );
};

function ProfileItem({ title, value, last }) {
  return (
    <div
      style={{
        padding: "18px 0",
        borderBottom: last
          ? "none"
          : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          color: "#d9ad63",
          fontSize: "14px",
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: 0,
          color: "#eee",
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default Profile;