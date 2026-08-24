import { useEffect, useState } from "react";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      // Get users
      const usersResponse = await fetch(
        "http://localhost:5000/api/users",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const usersData =
        await usersResponse.json();

      if (!usersResponse.ok) {
        throw new Error(
          usersData.message ||
            "Failed to load users"
        );
      }

      // Get astrologers
      const astrologersResponse =
        await fetch(
          "http://localhost:5000/api/astrologers"
        );

      const astrologersData =
        await astrologersResponse.json();

      if (!astrologersResponse.ok) {
        throw new Error(
          astrologersData.message ||
            "Failed to load astrologers"
        );
      }

      setUsers(
        usersData.users ||
        usersData ||
        []
      );

      setAstrologers(
        astrologersData.astrologers ||
        []
      );

    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setError(
        err.message ||
          "Failed to load admin data"
      );

    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };


  const onlineAstrologers =
    astrologers.filter(
      (astro) =>
        Number(astro.is_online) === 1
    ).length;


  if (loading) {
    return (
      <div style={styles.loading}>
        <div>
          <div style={styles.loadingIcon}>
            🔮
          </div>

          <h2>
            Loading Admin Dashboard...
          </h2>

          <p>
            Please wait.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div style={styles.page}>

      {/* ================= NAVBAR ================= */}

      <nav style={styles.navbar}>

        <div style={styles.logo}>
          🌙 Shwetha Cosmic

          <span style={styles.adminBadge}>
            ADMIN
          </span>
        </div>


        <div style={styles.navRight}>

          <a
            href="/"
            style={styles.navLink}
          >
            Website
          </a>

          <a
            href="/dashboard"
            style={styles.navLink}
          >
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


      {/* ================= HEADER ================= */}

      <header style={styles.header}>

        <div style={styles.headerIcon}>
          🔮
        </div>

        <div style={styles.smallTitle}>
          SHWETHA COSMIC
        </div>

        <h1 style={styles.title}>
          Admin{" "}
          <span style={styles.gold}>
            Dashboard
          </span>
        </h1>

        <p style={styles.subtitle}>
          Manage your astrology platform
          from one place.
        </p>

      </header>


      {/* ================= MAIN ================= */}

      <main style={styles.container}>

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}


        {/* ================= STATS ================= */}

        <section style={styles.statsGrid}>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              👥
            </div>

            <div style={styles.statTitle}>
              Total Users
            </div>

            <div style={styles.statNumber}>
              {users.length}
            </div>
          </div>


          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              🔮
            </div>

            <div style={styles.statTitle}>
              Astrologers
            </div>

            <div style={styles.statNumber}>
              {astrologers.length}
            </div>
          </div>


          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              🟢
            </div>

            <div style={styles.statTitle}>
              Online
            </div>

            <div style={styles.statNumber}>
              {onlineAstrologers}
            </div>
          </div>

        </section>


        {/* ================= USERS ================= */}

        <section style={styles.section}>

          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Registered Users
              </h2>

              <p style={styles.sectionSubtitle}>
                Users registered on your
                website.
              </p>
            </div>

            <div style={styles.countBadge}>
              {users.length} Users
            </div>
          </div>


          {users.length === 0 ? (

            <div style={styles.empty}>
              No users found.
            </div>

          ) : (

            <div style={styles.tableWrapper}>

              <table style={styles.table}>

                <thead>
                  <tr>
                    <th style={styles.th}>
                      ID
                    </th>

                    <th style={styles.th}>
                      Name
                    </th>

                    <th style={styles.th}>
                      Email
                    </th>

                    <th style={styles.th}>
                      Phone
                    </th>

                    <th style={styles.th}>
                      Role
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {users.map((user) => (

                    <tr key={user.id}>

                      <td style={styles.td}>
                        {user.id}
                      </td>

                      <td style={styles.td}>
                        {user.name}
                      </td>

                      <td style={styles.td}>
                        {user.email}
                      </td>

                      <td style={styles.td}>
                        {user.phone || "-"}
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


        {/* ================= ASTROLOGERS ================= */}

        <section style={styles.section}>

          <div style={styles.sectionHeader}>

            <div>

              <h2 style={styles.sectionTitle}>
                Expert Astrologers
              </h2>

              <p style={styles.sectionSubtitle}>
                Manage astrologers available
                on your platform.
              </p>

            </div>

            <div style={styles.countBadge}>
              {astrologers.length}
            </div>

          </div>


          {astrologers.length === 0 ? (

            <div style={styles.empty}>
              No astrologers found.
            </div>

          ) : (

            <div style={styles.astroGrid}>

              {astrologers.map(
                (astro) => (

                  <div
                    key={astro.id}
                    style={styles.astroCard}
                  >

                    <div
                      style={
                        styles.astroTop
                      }
                    >

                      <div
                        style={
                          styles.astroAvatar
                        }
                      >
                        🔮
                      </div>

                      <div>

                        <h3
                          style={
                            styles.astroName
                          }
                        >
                          {astro.name}
                        </h3>

                        <p
                          style={
                            styles.astroSpecialization
                          }
                        >
                          {
                            astro.specialization
                          }
                        </p>

                      </div>

                    </div>


                    <div
                      style={
                        styles.astroDetails
                      }
                    >

                      <span>
                        ⭐ {astro.rating}
                      </span>

                      <span>
                        {astro.experience}
                        {" "}years
                      </span>

                      <span>
                        ₹
                        {
                          astro.price_per_minute
                        }
                        /min
                      </span>

                    </div>


                    <div
                      style={
                        Number(
                          astro.is_online
                        ) === 1
                          ? styles.online
                          : styles.offline
                      }
                    >

                      {Number(
                        astro.is_online
                      ) === 1
                        ? "🟢 Online"
                        : "⚪ Offline"}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ================= REFRESH ================= */}

        <div style={styles.refreshContainer}>

          <button
            onClick={loadAdminData}
            style={styles.refreshButton}
          >
            🔄 Refresh Data
          </button>

        </div>

      </main>

    </div>
  );
}


const styles = {

  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #241442 0%, #0b0614 45%, #05030a 100%)",
    color: "#ffffff",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    background: "#0b0614",
    color: "#ffffff",
  },

  loadingIcon: {
    fontSize: "60px",
    marginBottom: "20px",
  },

  navbar: {
    minHeight: "75px",
    padding: "0 7%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
    background:
      "rgba(5,3,10,0.9)",
    boxSizing: "border-box",
  },

  logo: {
    color: "#d9ad63",
    fontSize: "20px",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    whiteSpace: "nowrap",
  },

  adminBadge: {
    marginLeft: "10px",
    padding: "5px 9px",
    borderRadius: "5px",
    background: "#d9ad63",
    color: "#160d20",
    fontSize: "10px",
    fontWeight: "700",
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },

  navLink: {
    color: "#b8afc0",
    textDecoration: "none",
    fontSize: "14px",
  },

  logoutButton: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 17px",
    background:
      "linear-gradient(135deg, #d9ad63, #b8893f)",
    color: "#160d20",
    fontWeight: "700",
    cursor: "pointer",
  },

  header: {
    textAlign: "center",
    padding: "60px 20px 40px",
  },

  headerIcon: {
    fontSize: "55px",
    marginBottom: "15px",
  },

  smallTitle: {
    color: "#d9ad63",
    letterSpacing: "4px",
    fontSize: "11px",
  },

  title: {
    fontSize: "42px",
    fontWeight: "500",
    fontFamily:
      'Georgia, "Times New Roman", serif',
    margin: "12px 0",
  },

  gold: {
    color: "#d9ad63",
  },

  subtitle: {
    color: "#938a9f",
    fontSize: "15px",
  },

  container: {
    width: "90%",
    maxWidth: "1200px",
    margin: "0 auto",
    paddingBottom: "70px",
  },

  error: {
    padding: "15px 18px",
    marginBottom: "25px",
    borderRadius: "10px",
    background:
      "rgba(255,80,80,0.1)",
    border:
      "1px solid rgba(255,80,80,0.25)",
    color: "#ff8585",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },

  statCard: {
    padding: "28px",
    borderRadius: "16px",
    background:
      "rgba(20,12,32,0.9)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    textAlign: "center",
  },

  statIcon: {
    fontSize: "35px",
    marginBottom: "10px",
  },

  statTitle: {
    color: "#938a9f",
    fontSize: "14px",
    marginBottom: "8px",
  },

  statNumber: {
    color: "#d9ad63",
    fontSize: "35px",
    fontWeight: "700",
  },

  section: {
    marginTop: "25px",
    padding: "25px",
    borderRadius: "16px",
    background:
      "rgba(20,12,32,0.9)",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontFamily:
      'Georgia, "Times New Roman", serif',
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#777080",
    fontSize: "13px",
  },

  countBadge: {
    padding: "8px 13px",
    borderRadius: "20px",
    background:
      "rgba(217,173,99,0.12)",
    color: "#d9ad63",
    fontSize: "12px",
    fontWeight: "700",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },

  th: {
    padding: "14px 12px",
    textAlign: "left",
    color: "#d9ad63",
    fontSize: "12px",
    borderBottom:
      "1px solid rgba(255,255,255,0.1)",
  },

  td: {
    padding: "15px 12px",
    color: "#d0c9d6",
    fontSize: "13px",
    borderBottom:
      "1px solid rgba(255,255,255,0.06)",
  },

  adminRole: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "5px",
    background:
      "rgba(217,173,99,0.15)",
    color: "#d9ad63",
    fontSize: "11px",
    fontWeight: "700",
  },

  userRole: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "5px",
    background:
      "rgba(255,255,255,0.06)",
    color: "#aaa2b1",
    fontSize: "11px",
  },

  empty: {
    padding: "35px",
    textAlign: "center",
    color: "#777080",
  },

  astroGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },

  astroCard: {
    padding: "20px",
    borderRadius: "13px",
    background:
      "rgba(255,255,255,0.025)",
    border:
      "1px solid rgba(255,255,255,0.07)",
  },

  astroTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  astroAvatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(217,173,99,0.12)",
    fontSize: "25px",
  },

  astroName: {
    margin: 0,
    fontSize: "17px",
  },

  astroSpecialization: {
    margin: "5px 0 0",
    color: "#938a9f",
    fontSize: "12px",
  },

  astroDetails: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
    color: "#b8afc0",
    fontSize: "12px",
  },

  online: {
    marginTop: "15px",
    color: "#70d890",
    fontSize: "12px",
    fontWeight: "600",
  },

  offline: {
    marginTop: "15px",
    color: "#8b8491",
    fontSize: "12px",
  },

  refreshContainer: {
    textAlign: "center",
    marginTop: "30px",
  },

  refreshButton: {
    border: "1px solid rgba(217,173,99,0.4)",
    borderRadius: "9px",
    padding: "12px 20px",
    background:
      "rgba(217,173,99,0.08)",
    color: "#d9ad63",
    cursor: "pointer",
    fontWeight: "600",
  },
};


export default AdminDashboard;