import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VideoCallComponent from "../components/VideoCall";

const API_BASE = "http://localhost:5000/api";

/* =====================================================
   VIDEO CALL PAGE
   /consultation/:bookingId
   -----------------------------------------------------
   Auth-guarded wrapper around the VideoCall component.
   Loads the consultation context first to verify the
   booking is eligible + belongs to the user, then
   renders the real-time call.
===================================================== */
function VideoCallPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [context, setContext] = useState(null);
    const [started, setStarted] = useState(false);

    const token = localStorage.getItem("token");

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
    }, [token, navigate]);

    /* ================= LOAD CONTEXT ================= */
    const loadContext = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_BASE}/consultations/${bookingId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load consultation.");
            }

            setContext(data);
        } catch (err) {
            console.error("Consultation context error:", err);
            setError(err.message || "Unable to load this consultation.");
        } finally {
            setLoading(false);
        }
    }, [bookingId, token]);

    useEffect(() => {
        loadContext();
    }, [loadContext]);

    /* ================= RENDER ================= */

    if (loading) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.loadingIcon}>🔮</div>
                <h2 style={styles.gold}>Preparing your consultation...</h2>
                <p style={styles.muted}>Verifying booking eligibility</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.loadingIcon}>⚠️</div>
                <h2 style={styles.gold}>Consultation unavailable</h2>
                <p style={styles.muted}>{error}</p>
                <button onClick={() => navigate("/dashboard")} style={styles.primaryBtn}>
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    const booking = context?.booking || {};
    const consultation = context?.consultation;

    const canJoin = Boolean(
        consultation &&
        consultation.status !== "completed" &&
        ["upcoming", "accepted", "pending"].includes(booking.status)
    );

    return (
        <div style={styles.page}>
            {!started ? (
                <div style={styles.lobby}>
                    <div style={styles.lobbyIcon}>
                        {booking.call_type === "audio" ? "🎙️" : "🎥"}
                    </div>

                    <p style={styles.eyebrow}>SHWETHA COSMIC</p>
                    <h1 style={styles.title}>
                        {booking.call_type === "audio" ? "Audio" : "Video"} Consultation
                    </h1>

                    <div style={styles.detailsCard}>
                        <DetailRow label="Customer" value={booking.customer_name || "You"} />
                        <DetailRow label="Reader" value={booking.astrologer_name || "Shwetha"} />
                        <DetailRow label="Booking ID" value={`#${booking.id}`} />
                        <DetailRow label="Service" value={booking.consultation_type} />
                        <DetailRow label="Date" value={booking.booking_date} />
                        <DetailRow label="Time" value={booking.booking_time} />
                        <DetailRow label="Duration" value={`${booking.duration_minutes || 30} minutes`} />
                        <DetailRow label="Status" value={booking.status} />
                    </div>

                    {canJoin ? (
                        <button onClick={() => setStarted(true)} style={styles.joinBtn}>
                            🚀 Join Consultation
                        </button>
                    ) : (
                        <p style={styles.notReady}>
                            {consultation?.status === "completed"
                                ? "Consultation Completed"
                                : "This consultation is not ready to join yet. Please wait for Shwetha to start it."}
                        </p>
                    )}

                    <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
                        ← Back to Dashboard
                    </button>
                </div>
            ) : (
                <VideoCallComponent
                    bookingId={Number(bookingId)}
                    token={token}
                    onEnded={() => {
                        setStarted(false);
                        navigate("/dashboard");
                    }}
                />
            )}
        </div>
    );
}

/* =====================================================
   SUB-COMPONENTS
===================================================== */
function DetailRow({ label, value }) {
    return (
        <div style={styles.detailRow}>
            <span style={styles.detailLabel}>{label}</span>
            <span style={styles.detailValue}>{value || "—"}</span>
        </div>
    );
}

/* =====================================================
   STYLES
===================================================== */
const styles = {
    page: {
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #241442 0%, #0b0614 45%, #05030a 100%)",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
    },

    lobby: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
        maxWidth: "520px",
        margin: "0 auto",
    },

    lobbyIcon: { fontSize: "60px", marginBottom: "14px" },

    eyebrow: { color: "#d9ad63", letterSpacing: "4px", fontSize: "11px", marginBottom: "10px" },

    title: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "36px",
        fontWeight: "500",
        margin: "0 0 25px",
    },

    detailsCard: {
        width: "100%",
        background: "rgba(20,12,32,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "25px 28px",
        marginBottom: "25px",
        textAlign: "left",
    },

    detailRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        padding: "11px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },

    detailLabel: { color: "#91889c", fontSize: "12px" },

    detailValue: { color: "#eee", fontSize: "13px", textAlign: "right", wordBreak: "break-word" },

    joinBtn: {
        padding: "15px 40px",
        borderRadius: "12px",
        border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614",
        fontWeight: "700",
        fontSize: "16px",
        cursor: "pointer",
        boxShadow: "0 10px 35px rgba(217,173,99,0.25)",
    },

    notReady: {
        color: "#91889c",
        fontSize: "14px",
        lineHeight: "1.6",
        marginBottom: "20px",
        padding: "14px 18px",
        background: "rgba(217,173,99,0.06)",
        borderRadius: "12px",
        border: "1px solid rgba(217,173,99,0.15)",
    },

    backBtn: {
        marginTop: "18px",
        padding: "11px 24px",
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

    loadingIcon: { fontSize: "55px", marginBottom: "10px" },
    gold: { color: "#d9ad63", fontWeight: "500" },
    muted: { color: "#91889c", fontSize: "14px" },

    primaryBtn: {
        marginTop: "15px",
        padding: "12px 24px",
        borderRadius: "9px",
        border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614",
        fontWeight: "700",
        cursor: "pointer",
    },
};

export default VideoCallPage;
