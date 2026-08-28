import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

/* =====================================================
   MY KUNDLIS
   Lists all Kundlis belonging to the logged-in user.
   View / delete actions — both ownership-checked server-side.
===================================================== */
function MyKundlis() {
    const navigate = useNavigate();
    const [kundlis, setKundlis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem("token");

    const loadKundlis = async () => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_BASE}/kundli`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load Kundlis");
            }

            setKundlis(data.kundlis || []);
        } catch (err) {
            console.error("My Kundlis load error:", err);
            setError(err.message || "Unable to load your Kundlis.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKundlis();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (kundliId) => {
        if (!window.confirm("Delete this Kundli? This cannot be undone.")) {
            return;
        }

        try {
            setDeletingId(kundliId);
            setError("");

            const response = await fetch(`${API_BASE}/kundli/${kundliId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete Kundli");
            }

            setKundlis((prev) => prev.filter((k) => k.id !== kundliId));
            setSuccess("✅ Kundli deleted successfully.");
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            console.error("Delete Kundli error:", err);
            setError(err.message || "Unable to delete this Kundli.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleView = (kundli) => {
        navigate(`/kundli/${kundli.id}`, {
            state: { kundli },
        });
    };

    return (
        <div style={styles.page}>
            {/* NAVBAR */}
            <nav style={styles.navbar}>
                <a href="/" style={styles.logo}>🌙 Shwetha Cosmic</a>
                <div style={styles.navLinks}>
                    <a href="/kundli" style={styles.navLink}>New Kundli</a>
                    <a href="/my-kundlis" style={{ ...styles.navLink, color: "#d9ad63" }}>
                        My Kundlis
                    </a>
                    <a href="/dashboard" style={styles.navLink}>Dashboard</a>
                    <a href="/profile" style={styles.navLink}>Profile</a>
                </div>
            </nav>

            {/* HEADER */}
            <section style={styles.header}>
                <div style={styles.headerIcon}>🌌</div>
                <p style={styles.eyebrow}>SHWETHA COSMIC</p>
                <h1 style={styles.title}>
                    My <span style={styles.gold}>Kundlis</span>
                </h1>
                <p style={styles.subtitle}>
                    Your saved birth charts, all in one place.
                </p>
            </section>

            <main style={styles.main}>
                {error && <div style={styles.error}>⚠️ {error}</div>}
                {success && <div style={styles.success}>{success}</div>}

                {loading ? (
                    <div style={styles.centerBox}>
                        <div style={styles.loadingIcon}>🔮</div>
                        <p>Loading your Kundlis...</p>
                    </div>
                ) : kundlis.length === 0 ? (
                    <div style={styles.centerBox}>
                        <div style={styles.emptyIcon}>🌙</div>
                        <h2 style={styles.emptyTitle}>No Kundlis yet</h2>
                        <p style={styles.emptyText}>
                            Generate your first Kundli to see it here.
                        </p>
                        <button
                            onClick={() => navigate("/kundli")}
                            style={styles.primaryBtn}
                        >
                            ✨ Generate a Kundli
                        </button>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {kundlis.map((kundli) => {
                            const data = kundli.kundli_data || {};
                            return (
                                <div key={kundli.id} style={styles.card}>
                                    <div style={styles.cardTop}>
                                        <div style={styles.avatar}>🪐</div>
                                        <div>
                                            <h3 style={styles.cardName}>{kundli.name || "Unknown"}</h3>
                                            <p style={styles.cardMeta}>
                                                {kundli.kundli_data?.moonRashi
                                                    ? `Moon: ${kundli.kundli_data.moonRashi}`
                                                    : data.moonRashi || "Moon: —"}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={styles.details}>
                                        <Detail label="DOB" value={formatDate(kundli.date_of_birth)} />
                                        <Detail label="TOB" value={kundli.time_of_birth || "—"} />
                                        <Detail label="Place" value={kundli.place_of_birth || "—"} />
                                        <Detail label="Created" value={formatDate(kundli.created_at)} />
                                    </div>

                                    <div style={styles.actions}>
                                        <button
                                            onClick={() => handleView(kundli)}
                                            style={styles.viewBtn}
                                        >
                                            👁️ View
                                        </button>
                                        <button
                                            onClick={() => handleDelete(kundli.id)}
                                            disabled={deletingId === kundli.id}
                                            style={styles.deleteBtn}
                                        >
                                            {deletingId === kundli.id ? "Deleting..." : "🗑️ Delete"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer style={styles.footer}>
                <p style={styles.footerLogo}>🌙 Shwetha Cosmic</p>
                <p>Astrology • Guidance • Destiny</p>
                <p style={styles.copyright}>© 2026 Shwetha Cosmic. All rights reserved.</p>
            </footer>
        </div>
    );
}

/* =====================================================
   SUB-COMPONENTS
===================================================== */
function Detail({ label, value }) {
    return (
        <div style={styles.detail}>
            <p style={styles.detailLabel}>{label}</p>
            <p style={styles.detailValue}>{value}</p>
        </div>
    );
}

function formatDate(value) {
    if (!value) return "—";
    const str = String(value).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return value;
    const [y, m, d] = str.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return str;
    return date.toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
}

/* =====================================================
   STYLES
===================================================== */
const styles = {
    page: {
        minHeight: "100vh",
        background: "#080510",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        paddingBottom: "60px",
    },

    navbar: {
        height: "75px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 7%",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(5,3,10,0.9)",
        position: "sticky",
        top: 0,
        zIndex: 100,
    },

    logo: {
        textDecoration: "none",
        color: "#d9ad63",
        fontSize: "21px",
        fontFamily: 'Georgia, "Times New Roman", serif',
    },

    navLinks: { display: "flex", gap: "22px", flexWrap: "wrap", justifyContent: "flex-end" },

    navLink: { color: "#b8afc0", textDecoration: "none", fontSize: "14px" },

    header: { textAlign: "center", padding: "60px 20px 30px" },

    headerIcon: { fontSize: "55px", marginBottom: "12px" },

    eyebrow: { color: "#d9ad63", letterSpacing: "4px", fontSize: "12px", marginBottom: "10px" },

    title: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "42px", fontWeight: "500", margin: 0,
    },

    gold: { color: "#d9ad63" },

    subtitle: { color: "#91889c", marginTop: "12px" },

    main: { width: "90%", maxWidth: "1100px", margin: "0 auto" },

    error: {
        padding: "14px 16px", marginBottom: "20px", borderRadius: "10px",
        background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.25)",
        color: "#ff8585", fontSize: "13px",
    },

    success: {
        padding: "14px 16px", marginBottom: "20px", borderRadius: "10px",
        background: "rgba(101,230,165,0.1)", border: "1px solid rgba(101,230,165,0.25)",
        color: "#65e6a5", fontSize: "13px",
    },

    centerBox: {
        textAlign: "center", padding: "70px 20px",
        background: "#120b1d", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
    },

    loadingIcon: { fontSize: "50px", marginBottom: "12px" },

    emptyIcon: { fontSize: "55px", marginBottom: "12px" },

    emptyTitle: { color: "#d9ad63", fontWeight: "500", margin: "0 0 8px" },

    emptyText: { color: "#91889c", margin: "0 0 20px" },

    primaryBtn: {
        padding: "12px 22px", borderRadius: "9px", border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614", fontWeight: "700", fontSize: "14px", cursor: "pointer",
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
    },

    card: {
        background: "#120b1d",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "15px",
        padding: "22px",
    },

    cardTop: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" },

    avatar: {
        width: "50px", height: "50px", borderRadius: "50%",
        background: "rgba(217,173,99,0.12)", border: "1px solid rgba(217,173,99,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
    },

    cardName: { margin: 0, fontSize: "17px", fontWeight: "600" },

    cardMeta: { margin: "4px 0 0", color: "#91889c", fontSize: "12px" },

    details: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginBottom: "18px",
    },

    detail: {
        background: "rgba(255,255,255,0.03)",
        borderRadius: "8px",
        padding: "10px 12px",
    },

    detailLabel: { color: "#777080", fontSize: "10px", margin: "0 0 3px" },

    detailValue: { color: "#ddd", fontSize: "13px", margin: 0, wordBreak: "break-word" },

    actions: { display: "flex", gap: "10px" },

    viewBtn: {
        flex: 1, padding: "11px", borderRadius: "8px", border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614", fontWeight: "700", fontSize: "13px", cursor: "pointer",
    },

    deleteBtn: {
        padding: "11px 16px", borderRadius: "8px",
        border: "1px solid rgba(255,80,80,0.4)",
        background: "rgba(255,80,80,0.08)",
        color: "#ff8585", fontSize: "13px", cursor: "pointer",
    },

    footer: {
        textAlign: "center", marginTop: "50px", paddingTop: "30px",
        borderTop: "1px solid rgba(255,255,255,0.08)", color: "#777080",
    },

    footerLogo: {
        color: "#d9ad63", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "18px",
    },

    copyright: { fontSize: "12px" },
};

export default MyKundlis;
