import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

/* =====================================================
   KUNDLI RESULT
   Displays a generated/saved Kundli chart with:
   birth details, sun sign, moon sign, nakshatra,
   ascendant, planetary positions, houses + print.
===================================================== */
function KundliResult() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [kundli, setKundli] = useState(location.state?.kundli || null);
    const [loading, setLoading] = useState(!location.state?.kundli);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    /* ================= LOAD BY ID ================= */
    useEffect(() => {
        // If we navigated here with state, use it.
        if (location.state?.kundli) {
            setKundli(location.state.kundli);
            setLoading(false);
            return;
        }

        // Otherwise fetch from the API (ownership-checked server-side).
        if (!id) {
            setError("No Kundli specified.");
            setLoading(false);
            return;
        }

        if (!token) {
            navigate("/login");
            return;
        }

        (async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/kundli/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load Kundli");
                }

                setKundli(data.kundli);
            } catch (err) {
                console.error("Kundli load error:", err);
                setError(err.message || "Unable to load this Kundli.");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, token, location.state?.kundli, navigate]);

    /* ================= PRINT ================= */
    const handlePrint = () => {
        window.print();
    };

    /* ================= RENDER ================= */

    if (loading) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.loadingIcon}>🔮</div>
                <h2 style={styles.gold}>Casting your chart...</h2>
                <p style={styles.muted}>Reading the planetary positions</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.loadingIcon}>⚠️</div>
                <h2 style={styles.gold}>Unable to load Kundli</h2>
                <p style={styles.muted}>{error}</p>
                <button onClick={() => navigate("/my-kundlis")} style={styles.primaryBtn}>
                    ← Back to My Kundlis
                </button>
            </div>
        );
    }

    if (!kundli) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.loadingIcon}>🌙</div>
                <h2 style={styles.gold}>No Kundli found</h2>
                <button onClick={() => navigate("/kundli")} style={styles.primaryBtn}>
                    Generate a Kundli →
                </button>
            </div>
        );
    }

    const data = kundli.kundli_data || kundli;
    const planets = data.planets || [];
    const houses = data.houses || [];

    return (
        <div style={styles.page}>
            {/* NAVBAR */}
            <nav style={styles.navbar}>
                <a href="/" style={styles.logo}>🌙 Shwetha Cosmic</a>
                <div style={styles.navLinks}>
                    <a href="/kundli" style={styles.navLink}>New Kundli</a>
                    <a href="/my-kundlis" style={styles.navLink}>My Kundlis</a>
                    <a href="/dashboard" style={styles.navLink}>Dashboard</a>
                    <button onClick={handlePrint} style={styles.printBtn}>
                        🖨️ Print Kundli
                    </button>
                </div>
            </nav>

            {/* HEADER */}
            <section style={styles.header} className="no-print">
                <div style={styles.headerIcon}>🪐</div>
                <p style={styles.eyebrow}>SHWETHA COSMIC</p>
                <h1 style={styles.title}>
                    {kundli.name || "Your"} <span style={styles.gold}>Kundli</span>
                </h1>
                <p style={styles.subtitle}>
                    Generated with real astronomical calculations
                </p>
            </section>

            <main style={styles.main}>
                {/* ============ BIRTH DETAILS ============ */}
                <section style={styles.card}>
                    <h2 style={styles.cardTitle}>📜 Birth Details</h2>
                    <div style={styles.birthGrid}>
                        <BirthItem label="Name" value={kundli.name || "—"} />
                        <BirthItem label="Date of Birth" value={formatDate(kundli.date_of_birth)} />
                        <BirthItem label="Time of Birth" value={kundli.time_of_birth || "—"} />
                        <BirthItem label="Place of Birth" value={kundli.place_of_birth || "—"} />
                        <BirthItem label="Gender" value={kundli.gender || "—"} />
                        <BirthItem label="Ayanamsa" value={`${data.ayanamsa || "—"}° Lahiri`} />
                    </div>
                </section>

                {/* ============ KEY POSITIONS ============ */}
                <section style={styles.card}>
                    <h2 style={styles.cardTitle}>⭐ Key Positions</h2>
                    <div style={styles.keyGrid}>
                        <KeyItem icon="☀️" label="Sun Sign" value={data.sunSign || "—"} />
                        <KeyItem icon="🌙" label="Moon Sign / Rashi" value={data.moonRashi || "—"} />
                        <KeyItem icon="✨" label="Nakshatra" value={data.nakshatra || "—"} />
                        <KeyItem
                            icon="🎯"
                            label="Nakshatra Pada"
                            value={data.nakshatraPada ? `Pada ${data.nakshatraPada}` : "—"}
                        />
                        <KeyItem icon="🌅" label="Ascendant / Lagna" value={data.ascendant || "—"} />
                        <KeyItem icon="📐" label="Method" value={data.method || "astronomy-engine"} />
                    </div>
                </section>

                {/* ============ CHART + PLANETS ============ */}
                <section style={styles.chartSection}>
                    {/* Chart */}
                    <div style={styles.chartCard}>
                        <h2 style={styles.cardTitle}>🕉️ Birth Chart</h2>
                        {houses.length === 12 ? (
                            <Chart houses={houses} ascendant={data.ascendant} />
                        ) : (
                            <p style={styles.muted}>Chart data not available.</p>
                        )}
                    </div>

                    {/* Planets */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>🪐 Planetary Positions</h2>
                        <p style={styles.note}>
                            Sidereal longitudes (Lahiri ayanamsa) — computed with
                            astronomy-engine, not estimated.
                        </p>
                        <div style={styles.planetList}>
                            {planets.map((planet) => (
                                <div key={planet.name} style={styles.planetRow}>
                                    <div style={styles.planetName}>
                                        <span style={styles.planetIcon}>{planetIcon(planet.name)}</span>
                                        <strong>{planet.name}</strong>
                                    </div>
                                    <div style={styles.planetSign}>
                                        <span style={styles.signDegree}>
                                            {planet.degree}°
                                        </span>
                                        <span>{planet.sign}</span>
                                        <span style={styles.houseTag}>House {planet.house}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ HOUSES ============ */}
                <section style={styles.card}>
                    <h2 style={styles.cardTitle}>🏠 Houses</h2>
                    <div style={styles.housesGrid}>
                        {houses.map((house) => (
                            <div key={house.house} style={styles.houseBox}>
                                <span style={styles.houseNum}>{house.house}</span>
                                <span style={styles.houseSign}>{house.sign}</span>
                                <span style={styles.houseDegree}>{house.degree}°</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ============ DASHA NOTE ============ */}
                <section style={styles.card}>
                    <h2 style={styles.cardTitle}>⏳ Dasha</h2>
                    {data.dasha ? (
                        <pre style={styles.pre}>{JSON.stringify(data.dasha, null, 2)}</pre>
                    ) : (
                        <p style={styles.note}>
                            Vimshottari Dasha periods are not yet available. This platform
                            currently provides accurate planetary positions and houses.
                            A dasha calculation library can be connected later to add
                            mahadasha / antardasha timelines.
                        </p>
                    )}
                </section>

                {/* ============ FOOTER ACTIONS ============ */}
                <section style={styles.actions} className="no-print">
                    <button onClick={() => navigate("/my-kundlis")} style={styles.secondaryBtn}>
                        ← My Kundlis
                    </button>
                    <button onClick={() => navigate("/kundli")} style={styles.primaryBtn}>
                        ✨ Generate Another
                    </button>
                </section>
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
   CHART — North Indian style (diamond grid)
===================================================== */
function Chart({ houses, ascendant }) {
    // North Indian chart house positions (2 = house 1, etc.)
    const positions = {
        1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7,
        7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 1,
    };

    const cells = [];
    const houseById = Object.fromEntries(houses.map((h) => [h.house, h]));

    for (let i = 1; i <= 12; i++) {
        const houseNum = positions[i] || i;
        const house = houseById[houseNum] || null;
        cells.push(
            <div key={i} style={styles.chartCell}>
                {house && (
                    <>
                        <span style={styles.chartHouseNum}>{house.house}</span>
                        <span style={styles.chartSign}>{house.sign}</span>
                        {house.house === 1 && (
                            <span style={styles.chartLagna}>Asc</span>
                        )}
                    </>
                )}
            </div>
        );
    }

    return <div style={styles.chartGrid}>{cells}</div>;
}

/* =====================================================
   SUB-COMPONENTS
===================================================== */
function BirthItem({ label, value }) {
    return (
        <div style={styles.birthItem}>
            <p style={styles.birthLabel}>{label}</p>
            <p style={styles.birthValue}>{value}</p>
        </div>
    );
}

function KeyItem({ icon, label, value }) {
    return (
        <div style={styles.keyItem}>
            <div style={styles.keyIcon}>{icon}</div>
            <div>
                <p style={styles.keyLabel}>{label}</p>
                <p style={styles.keyValue}>{value}</p>
            </div>
        </div>
    );
}

/* =====================================================
   HELPERS
===================================================== */
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

function planetIcon(name) {
    const icons = {
        Sun: "☀️", Moon: "🌙", Mercury: "☿", Venus: "♀",
        Mars: "♂", Jupiter: "♃", Saturn: "♄",
    };
    return icons[name] || "🪐";
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

    navLinks: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },

    navLink: { color: "#b8afc0", textDecoration: "none", fontSize: "14px" },

    printBtn: {
        padding: "9px 15px",
        borderRadius: "8px",
        border: "1px solid rgba(217,173,99,0.4)",
        background: "rgba(217,173,99,0.1)",
        color: "#d9ad63",
        fontSize: "13px",
        cursor: "pointer",
    },

    header: { textAlign: "center", padding: "60px 20px 30px" },

    headerIcon: { fontSize: "55px", marginBottom: "12px" },

    eyebrow: {
        color: "#d9ad63",
        letterSpacing: "4px",
        fontSize: "12px",
        marginBottom: "10px",
    },

    title: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "42px",
        fontWeight: "500",
        margin: 0,
    },

    gold: { color: "#d9ad63" },

    subtitle: { color: "#91889c", marginTop: "12px" },

    main: {
        width: "90%",
        maxWidth: "1100px",
        margin: "0 auto",
    },

    card: {
        background: "#120b1d",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "28px",
        marginBottom: "22px",
    },

    cardTitle: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "22px",
        fontWeight: "500",
        margin: "0 0 18px",
        color: "#d9ad63",
    },

    note: {
        color: "#91889c",
        fontSize: "13px",
        lineHeight: "1.7",
        margin: "0 0 16px",
    },

    pre: {
        color: "#d9ad63",
        background: "#0b0613",
        padding: "14px",
        borderRadius: "10px",
        overflowX: "auto",
        fontSize: "12px",
    },

    birthGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "14px",
    },

    birthItem: {
        background: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
        padding: "14px",
    },

    birthLabel: { color: "#777080", fontSize: "11px", margin: "0 0 5px" },

    birthValue: { color: "#eee", fontSize: "14px", margin: 0, wordBreak: "break-word" },

    keyGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "14px",
    },

    keyItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
        padding: "14px",
    },

    keyIcon: { fontSize: "26px" },

    keyLabel: { color: "#777080", fontSize: "10px", margin: "0 0 3px" },

    keyValue: { color: "#d9ad63", fontSize: "14px", fontWeight: "600", margin: 0 },

    chartSection: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "22px",
        marginBottom: "22px",
    },

    chartCard: {
        background: "#120b1d",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "28px",
    },

    chartGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "6px",
        maxWidth: "360px",
        margin: "0 auto",
    },

    chartCell: {
        position: "relative",
        aspectRatio: "1",
        background: "#0b0613",
        border: "1px solid rgba(217,173,99,0.25)",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
        padding: "4px",
        textAlign: "center",
    },

    chartHouseNum: {
        position: "absolute",
        top: "4px",
        left: "6px",
        color: "#777080",
        fontSize: "9px",
    },

    chartSign: { color: "#d9ad63", fontSize: "13px", fontWeight: "600" },

    chartLagna: {
        color: "#65e6a5",
        fontSize: "9px",
        background: "rgba(101,230,165,0.1)",
        padding: "1px 5px",
        borderRadius: "8px",
    },

    planetList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },

    planetRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
        padding: "11px 14px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
    },

    planetName: { display: "flex", alignItems: "center", gap: "10px" },

    planetIcon: { fontSize: "20px" },

    planetSign: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#b8afc0",
        fontSize: "13px",
    },

    signDegree: { color: "#d9ad63", fontWeight: "600" },

    houseTag: {
        background: "rgba(217,173,99,0.1)",
        color: "#d9ad63",
        padding: "3px 8px",
        borderRadius: "12px",
        fontSize: "11px",
    },

    housesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
        gap: "10px",
    },

    houseBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        padding: "14px 8px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
    },

    houseNum: { color: "#777080", fontSize: "11px" },

    houseSign: { color: "#d9ad63", fontSize: "15px", fontWeight: "600" },

    houseDegree: { color: "#91889c", fontSize: "12px" },

    actions: {
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        margin: "10px 0 20px",
    },

    primaryBtn: {
        padding: "12px 22px",
        borderRadius: "9px",
        border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614",
        fontWeight: "700",
        fontSize: "14px",
        cursor: "pointer",
    },

    secondaryBtn: {
        padding: "12px 22px",
        borderRadius: "9px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "transparent",
        color: "#91889c",
        fontSize: "14px",
        cursor: "pointer",
    },

    centerPage: {
        minHeight: "100vh",
        background: "#080510",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "30px",
        gap: "10px",
    },

    loadingIcon: { fontSize: "60px", marginBottom: "10px" },

    muted: { color: "#91889c" },

    footer: {
        textAlign: "center",
        marginTop: "40px",
        paddingTop: "30px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        color: "#777080",
    },

    footerLogo: {
        color: "#d9ad63",
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "18px",
    },

    copyright: { fontSize: "12px" },
};

/* =====================================================
   PRINT STYLES (injected via <style>)
===================================================== */
const printStyles = `
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; }
    .page, .page * { background: #fff !important; color: #111 !important; }
    .page { padding: 20px; }
  }
`;

export default function KundliResultWithPrint() {
    return (
        <>
            <style>{printStyles}</style>
            <KundliResult />
        </>
    );
}
