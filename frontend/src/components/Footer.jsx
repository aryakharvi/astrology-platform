function Footer() {
  return (
    <footer style={footerStyle}>

      <div style={topStyle}>

        <div style={brandStyle}>
          <div style={logoStyle}>🌙 Shwetha Cosmic</div>
          <p style={taglineStyle}>
            Astrology • Guidance • Destiny
          </p>
        </div>

        <div style={linksGroupStyle}>

          <div style={linkColStyle}>
            <p style={colTitleStyle}>Navigate</p>
            <a href="/" style={linkStyle}>Home</a>
            <a href="/services" style={linkStyle}>Services</a>
            <a href="/astrologer" style={linkStyle}>Astrologers</a>
            <a href="/booking" style={linkStyle}>Booking</a>
          </div>

          <div style={linkColStyle}>
            <p style={colTitleStyle}>Account</p>
            <a href="/login" style={linkStyle}>Login</a>
            <a href="/register" style={linkStyle}>Register</a>
            <a href="/dashboard" style={linkStyle}>Dashboard</a>
            <a href="/kundli" style={linkStyle}>Kundli</a>
          </div>

        </div>

      </div>

      <div style={bottomStyle}>
        <p style={copyrightStyle}>
          © 2026 Shwetha Cosmic. All rights reserved.
        </p>
      </div>

    </footer>
  );
}

/* =====================================================
   STYLES
===================================================== */

const footerStyle = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(5,3,10,0.70)",
  padding: "50px 7% 25px",
  marginTop: "80px",
};

const topStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "40px",
  paddingBottom: "35px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const brandStyle = {
  maxWidth: "260px",
};

const logoStyle = {
  color: "#d9ad63",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "20px",
  marginBottom: "10px",
};

const taglineStyle = {
  color: "#777080",
  fontSize: "13px",
  lineHeight: "1.6",
};

const linksGroupStyle = {
  display: "flex",
  gap: "50px",
  flexWrap: "wrap",
};

const linkColStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const colTitleStyle = {
  color: "#d9ad63",
  fontSize: "11px",
  letterSpacing: "2px",
  fontWeight: "700",
  marginBottom: "4px",
};

const linkStyle = {
  color: "#8d849a",
  textDecoration: "none",
  fontSize: "14px",
  transition: "color 0.2s ease",
};

const bottomStyle = {
  paddingTop: "22px",
  textAlign: "center",
};

const copyrightStyle = {
  color: "#504860",
  fontSize: "12px",
};

export default Footer;
