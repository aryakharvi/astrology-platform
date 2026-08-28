import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api";

function Navbar({ activePage = "" }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    setIsLoggedIn(!!token);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  /* ================= NOTIFICATIONS ================= */
  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unread_count || 0));
      }
    } catch (e) {
      // ignore — notifications are non-critical
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadNotifications();
  }, [isLoggedIn, loadNotifications]);

  // Refresh notifications periodically
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, loadNotifications]);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_BASE}/notifications/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const isActive = (page) => activePage === page;

  return (
    <nav style={navStyle}>

      {/* LOGO */}
      <a href="/" style={logoStyle}>
        🌙 <span style={{ color: "#d9ad63" }}>Shwetha Cosmic</span>
      </a>

      {/* NAV LINKS */}
      <div style={linksStyle}>
        <a href="/" style={isActive("home") ? activeLinkStyle : linkStyle}>Home</a>
        <a href="/services" style={isActive("services") ? activeLinkStyle : linkStyle}>Services</a>
        <a href="/astrologer" style={isActive("astrologer") ? activeLinkStyle : linkStyle}>Astrologer</a>
        <a href="/booking" style={isActive("booking") ? activeLinkStyle : linkStyle}>Booking</a>
        {isLoggedIn && (
          <a href="/kundli" style={isActive("kundli") ? activeLinkStyle : linkStyle}>Kundli</a>
        )}
      </div>

      {/* AUTH BUTTONS */}
      <div style={authStyle}>
        {isLoggedIn ? (
          <>
            {/* NOTIFICATION BELL */}
            <div style={notifWrapStyle}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                style={notifBellStyle}
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={notifBadgeStyle}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div style={notifOverlayStyle} onClick={() => setNotifOpen(false)} />
                  <div style={notifDropdownStyle}>
                    <div style={notifHeaderStyle}>
                      <strong>🔔 Notifications</strong>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} style={markReadBtnStyle}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <p style={notifEmptyStyle}>No notifications yet.</p>
                    ) : (
                      <div style={notifListStyle}>
                        {notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            style={{
                              ...notifItemStyle,
                              ...(n.is_read ? {} : notifItemUnreadStyle),
                            }}
                          >
                            <div style={notifItemTitleStyle}>
                              {n.title || "Notification"}
                            </div>
                            <div style={notifItemMsgStyle}>{n.message}</div>
                            <div style={notifItemTimeStyle}>
                              {formatNotifTime(n.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <a href="/dashboard" style={isActive("dashboard") ? activeLinkStyle : linkStyle}>
              👤 {user?.name?.split(" ")[0] || "Dashboard"}
            </a>
            {user?.role === "admin" && (
              <>
                <a href="/reader-dashboard" style={isActive("reader-dashboard") ? activeLinkStyle : linkStyle}>
                  ✨ Reader
                </a>
                <a href="/admin" style={isActive("admin") ? activeLinkStyle : linkStyle}>
                  ⚙️ Admin
                </a>
              </>
            )}
            <button onClick={handleLogout} style={logoutBtnStyle}>
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login" style={linkStyle}>Login</a>
            <a href="/register" style={registerBtnStyle}>Register</a>
          </>
        )}
      </div>

    </nav>
  );
}

/* =====================================================
   HELPERS
===================================================== */
function formatNotifTime(value) {
  if (!value) return "";
  const str = String(value);
  // "YYYY-MM-DD HH:MM:SS" or ISO — show short date
  const datePart = str.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short",
    });
  }
  return str;
}

/* =====================================================
   STYLES
===================================================== */

const navStyle = {
  height: "70px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 6%",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(5,3,10,0.90)",
  backdropFilter: "blur(18px)",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const logoStyle = {
  textDecoration: "none",
  color: "#fff",
  fontSize: "20px",
  fontFamily: 'Georgia, "Times New Roman", serif',
  letterSpacing: "0.5px",
};

const linksStyle = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
};

const linkStyle = {
  color: "#b8afc0",
  textDecoration: "none",
  fontSize: "14px",
  transition: "color 0.2s ease",
};

const activeLinkStyle = {
  ...linkStyle,
  color: "#d9ad63",
  fontWeight: "600",
};

const authStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const registerBtnStyle = {
  color: "#160d20",
  background: "linear-gradient(135deg, #d9ad63, #b8893f)",
  textDecoration: "none",
  padding: "8px 18px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "700",
};

const logoutBtnStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#b8afc0",
  padding: "7px 15px",
  borderRadius: "8px",
  fontSize: "13px",
  cursor: "pointer",
};

/* ---------- NOTIFICATIONS ---------- */

const notifWrapStyle = {
  position: "relative",
};

const notifBellStyle = {
  position: "relative",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  padding: "7px 12px",
  fontSize: "17px",
  cursor: "pointer",
  lineHeight: 1,
};

const notifBadgeStyle = {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  background: "#ff5d5d",
  color: "#fff",
  fontSize: "9px",
  fontWeight: "700",
  borderRadius: "10px",
  padding: "2px 6px",
  minWidth: "16px",
  textAlign: "center",
};

const notifOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
  background: "transparent",
};

const notifDropdownStyle = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  width: "320px",
  maxHeight: "420px",
  overflowY: "auto",
  background: "#120b1d",
  border: "1px solid rgba(217,173,99,0.2)",
  borderRadius: "14px",
  padding: "14px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  zIndex: 100,
};

const notifHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  paddingBottom: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  color: "#d9ad63",
  fontSize: "13px",
};

const markReadBtnStyle = {
  background: "none",
  border: "none",
  color: "#91889c",
  fontSize: "11px",
  cursor: "pointer",
  textDecoration: "underline",
};

const notifEmptyStyle = {
  color: "#777080",
  textAlign: "center",
  padding: "20px 0",
  fontSize: "13px",
};

const notifListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const notifItemStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.03)",
};

const notifItemUnreadStyle = {
  background: "rgba(217,173,99,0.08)",
  borderLeft: "2px solid #d9ad63",
};

const notifItemTitleStyle = {
  color: "#d9ad63",
  fontSize: "12px",
  fontWeight: "600",
  marginBottom: "3px",
};

const notifItemMsgStyle = {
  color: "#ddd",
  fontSize: "12px",
  lineHeight: "1.5",
};

const notifItemTimeStyle = {
  color: "#777080",
  fontSize: "10px",
  marginTop: "5px",
};

export default Navbar;
