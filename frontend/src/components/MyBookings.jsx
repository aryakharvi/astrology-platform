import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const STATUS_LABELS = {
    upcoming: "Upcoming",
    accepted: "Accepted",
    rejected: "Rejected",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending",
};

const PAYMENT_LABELS = {
    pending: "Pending",
    paid: "Paid",
    refunded: "Refunded",
};

const STATUS_COLORS = {
    upcoming: "#d9ad63",
    accepted: "#65e6a5",
    rejected: "#ff8585",
    pending: "#d9ad63",
    completed: "#65e6a5",
    cancelled: "#ff8585",
};

const PAYMENT_COLORS = {
    pending: "#d9ad63",
    paid: "#65e6a5",
    refunded: "#8fb0ff",
};

function MyBookings() {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Reschedule modal state
    const [rescheduleBooking, setRescheduleBooking] = useState(null);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Review modal state
    const [reviewBooking, setReviewBooking] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSaving, setReviewSaving] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const token = localStorage.getItem("token");

    const loadBookings = useCallback(async () => {
        if (!token) {
            setError("Please login to view your bookings.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_BASE}/bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load bookings");
            }

            setBookings(data.bookings || []);
        } catch (err) {
            console.error("Bookings load error:", err);
            setError(err.message || "Unable to load bookings.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    /* ================= CANCEL ================= */
    const handleCancel = async (bookingId) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");

            const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to cancel booking");
            }

            await loadBookings();
        } catch (err) {
            console.error("Cancel error:", err);
            setError(err.message || "Unable to cancel booking.");
        } finally {
            setActionLoading(false);
        }
    };

    /* ================= JOIN CONSULTATION ================= */
    const handleJoinConsultation = (booking) => {
        navigate(`/consultation/${booking.id}`);
    };

    /* ================= REVIEW ================= */
    const openReview = (booking) => {
        setReviewBooking(booking);
        setReviewRating(Number(booking.review_rating) || 0);
        setReviewComment(booking.review_comment || "");
        setError("");
    };

    const closeReview = () => {
        setReviewBooking(null);
        setReviewRating(0);
        setReviewComment("");
        setHoverRating(0);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (reviewRating < 1) {
            setError("Please select a star rating.");
            return;
        }

        try {
            setReviewSaving(true);
            setError("");

            const response = await fetch(
                `${API_BASE}/bookings/${reviewBooking.id}/review`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        rating: reviewRating,
                        comment: reviewComment.trim() || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit review");
            }

            closeReview();
            await loadBookings();
        } catch (err) {
            console.error("Review submit error:", err);
            setError(err.message || "Unable to submit review.");
        } finally {
            setReviewSaving(false);
        }
    };

    /* ================= RESCHEDULE ================= */
    const openReschedule = (booking) => {
        setRescheduleBooking(booking);
        setNewDate(booking.booking_date);
        setNewTime(booking.booking_time);
        setError("");
    };

    const handleReschedule = async (e) => {
        e.preventDefault();

        if (!newDate || !newTime) {
            setError("Please select a new date and time.");
            return;
        }

        try {
            setActionLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE}/bookings/${rescheduleBooking.id}/reschedule`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        booking_date: newDate,
                        booking_time: newTime,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to reschedule booking");
            }

            setRescheduleBooking(null);
            setNewDate("");
            setNewTime("");
            await loadBookings();
        } catch (err) {
            console.error("Reschedule error:", err);
            setError(err.message || "Unable to reschedule booking.");
        } finally {
            setActionLoading(false);
        }
    };

    /* ================= FILTER ================= */
    // "Upcoming" = upcoming + accepted (reader may have accepted),
    // "Cancelled" = cancelled + rejected (reader may have rejected).
    const isUpcomingStatus = (s) => s === "upcoming" || s === "accepted" || s === "pending";
    const isCancelledStatus = (s) => s === "cancelled" || s === "rejected";

    const filteredBookings =
        activeTab === "all"
            ? bookings
            : activeTab === "upcoming"
                ? bookings.filter((b) => isUpcomingStatus(b.status))
                : activeTab === "cancelled"
                    ? bookings.filter((b) => isCancelledStatus(b.status))
                    : bookings.filter((b) => b.status === activeTab);

    const counts = {
        all: bookings.length,
        upcoming: bookings.filter((b) => isUpcomingStatus(b.status)).length,
        completed: bookings.filter((b) => b.status === "completed").length,
        cancelled: bookings.filter((b) => isCancelledStatus(b.status)).length,
    };

    const tabs = [
        { key: "all", label: "All", icon: "📋" },
        { key: "upcoming", label: "Upcoming", icon: "📅" },
        { key: "completed", label: "Completed", icon: "✅" },
        { key: "cancelled", label: "Cancelled", icon: "❌" },
    ];

    return (
        <div>
            {/* ================= HEADER ================= */}
            <div style={styles.header}>
                <div>
                    <p style={styles.eyebrow}>MY BOOKINGS</p>
                    <h2 style={styles.title}>
                        📅 Your <span style={styles.gold}>Consultations</span>
                    </h2>
                    <p style={styles.subtitle}>
                        View, cancel or reschedule your astrology consultations.
                    </p>
                </div>
            </div>

            {/* ================= ERROR ================= */}
            {error && (
                <div style={styles.error}>
                    ⚠️ {error}
                </div>
            )}

            {/* ================= TABS ================= */}
            <div style={styles.tabs}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab.key ? styles.tabActive : {}),
                        }}
                    >
                        <span>{tab.icon}</span> {tab.label}
                        <span style={styles.tabCount}>{counts[tab.key]}</span>
                    </button>
                ))}
            </div>

            {/* ================= CONTENT ================= */}
            {loading ? (
                <div style={styles.centerBox}>
                    <div style={styles.loadingIcon}>🔮</div>
                    <p>Loading your bookings...</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div style={styles.centerBox}>
                    <div style={styles.emptyIcon}>🌙</div>
                    <h3 style={styles.emptyTitle}>No bookings here</h3>
                    <p style={styles.emptyText}>
                        {activeTab === "all"
                            ? "You haven't made any bookings yet."
                            : `You have no ${activeTab} bookings.`}
                    </p>
                    <a href="/booking" style={styles.bookButton}>
                        Book a Consultation →
                    </a>
                </div>
            ) : (
                <div style={styles.list}>
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} style={styles.card}>
                            {/* TOP ROW */}
                            <div style={styles.cardTop}>
                                <div style={styles.bookingId}>
                                    <span style={styles.idLabel}>Booking</span>
                                    <strong>#{booking.id}</strong>
                                </div>

                                <div style={styles.badges}>
                                    <span
                                        style={{
                                            ...styles.badge,
                                            background: `${STATUS_COLORS[booking.status]}1a`,
                                            color: STATUS_COLORS[booking.status],
                                            border: `1px solid ${STATUS_COLORS[booking.status]}40`,
                                        }}
                                    >
                                        {STATUS_LABELS[booking.status] || booking.status}
                                    </span>

                                    <span
                                        style={{
                                            ...styles.badge,
                                            background: `${PAYMENT_COLORS[booking.payment_status]}1a`,
                                            color: PAYMENT_COLORS[booking.payment_status],
                                            border: `1px solid ${PAYMENT_COLORS[booking.payment_status]}40`,
                                        }}
                                    >
                                        {PAYMENT_LABELS[booking.payment_status] || booking.payment_status}
                                    </span>
                                </div>
                            </div>

                            {/* DETAILS */}
                            <div style={styles.cardBody}>
                                <div style={styles.serviceRow}>
                                    <span style={styles.serviceIcon}>🔮</span>
                                    <div>
                                        <h4 style={styles.serviceName}>{booking.service}</h4>
                                        <p style={styles.astrologer}>
                                            {booking.astrologer_name
                                                ? `with ${booking.astrologer_name}`
                                                : "Shwetha Cosmic"}
                                        </p>
                                    </div>
                                </div>

                                <div style={styles.detailsGrid}>
                                    <DetailItem
                                        icon="📅"
                                        label="Date"
                                        value={formatDate(booking.booking_date)}
                                    />

                                    <DetailItem
                                        icon="⏰"
                                        label="Time"
                                        value={booking.booking_time}
                                    />

                                    <DetailItem
                                        icon="💰"
                                        label="Amount"
                                        value={`₹${Number(booking.amount || 0).toFixed(2)}`}
                                    />

                                    <DetailItem
                                        icon="📄"
                                        label="Booked On"
                                        value={formatDate(booking.created_at)}
                                    />
                                </div>
                            </div>

                            {/* ACTIONS */}
                            {isUpcomingStatus(booking.status) && (
                                <div style={styles.actions}>
                                    <button
                                        onClick={() => openReschedule(booking)}
                                        disabled={actionLoading}
                                        style={styles.rescheduleBtn}
                                    >
                                        🕐 Reschedule
                                    </button>

                                    <button
                                        onClick={() => handleCancel(booking.id)}
                                        disabled={actionLoading}
                                        style={styles.cancelBtn}
                                    >
                                        ✕ Cancel Booking
                                    </button>
                                </div>
                            )}

                            {booking.status === "completed" && (
                                <div style={styles.actions}>
                                    <button
                                        onClick={() => openReview(booking)}
                                        style={styles.reviewBtn}
                                    >
                                        {booking.reviewed ? "✏️ Edit Review" : "⭐ Leave a Review"}
                                    </button>
                                </div>
                            )}

                            {/* Consultation join button (only eligible bookings) */}
                            {booking.consultation_status &&
                                booking.consultation_status !== "completed" &&
                                isUpcomingStatus(booking.status) && (
                                    <div style={styles.actions}>
                                        <button
                                            onClick={() => handleJoinConsultation(booking)}
                                            style={styles.joinCallBtn}
                                        >
                                            {booking.call_type === "audio"
                                                ? "🎙️ Join Audio Consultation"
                                                : "🎥 Join Video Consultation"}
                                        </button>
                                    </div>
                                )}

                            {/* Pre-consultation status (waiting for Shwetha to start) */}
                            {!booking.consultation_status &&
                                isUpcomingStatus(booking.status) && (
                                    <p style={styles.preCallNote}>
                                        ⏰ Consultation starts at {booking.booking_time}
                                    </p>
                                )}

                            {booking.consultation_status === "completed" && (
                                <p style={styles.completedNote}>✅ Consultation Completed</p>
                            )}

                            {isCancelledStatus(booking.status) && booking.payment_status === "refunded" && (
                                <p style={styles.refundNote}>
                                    💸 Payment refunded for this cancelled booking.
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ================= RESCHEDULE MODAL ================= */}
            {rescheduleBooking && (
                <div style={styles.modalOverlay} onClick={() => setRescheduleBooking(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>🕐 Reschedule Booking</h3>
                            <button
                                onClick={() => setRescheduleBooking(null)}
                                style={styles.modalClose}
                            >
                                ✕
                            </button>
                        </div>

                        <p style={styles.modalBookingInfo}>
                            Booking #{rescheduleBooking.id} • {rescheduleBooking.service}
                        </p>

                        <form onSubmit={handleReschedule}>
                            <label style={styles.modalLabel}>NEW DATE</label>
                            <input
                                type="date"
                                value={newDate}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setNewDate(e.target.value)}
                                required
                                style={styles.modalInput}
                            />

                            <label style={styles.modalLabel}>NEW TIME</label>
                            <input
                                type="time"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                required
                                style={styles.modalInput}
                            />

                            {error && (
                                <p style={styles.modalError}>⚠️ {error}</p>
                            )}

                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setRescheduleBooking(null)}
                                    style={styles.modalCancelBtn}
                                >
                                    Keep Original
                                </button>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={styles.modalConfirmBtn}
                                >
                                    {actionLoading ? "Saving..." : "Confirm New Time ✦"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= REVIEW MODAL ================= */}
            {reviewBooking && (
                <div style={styles.modalOverlay} onClick={closeReview}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>⭐ Review Consultation</h3>
                            <button onClick={closeReview} style={styles.modalClose}>✕</button>
                        </div>

                        <p style={styles.modalBookingInfo}>
                            Booking #{reviewBooking.id} • {reviewBooking.service}
                        </p>

                        <form onSubmit={handleReviewSubmit}>
                            {/* Star rating */}
                            <label style={styles.modalLabel}>YOUR RATING</label>
                            <div style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setReviewRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        style={{
                                            ...styles.starBtn,
                                            color:
                                                (hoverRating || reviewRating) >= star
                                                    ? "#d9ad63"
                                                    : "#4a3f5c",
                                        }}
                                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span style={styles.starLabel}>
                                    {reviewRating ? `${reviewRating}/5` : "Tap to rate"}
                                </span>
                            </div>

                            {/* Comment */}
                            <label style={styles.modalLabel}>YOUR REVIEW (OPTIONAL)</label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                rows="4"
                                placeholder="Share your experience with this consultation..."
                                style={styles.modalTextarea}
                            />

                            {error && (
                                <p style={styles.modalError}>⚠️ {error}</p>
                            )}

                            <div style={styles.modalActions}>
                                <button type="button" onClick={closeReview} style={styles.modalCancelBtn}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reviewSaving}
                                    style={{
                                        ...styles.modalConfirmBtn,
                                        opacity: reviewSaving ? 0.7 : 1,
                                    }}
                                >
                                    {reviewSaving ? "Submitting..." : "Submit Review ✦"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ==========================================
   DETAIL ITEM
========================================== */
function DetailItem({ icon, label, value }) {
    return (
        <div style={styles.detailItem}>
            <span style={styles.detailIcon}>{icon}</span>
            <div>
                <p style={styles.detailLabel}>{label}</p>
                <p style={styles.detailValue}>{value}</p>
            </div>
        </div>
    );
}

/* ==========================================
   HELPERS
========================================== */
function formatDate(value) {
    if (!value) return "—";

    // API now returns dates as plain "YYYY-MM-DD" strings
    // (dateStrings: true in the DB driver). Parse manually to
    // avoid timezone shifting on the frontend.
    const str = String(value);

    // "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
    const datePart = str.slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return str;
    }

    const [year, month, day] = datePart.split("-").map(Number);

    // Month is 0-indexed in JS Date
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) return str;

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/* ==========================================
   STYLES
========================================== */
const styles = {
    header: {
        marginBottom: "25px",
    },

    eyebrow: {
        color: "#d9ad63",
        fontSize: "11px",
        letterSpacing: "3px",
        marginBottom: "8px",
    },

    title: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "30px",
        fontWeight: "500",
        margin: "0 0 8px",
    },

    gold: {
        color: "#d9ad63",
    },

    subtitle: {
        color: "#91889c",
        fontSize: "14px",
        margin: 0,
    },

    error: {
        padding: "14px 16px",
        marginBottom: "20px",
        borderRadius: "10px",
        background: "rgba(255,80,80,0.1)",
        border: "1px solid rgba(255,80,80,0.25)",
        color: "#ff8585",
        fontSize: "13px",
    },

    tabs: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "25px",
    },

    tab: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 16px",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(20,12,32,0.6)",
        color: "#91889c",
        fontSize: "13px",
        cursor: "pointer",
        transition: "0.2s",
    },

    tabActive: {
        background: "rgba(217,173,99,0.12)",
        borderColor: "rgba(217,173,99,0.4)",
        color: "#d9ad63",
    },

    tabCount: {
        background: "rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "2px 8px",
        fontSize: "11px",
    },

    centerBox: {
        textAlign: "center",
        padding: "60px 20px",
        background: "rgba(20,12,32,0.6)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
    },

    loadingIcon: {
        fontSize: "45px",
        marginBottom: "15px",
    },

    emptyIcon: {
        fontSize: "50px",
        marginBottom: "15px",
    },

    emptyTitle: {
        color: "#d9ad63",
        fontWeight: "500",
        margin: "0 0 8px",
    },

    emptyText: {
        color: "#91889c",
        fontSize: "14px",
        margin: "0 0 20px",
    },

    bookButton: {
        display: "inline-block",
        padding: "12px 22px",
        borderRadius: "25px",
        background: "#d9ad63",
        color: "#0b0614",
        fontWeight: "700",
        fontSize: "13px",
        textDecoration: "none",
    },

    list: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },

    card: {
        background: "rgba(20,12,32,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "15px",
        padding: "22px",
    },

    cardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "18px",
        paddingBottom: "15px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
    },

    bookingId: {
        display: "flex",
        flexDirection: "column",
    },

    idLabel: {
        color: "#777080",
        fontSize: "10px",
        letterSpacing: "1px",
    },

    badges: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },

    badge: {
        padding: "5px 11px",
        borderRadius: "15px",
        fontSize: "11px",
        fontWeight: "600",
    },

    cardBody: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },

    serviceRow: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
    },

    serviceIcon: {
        width: "46px",
        height: "46px",
        borderRadius: "12px",
        background: "rgba(217,173,99,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        flexShrink: 0,
    },

    serviceName: {
        margin: "0 0 4px",
        fontSize: "17px",
        fontWeight: "600",
    },

    astrologer: {
        margin: 0,
        color: "#91889c",
        fontSize: "13px",
    },

    detailsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "12px",
    },

    detailItem: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px",
        borderRadius: "10px",
        background: "rgba(5,3,10,0.4)",
    },

    detailIcon: {
        fontSize: "18px",
    },

    detailLabel: {
        margin: 0,
        color: "#777080",
        fontSize: "10px",
        letterSpacing: "0.5px",
    },

    detailValue: {
        margin: "3px 0 0",
        color: "#ddd",
        fontSize: "13px",
        fontWeight: "600",
    },

    actions: {
        display: "flex",
        gap: "10px",
        marginTop: "18px",
        paddingTop: "16px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
    },

    rescheduleBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px solid rgba(217,173,99,0.4)",
        background: "rgba(217,173,99,0.08)",
        color: "#d9ad63",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
    },

    cancelBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px solid rgba(255,80,80,0.4)",
        background: "rgba(255,80,80,0.08)",
        color: "#ff8585",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
    },

    reviewBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px solid rgba(217,173,99,0.4)",
        background: "rgba(217,173,99,0.08)",
        color: "#d9ad63",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
    },

    joinCallBtn: {
        padding: "11px 18px",
        borderRadius: "9px",
        border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: "0 6px 20px rgba(217,173,99,0.2)",
    },

    preCallNote: {
        margin: "14px 0 0",
        color: "#d9ad63",
        fontSize: "12px",
        background: "rgba(217,173,99,0.06)",
        padding: "9px 12px",
        borderRadius: "8px",
        border: "1px solid rgba(217,173,99,0.15)",
    },

    completedNote: {
        margin: "14px 0 0",
        color: "#65e6a5",
        fontSize: "12px",
        background: "rgba(101,230,165,0.06)",
        padding: "9px 12px",
        borderRadius: "8px",
        border: "1px solid rgba(101,230,165,0.15)",
    },

    starsRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "6px",
    },

    starBtn: {
        background: "none",
        border: "none",
        fontSize: "30px",
        lineHeight: 1,
        padding: "2px",
        cursor: "pointer",
        transition: "transform 0.1s ease",
    },

    starLabel: {
        color: "#91889c",
        fontSize: "13px",
        marginLeft: "8px",
    },

    modalTextarea: {
        width: "100%",
        boxSizing: "border-box",
        padding: "13px",
        borderRadius: "9px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "#0b0613",
        color: "#fff",
        outline: "none",
        fontSize: "14px",
        resize: "vertical",
        fontFamily: "inherit",
    },

    refundNote: {
        margin: "16px 0 0",
        color: "#8fb0ff",
        fontSize: "12px",
    },

    /* ============ MODAL ============ */

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
    },

    modal: {
        width: "100%",
        maxWidth: "460px",
        background: "#140c20",
        border: "1px solid rgba(217,173,99,0.25)",
        borderRadius: "18px",
        padding: "28px",
        boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
    },

    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
    },

    modalTitle: {
        margin: 0,
        fontSize: "20px",
        fontWeight: "600",
    },

    modalClose: {
        background: "none",
        border: "none",
        color: "#91889c",
        fontSize: "18px",
        cursor: "pointer",
    },

    modalBookingInfo: {
        color: "#91889c",
        fontSize: "13px",
        marginBottom: "20px",
    },

    modalLabel: {
        display: "block",
        color: "#d9ad63",
        fontSize: "11px",
        letterSpacing: "1px",
        margin: "16px 0 8px",
    },

    modalInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "13px",
        borderRadius: "9px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "#0b0613",
        color: "#fff",
        outline: "none",
        fontSize: "14px",
    },

    modalError: {
        color: "#ff8585",
        fontSize: "12px",
        marginTop: "14px",
    },

    modalActions: {
        display: "flex",
        gap: "10px",
        marginTop: "24px",
    },

    modalCancelBtn: {
        flex: 1,
        padding: "13px",
        borderRadius: "9px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "transparent",
        color: "#91889c",
        fontSize: "13px",
        cursor: "pointer",
    },

    modalConfirmBtn: {
        flex: 1,
        padding: "13px",
        borderRadius: "9px",
        border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614",
        fontWeight: "700",
        fontSize: "13px",
        cursor: "pointer",
    },
};

export default MyBookings;
