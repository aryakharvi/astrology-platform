import { useCallback, useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

function Admin() {
  const [users, setUsers] = useState([]);
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, astrologersResponse] =
        await Promise.all([
          fetch(`${API_BASE}/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_BASE}/astrologers`),
        ]);

      const usersData = await usersResponse.json();
      const astrologersData = await astrologersResponse.json();

      if (!usersResponse.ok) {
        throw new Error(
          usersData.message || "Failed to load users"
        );
      }

      if (!astrologersResponse.ok) {
        throw new Error(
          astrologersData.message ||
          "Failed to load astrologers"
        );
      }

      // /api/users returns a plain array; /api/astrologers
      // returns { astrologers: [...] }
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAstrologers(
        Array.isArray(astrologersData)
          ? astrologersData
          : astrologersData.astrologers || []
      );
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    loadData();
  }, [token, loadData]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div style={styles.page}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>
          🌙 Shwetha Cosmic
          <span style={styles.adminBadge}>ADMIN</span>
        </div>

        <div style={styles.navRight}>
          <a href="/" style={styles.navLink}>
            Website
          </a>

          <a href="/dashboard" style={styles.navLink}>
            User Dashboard
          </a>

          <button
            onClick={logout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* HEADER */}
      <section style={styles.header}>
        <div style={styles.icon}>👑</div>

        <p style={styles.smallTitle}>
          SHWETHA COSMIC
        </p>

        <h1 style={styles.title}>
          Admin <span>Dashboard</span>
        </h1>

        <p style={styles.subtitle}>
          Manage your astrology platform from one place.
        </p>
      </section>

      <main style={styles.container}>
        {/* ERROR */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* STATS */}
        <section style={styles.statsGrid}>
          <StatCard
            icon="👥"
            title="Users"
            value={users.length}
          />

          <StatCard
            icon="🔮"
            title="Astrologers"
            value={astrologers.length}
          />

          <StatCard
            icon="🟢"
            title="Online"
            value={
              astrologers.filter(
                (astro) => Number(astro.is_online) === 1
              ).length
            }
          />

          <StatCard
            icon="⭐"
            title="Top Rating"
            value={
              astrologers.length
                ? Math.max(
                  ...astrologers.map(
                    (astro) =>
                      Number(astro.rating) || 0
                  )
                ).toFixed(1)
                : "0.0"
            }
          />
        </section>

        {/* ACTIONS */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Admin Controls
              </h2>

              <p style={styles.cardDescription}>
                Manage your platform data.
              </p>
            </div>

            <button
              onClick={loadData}
              style={styles.refreshButton}
            >
              🔄 Refresh
            </button>
          </div>

          <div style={styles.actionGrid}>
            <a
              href="/astrologer"
              style={styles.actionButton}
            >
              🔮
              <span>
                <strong>View Astrologers</strong>
                <small>
                  See all astrologers
                </small>
              </span>
            </a>

            <a
              href="/booking"
              style={styles.actionButton}
            >
              📅
              <span>
                <strong>Bookings</strong>
                <small>
                  View booking section
                </small>
              </span>
            </a>

            <a
              href="/profile"
              style={styles.actionButton}
            >
              👤
              <span>
                <strong>My Profile</strong>
                <small>
                  View admin profile
                </small>
              </span>
            </a>
          </div>
        </section>

        {/* USERS */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                👥 Registered Users
              </h2>

              <p style={styles.cardDescription}>
                Users registered on Shwetha Cosmic.
              </p>
            </div>

            <span style={styles.countBadge}>
              {users.length} Users
            </span>
          </div>

          {loading ? (
            <p style={styles.loading}>
              Loading users...
            </p>
          ) : users.length === 0 ? (
            <p style={styles.empty}>
              No users found.
            </p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Role</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}>
                        #{user.id}
                      </td>

                      <td style={styles.td}>
                        {user.name}
                      </td>

                      <td style={styles.td}>
                        {user.email}
                      </td>

                      <td style={styles.td}>
                        {user.phone || "—"}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={
                            user.role === "admin"
                              ? styles.adminRole
                              : styles.userRole
                          }
                        >
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ASTROLOGERS */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                🔮 Astrologers
              </h2>

              <p style={styles.cardDescription}>
                Astrologers available on the platform.
              </p>
            </div>

            <span style={styles.countBadge}>
              {astrologers.length} Astrologers
            </span>
          </div>

          {loading ? (
            <p style={styles.loading}>
              Loading astrologers...
            </p>
          ) : astrologers.length === 0 ? (
            <p style={styles.empty}>
              No astrologers found.
            </p>
          ) : (
            <div style={styles.astrologerGrid}>
              {astrologers.map((astro) => (
                <div
                  key={astro.id}
                  style={styles.astrologerCard}
                >
                  <div style={styles.astroTop}>
                    <div style={styles.avatar}>
                      🔮
                    </div>

                    <div>
                      <h3 style={styles.astroName}>
                        {astro.name}
                      </h3>

                      <p style={styles.specialization}>
                        {astro.specialization}
                      </p>
                    </div>
                  </div>

                  <div style={styles.astroInfo}>
                    <span>
                      ⭐ {astro.rating || "5.0"}
                    </span>

                    <span>
                      {astro.experience} years
                    </span>

                    <span>
                      ₹{astro.price_per_minute}/min
                    </span>
                  </div>

                  <div style={styles.onlineRow}>
                    <span
                      style={{
                        color:
                          Number(astro.is_online) === 1
                            ? "#65e6a5"
                            : "#888",
                      }}
                    >
                      {Number(astro.is_online) === 1
                        ? "🟢 Online"
                        : "⚪ Offline"}
                    </span>

                    <span style={styles.languages}>
                      {astro.languages ||
                        "Languages not added"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p style={styles.footerLogo}>
          🌙 Shwetha Cosmic
        </p>

        <p>
          Astrology • Guidance • Destiny
        </p>

        <p style={styles.copyright}>
          © 2026 Shwetha Cosmic. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>
        <p style={styles.statTitle}>
          {title}
        </p>

        <h2 style={styles.statValue}>
          {value}
        </h2>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #241442 0%, #0b0614 45%, #05030a 100%)",
    color: "#fff",
    paddingBottom: "60px",
  },

  navbar: {
    height: "75px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 7%",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
    background: "rgba(5,3,10,0.9)",
    backdropFilter: "blur(15px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  logo: {
    color: "#d9ad63",
    fontSize: "21px",
    fontFamily:
      'Georgia, "Times New Roman", serif',
  },

  adminBadge: {
    display: "inline-block",
    marginLeft: "10px",
    padding: "4px 8px",
    borderRadius: "5px",
    background: "rgba(217,173,99,0.15)",
    border:
      "1px solid rgba(217,173,99,0.3)",
    fontSize: "9px",
    letterSpacing: "1px",
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
  },

  navLink: {
    color: "#b8afc0",
    textDecoration: "none",
    fontSize: "14px",
  },

  logoutButton: {
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    padding: "9px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  header: {
    textAlign: "center",
    padding: "65px 20px 40px",
  },

  icon: {
    fontSize: "50px",
    marginBottom: "12px",
  },

  smallTitle: {
    color: "#d9ad63",
    letterSpacing: "4px",
    fontSize: "11px",
  },

  title: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "44px",
    fontWeight: "500",
    margin: "10px 0",
  },

  subtitle: {
    color: "#9f96a8",
  },

  container: {
    width: "90%",
    maxWidth: "1200px",
    margin: "auto",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "18px",
    marginBottom: "25px",
  },

  statCard: {
    background:
      "rgba(20,12,32,0.85)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: "15px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  statIcon: {
    fontSize: "32px",
  },

  statTitle: {
    color: "#91889c",
    margin: "0 0 5px",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  statValue: {
    margin: 0,
    color: "#d9ad63",
    fontSize: "28px",
  },

  card: {
    background:
      "rgba(20,12,32,0.85)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "30px",
    marginBottom: "25px",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.2)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "25px",
  },

  cardTitle: {
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "25px",
    fontWeight: "500",
    margin: 0,
  },

  cardDescription: {
    color: "#8f8798",
    fontSize: "13px",
    marginBottom: 0,
  },

  refreshButton: {
    background:
      "linear-gradient(135deg, #d9ad63, #b8893f)",
    border: "none",
    color: "#160d20",
    fontWeight: "700",
    padding: "11px 17px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  actionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },

  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "18px",
    borderRadius: "12px",
    background:
      "rgba(217,173,99,0.06)",
    border:
      "1px solid rgba(217,173,99,0.15)",
    color: "#fff",
    textDecoration: "none",
    fontSize: "25px",
  },

  countBadge: {
    color: "#d9ad63",
    background:
      "rgba(217,173,99,0.08)",
    border:
      "1px solid rgba(217,173,99,0.2)",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "12px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    color: "#d9ad63",
    fontSize: "11px",
    letterSpacing: "1px",
    padding: "14px",
    borderBottom:
      "1px solid rgba(255,255,255,0.1)",
  },

  td: {
    padding: "15px 14px",
    color: "#c8c1ce",
    fontSize: "13px",
    borderBottom:
      "1px solid rgba(255,255,255,0.06)",
  },

  adminRole: {
    color: "#d9ad63",
    background:
      "rgba(217,173,99,0.1)",
    padding: "5px 9px",
    borderRadius: "5px",
    fontSize: "11px",
  },

  userRole: {
    color: "#8fd8ff",
    background:
      "rgba(80,160,220,0.1)",
    padding: "5px 9px",
    borderRadius: "5px",
    fontSize: "11px",
  },

  loading: {
    color: "#aaa",
    textAlign: "center",
    padding: "30px",
  },

  empty: {
    color: "#888",
    textAlign: "center",
    padding: "30px",
  },

  astrologerGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },

  astrologerCard: {
    background: "rgba(5,3,10,0.45)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "20px",
  },

  astroTop: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(217,173,99,0.1)",
    fontSize: "25px",
  },

  astroName: {
    margin: 0,
    fontSize: "17px",
  },

  specialization: {
    color: "#91889c",
    fontSize: "12px",
    margin: "5px 0 0",
  },

  astroInfo: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "20px",
    color: "#d9ad63",
    fontSize: "12px",
  },

  onlineRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "18px",
    paddingTop: "15px",
    borderTop:
      "1px solid rgba(255,255,255,0.07)",
    fontSize: "11px",
  },

  languages: {
    color: "#777080",
    textAlign: "right",
  },

  error: {
    padding: "14px",
    marginBottom: "20px",
    borderRadius: "10px",
    background:
      "rgba(255,70,70,0.1)",
    border:
      "1px solid rgba(255,70,70,0.2)",
    color: "#ff8b8b",
  },

  footer: {
    textAlign: "center",
    marginTop: "70px",
    paddingTop: "30px",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
    color: "#777080",
  },

  footerLogo: {
    color: "#d9ad63",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "18px",
  },

  copyright: {
    fontSize: "12px",
  },
};

export default Admin;
