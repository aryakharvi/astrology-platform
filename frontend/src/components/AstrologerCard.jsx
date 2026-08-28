function AstrologerCard({ astrologer, onBook }) {
  return (
    <div style={cardStyle}>

      {/* PROFILE TOP */}
      <div style={profileTopStyle}>

        <div style={avatarStyle}>
          {astrologer.name
            ? astrologer.name.charAt(0).toUpperCase()
            : "A"}
        </div>

        <div>
          <h2 style={nameStyle}>{astrologer.name}</h2>
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
            background: astrologer.is_online ? "#4ade80" : "#555",
          }}
        />
        <span style={{ color: astrologer.is_online ? "#71e0a5" : "#888", fontSize: "13px" }}>
          {astrologer.is_online ? "Online Now" : "Offline"}
        </span>
      </div>

      {/* RATING */}
      <div style={ratingRowStyle}>
        <span style={ratingStyle}>⭐ {astrologer.rating}</span>
        <span style={experienceStyle}>
          {astrologer.experience} yrs experience
        </span>
      </div>

      {/* BIO */}
      <p style={bioStyle}>
        {astrologer.bio ||
          "Experienced astrologer providing personalized cosmic guidance."}
      </p>

      {/* INFO BOX */}
      <div style={infoBoxStyle}>
        <div>
          <span style={infoLabelStyle}>LANGUAGES</span>
          <span style={infoValueStyle}>
            {astrologer.languages || "English"}
          </span>
        </div>
        <div>
          <span style={infoLabelStyle}>CONSULTATION</span>
          <span style={priceStyle}>
            ₹{Number(astrologer.price_per_minute).toFixed(0)}/min
          </span>
        </div>
      </div>

      {/* BOOK BUTTON */}
      <button
        onClick={() => onBook && onBook(astrologer)}
        style={{
          ...bookButtonStyle,
          opacity: astrologer.is_online ? 1 : 0.65,
        }}
      >
        {astrologer.is_online
          ? "Book Consultation ✨"
          : "Book for Later →"}
      </button>

    </div>
  );
}

/* =====================================================
   STYLES
===================================================== */

const cardStyle = {
  background: "rgba(20, 12, 32, 0.88)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
  background: "linear-gradient(135deg, #d9ad63, #8d6630)",
  color: "#160d20",
  fontSize: "25px",
  fontWeight: "700",
  flexShrink: 0,
};

const nameStyle = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "22px",
  fontWeight: "500",
  color: "#fff",
};

const specializationStyle = {
  color: "#d9ad63",
  fontSize: "13px",
  marginTop: "5px",
};

const statusRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginTop: "16px",
};

const statusDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  display: "inline-block",
};

const ratingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "16px",
  paddingBottom: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: "14px",
  color: "#fff",
};

const ratingStyle = {
  fontWeight: "600",
};

const experienceStyle = {
  color: "#aaa1b0",
};

const bioStyle = {
  color: "#9d94a7",
  lineHeight: "1.7",
  fontSize: "14px",
  minHeight: "65px",
  marginTop: "14px",
};

const infoBoxStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
  marginTop: "14px",
  padding: "14px",
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
  fontSize: "13px",
};

const priceStyle = {
  color: "#d9ad63",
  fontWeight: "700",
  fontSize: "14px",
};

const bookButtonStyle = {
  width: "100%",
  marginTop: "20px",
  padding: "13px",
  border: "none",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #d9ad63, #b8893f)",
  color: "#160d20",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
  transition: "transform 0.15s ease",
};

export default AstrologerCard;
