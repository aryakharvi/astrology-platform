import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const DAY_NAMES = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
];

const STATUS_COLORS = {
    upcoming: "#d9ad63",
    accepted: "#65e6a5",
    pending: "#d9ad63",
    completed: "#65e6a5",
    cancelled: "#ff8585",
    rejected: "#ff8585",
};

const PAYMENT_COLORS = {
    pending: "#d9ad63",
    paid: "#65e6a5",
    refunded: "#8fb0ff",
};

const NAV_ITEMS = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "bookings", label: "Bookings", icon: "📅" },
    { key: "customers", label: "Customers", icon: "👥" },
    { key: "availability", label: "Availability", icon: "🕐" },
    { key: "earnings", label: "Earnings", icon: "💰" },
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "reviews", label: "Reviews", icon: "⭐" },
];

/* =====================================================
   READER DASHBOARD (Shwetha only — backend-verified)
===================================================== */
function ReaderDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Data
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [profileForm, setProfileForm] = useState({});
    const [profileSaved, setProfileSaved] = useState("");

    const [availabilityForm, setAvailabilityForm] = useState([]);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            if (user?.role !== "admin") {
                navigate("/dashboard");
                return;
            }
        } catch (e) {
            navigate("/login");
        }
    }, [token, navigate]);

    /* ================= LOAD DATA ================= */
    const loadAll = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError("");

            const [statsR, bookingsR, customersR, availabilityR, earningsR, profileR, reviewsR] =
                await Promise.all([
                    fetch(`${API_BASE}/reader/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/reader/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/reader/customers`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/reader/availability`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/reader/earnings`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/reader/profile`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/reader/reviews`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);

            // If any returns 403, user is not authorized
            const forbidden = [statsR, bookingsR, customersR, availabilityR, earningsR, profileR, reviewsR]
                .find((r) => r.status === 403);
            if (forbidden) {
                navigate("/dashboard");
                return;
            }

            const statsD = await statsR.json();
            const bookingsD = await bookingsR.json();
            const customersD = await customersR.json();
            const availabilityD = await availabilityR.json();
            const earningsD = await earningsR.json();
            const profileD = await profileR.json();
            const reviewsD = await reviewsR.json();

            setStats(statsD.stats || null);
            setBookings(bookingsD.bookings || []);
            setCustomers(customersD.customers || []);
            setAvailability(availabilityD.availability || []);
            setEarnings(earningsD.earnings || null);
            setProfile(profileD.profile || null);
            setReviews(reviewsD.reviews || []);

            // Build notifications from real data (no fake records)
            const notifs = [];
            const now = new Date();
            const today = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0"),
            ].join("-");

            const activeStatuses = ["upcoming", "accepted", "pending"];
            (bookingsD.bookings || []).forEach((b) => {
                if (activeStatuses.includes(b.status) && b.booking_date === today) {
                    notifs.push({
                        id: `today-${b.id}`,
                        text: `📅 Today's consultation with ${b.customer_name} (#${b.id}) at ${b.booking_time}`,
                        type: "info",
                    });
                } else if (activeStatuses.includes(b.status)) {
                    notifs.push({
                        id: `up-${b.id}`,
                        text: `🗓️ Upcoming: ${b.service} with ${b.customer_name} on ${b.booking_date}`,
                        type: "info",
                    });
                }
            });
            setNotifications(notifs.slice(0, 8));

            // Prefill profile form
            if (profileD.profile) {
                setProfileForm({
                    display_name: profileD.profile.display_name || "",
                    bio: profileD.profile.bio || "",
                    specialties: profileD.profile.specialties || "",
                    consultation_price: profileD.profile.consultation_price || "",
                    experience_years: profileD.profile.experience_years || "",
                    languages: profileD.profile.languages || "",
                    contact_email: profileD.profile.contact_email || "",
                    contact_phone: profileD.profile.contact_phone || "",
                    profile_image: profileD.profile.profile_image || "",
                });
            }

            // Prefill availability (all 7 days)
            const slots = Array.from({ length: 7 }, (_, i) => {
                const existing = (availabilityD.availability || []).find((a) => a.day_of_week === i);
                return existing
                    ? { ...existing }
                    : { day_of_week: i, start_time: "10:00", end_time: "18:00", duration_minutes: 30, break_minutes: 5, enabled: 0 };
            });
            setAvailabilityForm(slots);
        } catch (err) {
            console.error("Reader load error:", err);
            setError(err.message || "Failed to load reader dashboard.");
        } finally {
            setLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    /* ================= CONSULTATION ACTIONS ================= */
    const startConsultation = async (bookingId) => {
        try {
            setError("");
            const response = await fetch(`${API_BASE}/consultations/${bookingId}/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to start consultation");
            }

            setProfileSaved("✅ Consultation started! The customer can now join.");
            setTimeout(() => setProfileSaved(""), 5000);
            await loadAll();
        } catch (err) {
            console.error("Start consultation error:", err);
            setError(err.message || "Failed to start consultation.");
        }
    };

    const joinConsultation = (bookingId) => {
        navigate(`/consultation/${bookingId}`);
    };

    const endConsultation = async (bookingId) => {
        if (!window.confirm(`End consultation for booking #${bookingId}?`)) return;

        try {
            setError("");
            const response = await fetch(`${API_BASE}/consultations/${bookingId}/end`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to end consultation");
            }

            setProfileSaved("✅ Consultation completed.");
            setTimeout(() => setProfileSaved(""), 5000);
            await loadAll();
        } catch (err) {
            console.error("End consultation error:", err);
            setError(err.message || "Failed to end consultation.");
        }
    };

    /* ================= BOOKING ACTIONS ================= */
    const updateBookingStatus = async (bookingId, status) => {
        const labels = {
            accepted: "accept", rejected: "reject", completed: "complete", cancelled: "cancel",
        };

        if (!window.confirm(`Are you sure you want to ${labels[status] || status} booking #${bookingId}?`)) {
            return;
        }

        try {
            setError("");
            const response = await fetch(`${API_BASE}/reader/bookings/${bookingId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to update booking");
            }

            await loadAll();
        } catch (err) {
            console.error("Booking action error:", err);
            setError(err.message || "Failed to update booking.");
        }
    };

    /* ================= PROFILE SAVE ================= */
    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileSaved("");

        try {
            const response = await fetch(`${API_BASE}/reader/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(profileForm),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to save profile");
            }

            setProfileSaved("✅ Profile saved successfully!");
            setTimeout(() => setProfileSaved(""), 4000);
            await loadAll();
        } catch (err) {
            console.error("Profile save error:", err);
            setError(err.message || "Failed to save profile.");
        }
    };

    /* ================= AVAILABILITY SAVE ================= */
    const handleAvailabilitySave = async () => {
        try {
            setError("");
            const response = await fetch(`${API_BASE}/reader/availability`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ availability: availabilityForm }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to save availability");
            }

            setProfileSaved("✅ Availability saved!");
            setTimeout(() => setProfileSaved(""), 4000);
        } catch (err) {
            console.error("Availability save error:", err);
            setError(err.message || "Failed to save availability.");
        }
    };

    const handleAvailChange = (index, field, value) => {
        setAvailabilityForm((prev) =>
            prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
        );
    };

    /* ================= RENDER ================= */

    if (loading) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.loadingIcon}>🔮</div>
                <h2 style={styles.gold}>Loading Reader Dashboard...</h2>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* NAVBAR */}
            <nav style={styles.navbar}>
                <a href="/" style={styles.logo}>🌙 Shwetha Cosmic</a>
                <div style={styles.navRight}>
                    <span style={styles.readerBadge}>👑 READER</span>
                    <a href="/admin" style={styles.navLink}>Admin</a>
                    <a href="/dashboard" style={styles.navLink}>Website</a>
                </div>
            </nav>

            {/* HEADER */}
            <header style={styles.header}>
                <div style={styles.headerIcon}>✨</div>
                <p style={styles.eyebrow}>SHWETHA COSMIC</p>
                <h1 style={styles.title}>
                    Reader <span style={styles.gold}>Dashboard</span>
                </h1>
                <p style={styles.subtitle}>
                    {profile?.display_name || "Shwetha"} — manage consultations,
                    customers and your astrology practice.
                </p>
            </header>

            {/* ERROR / SUCCESS */}
            {error && <div style={styles.errorWrap}>⚠️ {error}</div>}
            {profileSaved && <div style={styles.successWrap}>{profileSaved}</div>}

            <main style={styles.main}>
                {/* SIDEBAR */}
                <aside style={styles.sidebar}>
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            style={{
                                ...styles.navItem,
                                ...(activeTab === item.key ? styles.navItemActive : {}),
                            }}
                        >
                            <span>{item.icon}</span> {item.label}
                        </button>
                    ))}
                </aside>

                {/* CONTENT */}
                <section style={styles.content}>
                    {activeTab === "overview" && (
                        <Overview stats={stats} notifications={notifications} />
                    )}

                    {activeTab === "bookings" && (
                        <BookingsTab
                            bookings={bookings}
                            onAction={updateBookingStatus}
                            onStartConsultation={startConsultation}
                            onJoinConsultation={joinConsultation}
                            onEndConsultation={endConsultation}
                        />
                    )}

                    {activeTab === "customers" && (
                        <CustomersTab customers={customers} />
                    )}

                    {activeTab === "availability" && (
                        <AvailabilityTab
                            form={availabilityForm}
                            onChange={handleAvailChange}
                            onSave={handleAvailabilitySave}
                        />
                    )}

                    {activeTab === "earnings" && (
                        <EarningsTab earnings={earnings} />
                    )}

                    {activeTab === "profile" && (
                        <ProfileTab
                            form={profileForm}
                            setForm={setProfileForm}
                            onSave={handleProfileSave}
                        />
                    )}

                    {activeTab === "reviews" && (
                        <ReviewsTab reviews={reviews} />
                    )}
                </section>
            </main>
        </div>
    );
}

/* =====================================================
   OVERVIEW
===================================================== */
function Overview({ stats, notifications }) {
    const cards = [
        { label: "Today's Bookings", value: stats?.today_bookings ?? 0, icon: "📅" },
        { label: "Upcoming", value: stats?.upcoming_bookings ?? 0, icon: "🗓️" },
        { label: "Completed", value: stats?.completed ?? 0, icon: "✅" },
        { label: "Pending", value: stats?.pending ?? 0, icon: "⏳" },
        { label: "Total Customers", value: stats?.total_customers ?? 0, icon: "👥" },
        { label: "Total Earnings", value: `₹${(stats?.total_earnings ?? 0).toFixed(2)}`, icon: "💰" },
    ];

    return (
        <div>
            <h2 style={styles.sectionTitle}>📊 Overview</h2>

            <div style={styles.statsGrid}>
                {cards.map((card) => (
                    <div key={card.label} style={styles.statCard}>
                        <div style={styles.statIcon}>{card.icon}</div>
                        <div>
                            <p style={styles.statLabel}>{card.label}</p>
                            <p style={styles.statValue}>{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Notifications */}
            <div style={styles.card}>
                <h3 style={styles.cardTitle}>🔔 Notifications</h3>
                {notifications.length === 0 ? (
                    <p style={styles.muted}>No new notifications right now.</p>
                ) : (
                    <div style={styles.notifList}>
                        {notifications.map((n) => (
                            <div key={n.id} style={styles.notifItem}>
                                {n.text}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* =====================================================
   BOOKINGS
===================================================== */
function BookingsTab({ bookings, onAction, onStartConsultation, onJoinConsultation, onEndConsultation }) {
    const [filter, setFilter] = useState("all");

    const filtered =
        filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

    return (
        <div>
            <h2 style={styles.sectionTitle}>📅 Booking Management</h2>

            {/* Filter chips */}
            <div style={styles.chips}>
                {["all", "upcoming", "accepted", "completed", "cancelled", "rejected"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            ...styles.chip,
                            ...(filter === f ? styles.chipActive : {}),
                        }}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div style={styles.emptyBox}>No bookings found.</div>
            ) : (
                <div style={styles.bookingList}>
                    {filtered.map((b) => (
                        <div key={b.id} style={styles.bookingCard}>
                            <div style={styles.bookingTop}>
                                <div>
                                    <strong style={styles.bookingId}>#{b.id}</strong>
                                    <span style={styles.bookingService}>{b.service}</span>
                                </div>
                                <div style={styles.badges}>
                                    <span style={badge(b.status, STATUS_COLORS)}>{b.status}</span>
                                    <span style={badge(b.payment_status, PAYMENT_COLORS)}>{b.payment_status}</span>
                                </div>
                            </div>

                            <div style={styles.bookingGrid}>
                                <Info label="Customer" value={b.customer_name} />
                                <Info label="Email" value={b.customer_email} />
                                <Info label="Phone" value={b.customer_phone || "—"} />
                                <Info label="Date" value={b.booking_date} />
                                <Info label="Time" value={b.booking_time} />
                                <Info label="Duration" value={`${b.duration_minutes || 30} min`} />
                                <Info label="Type" value={b.call_type === "audio" ? "🎙️ Audio" : "🎥 Video"} />
                                <Info label="Amount" value={`₹${b.amount.toFixed(2)}`} />
                                {b.consultation_status && (
                                    <Info label="Consultation" value={b.consultation_status} />
                                )}
                            </div>

                            {(b.status === "upcoming" || b.status === "pending") && (
                                <div style={styles.bookingActions}>
                                    <button onClick={() => onAction(b.id, "accepted")} style={styles.acceptBtn}>
                                        ✓ Accept
                                    </button>
                                    <button onClick={() => onAction(b.id, "rejected")} style={styles.rejectBtn}>
                                        ✕ Reject
                                    </button>
                                </div>
                            )}

                            {b.status === "accepted" && (
                                <div style={styles.bookingActions}>
                                    <button onClick={() => onAction(b.id, "completed")} style={styles.completeBtn}>
                                        ✅ Mark Completed
                                    </button>
                                    <button onClick={() => onAction(b.id, "cancelled")} style={styles.rejectBtn}>
                                        ✕ Cancel
                                    </button>
                                </div>
                            )}

                            {/* Consultation controls */}
                            {["upcoming", "accepted", "pending"].includes(b.status) && (
                                <div style={styles.consultActions}>
                                    {b.consultation_status !== "completed" ? (
                                        <>
                                            {b.consultation_id ? (
                                                <>
                                                    <button
                                                        onClick={() => onJoinConsultation(b.id)}
                                                        style={styles.joinConsultBtn}
                                                    >
                                                        {b.call_type === "audio" ? "🎙️ Join" : "🎥 Join"}
                                                    </button>
                                                    <button
                                                        onClick={() => onEndConsultation(b.id)}
                                                        style={styles.endConsultBtn}
                                                    >
                                                        ✕ End Consultation
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => onStartConsultation(b.id)}
                                                    style={styles.startConsultBtn}
                                                >
                                                    🚀 Start Consultation
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <span style={styles.consultDone}>✅ Consultation Completed</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* =====================================================
   CUSTOMERS
===================================================== */
function CustomersTab({ customers }) {
    const [selected, setSelected] = useState(null);

    return (
        <div>
            <h2 style={styles.sectionTitle}>👥 Customers</h2>

            {customers.length === 0 ? (
                <div style={styles.emptyBox}>No customers yet.</div>
            ) : (
                <div style={styles.customerList}>
                    {customers.map((c) => (
                        <div key={c.id} style={styles.customerCard}>
                            <div style={styles.customerAvatar}>
                                {c.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div style={styles.customerInfo}>
                                <strong>{c.name}</strong>
                                <p style={styles.muted}>{c.email}</p>
                                <p style={styles.mutedSmall}>
                                    {c.booking_count} booking{c.booking_count !== 1 ? "s" : ""} · Last:{" "}
                                    {c.last_appointment || "—"}
                                </p>
                            </div>
                            <button onClick={() => setSelected(selected?.id === c.id ? null : c)} style={styles.viewBtn}>
                                {selected?.id === c.id ? "Close" : "View"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Customer detail */}
            {selected && <CustomerDetail customerId={selected.id} />}
        </div>
    );
}

function CustomerDetail({ customerId }) {
    const [detail, setDetail] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        (async () => {
            try {
                const response = await fetch(`${API_BASE}/reader/customers/${customerId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (response.ok) setDetail(data.customer);
            } catch (e) {
                // ignore
            }
        })();
    }, [customerId, token]);

    if (!detail) {
        return <div style={styles.emptyBox}>Loading customer...</div>;
    }

    return (
        <div style={styles.card}>
            <h3 style={styles.cardTitle}>👤 Customer Detail</h3>
            <div style={styles.bookingGrid}>
                <Info label="Name" value={detail.name} />
                <Info label="Email" value={detail.email} />
                <Info label="Phone" value={detail.phone || "—"} />
            </div>

            <h3 style={{ ...styles.cardTitle, marginTop: "18px" }}>🪐 Kundli</h3>
            {detail.kundli ? (
                <div style={styles.bookingGrid}>
                    <Info label="DOB" value={detail.kundli.date_of_birth || "—"} />
                    <Info label="TOB" value={detail.kundli.time_of_birth || "—"} />
                    <Info label="Place" value={detail.kundli.place_of_birth || "—"} />
                    <Info label="Gender" value={detail.kundli.gender || "—"} />
                    {detail.kundli.kundli_data && (
                        <>
                            <Info label="Sun Sign" value={detail.kundli.kundli_data.sunSign || "—"} />
                            <Info label="Moon Sign" value={detail.kundli.kundli_data.moonRashi || "—"} />
                            <Info label="Nakshatra" value={detail.kundli.kundli_data.nakshatra || "—"} />
                            <Info label="Ascendant" value={detail.kundli.kundli_data.ascendant || "—"} />
                        </>
                    )}
                </div>
            ) : (
                <p style={styles.muted}>This customer hasn't saved a Kundli yet.</p>
            )}
        </div>
    );
}

/* =====================================================
   AVAILABILITY
===================================================== */
function AvailabilityTab({ form, onChange, onSave }) {
    return (
        <div>
            <h2 style={styles.sectionTitle}>🕐 Availability</h2>
            <p style={styles.muted}>
                Configure your consultation availability. Days with "Off" are not bookable.
            </p>

            {form.map((slot, i) => (
                <div key={slot.day_of_week} style={styles.availRow}>
                    <label style={styles.availDay}>
                        <input
                            type="checkbox"
                            checked={Boolean(slot.enabled)}
                            onChange={(e) => onChange(i, "enabled", e.target.checked ? 1 : 0)}
                        />
                        <strong>{DAY_NAMES[slot.day_of_week]}</strong>
                    </label>

                    <input
                        type="time"
                        value={slot.start_time || ""}
                        onChange={(e) => onChange(i, "start_time", e.target.value)}
                        disabled={!slot.enabled}
                        style={styles.availInput}
                    />
                    <span style={styles.availDash}>–</span>
                    <input
                        type="time"
                        value={slot.end_time || ""}
                        onChange={(e) => onChange(i, "end_time", e.target.value)}
                        disabled={!slot.enabled}
                        style={styles.availInput}
                    />

                    <input
                        type="number"
                        value={slot.duration_minutes || 30}
                        onChange={(e) => onChange(i, "duration_minutes", Number(e.target.value))}
                        disabled={!slot.enabled}
                        style={{ ...styles.availInput, width: "70px" }}
                        title="Duration (min)"
                    />

                    <input
                        type="number"
                        value={slot.break_minutes || 5}
                        onChange={(e) => onChange(i, "break_minutes", Number(e.target.value))}
                        disabled={!slot.enabled}
                        style={{ ...styles.availInput, width: "70px" }}
                        title="Break (min)"
                    />
                </div>
            ))}

            <button onClick={onSave} style={styles.saveBtn}>
                💾 Save Availability
            </button>
        </div>
    );
}

/* =====================================================
   EARNINGS
===================================================== */
function EarningsTab({ earnings }) {
    if (!earnings) {
        return <div style={styles.emptyBox}>No earnings data.</div>;
    }

    const cards = [
        { label: "Total Earnings", value: `₹${earnings.completed_earnings.toFixed(2)}`, icon: "💰" },
        { label: "Pending Payments", value: `₹${earnings.pending_payments.toFixed(2)}`, icon: "⏳" },
        { label: "Transactions", value: earnings.total_transactions, icon: "🧾" },
    ];

    return (
        <div>
            <h2 style={styles.sectionTitle}>💰 Earnings</h2>

            <div style={styles.statsGrid}>
                {cards.map((card) => (
                    <div key={card.label} style={styles.statCard}>
                        <div style={styles.statIcon}>{card.icon}</div>
                        <div>
                            <p style={styles.statLabel}>{card.label}</p>
                            <p style={styles.statValue}>{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {earnings.total_transactions === 0 ? (
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>🧾 Recent Transactions</h3>
                    <p style={styles.muted}>
                        Payment records appear here once consultations are completed and marked paid.
                        No payment integration is connected yet, so no earnings are fabricated.
                    </p>
                </div>
            ) : (
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>🧾 Recent Transactions</h3>
                    <div style={styles.txList}>
                        {earnings.transactions.map((t) => (
                            <div key={t.id} style={styles.txRow}>
                                <div>
                                    <strong>#{t.id}</strong> {t.service} · {t.customer_name}
                                </div>
                                <div style={styles.txRight}>
                                    <span>₹{t.amount.toFixed(2)}</span>
                                    <span style={badge(t.status, STATUS_COLORS)}>{t.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* =====================================================
   PROFILE
===================================================== */
function ProfileTab({ form, setForm, onSave }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div>
            <h2 style={styles.sectionTitle}>👤 Reader Profile</h2>

            <form onSubmit={onSave}>
                <Field label="Display Name" name="display_name" value={form.display_name} onChange={handleChange} />
                <Field label="Profile Image URL" name="profile_image" value={form.profile_image} onChange={handleChange} />
                <Field label="Specialties" name="specialties" value={form.specialties} onChange={handleChange} placeholder="e.g. Vedic Astrology, Kundli, Tarot" />
                <Field label="Consultation Price (₹/min)" name="consultation_price" type="number" value={form.consultation_price} onChange={handleChange} />
                <Field label="Experience (years)" name="experience_years" type="number" value={form.experience_years} onChange={handleChange} />
                <Field label="Languages" name="languages" value={form.languages} onChange={handleChange} placeholder="e.g. English, Kannada, Hindi" />
                <Field label="Contact Email" name="contact_email" value={form.contact_email} onChange={handleChange} />
                <Field label="Contact Phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} />

                <label style={styles.label}>Bio</label>
                <textarea
                    name="bio"
                    value={form.bio || ""}
                    onChange={handleChange}
                    rows="5"
                    style={styles.textarea}
                    placeholder="Tell customers about your practice..."
                />

                <button type="submit" style={styles.saveBtn}>
                    💾 Save Profile
                </button>
            </form>
        </div>
    );
}

function Field({ label, name, value, onChange, type = "text", placeholder }) {
    return (
        <div style={{ marginBottom: "14px" }}>
            <label style={styles.label}>{label}</label>
            <input
                type={type}
                name={name}
                value={value || ""}
                onChange={onChange}
                placeholder={placeholder}
                style={styles.input}
            />
        </div>
    );
}

/* =====================================================
   REVIEWS
===================================================== */
function ReviewsTab({ reviews }) {
    return (
        <div>
            <h2 style={styles.sectionTitle}>⭐ Reviews</h2>

            {reviews.length === 0 ? (
                <div style={styles.emptyBox}>
                    <p style={styles.muted}>
                        No customer reviews yet. Reviews will appear here when customers
                        leave them on completed consultations. No reviews are fabricated.
                    </p>
                </div>
            ) : (
                <div style={styles.reviewList}>
                    {reviews.map((r) => (
                        <div key={r.id} style={styles.reviewCard}>
                            <div style={styles.reviewTop}>
                                <strong>{r.customer_name}</strong>
                                <span style={styles.rating}>
                                    {"★".repeat(r.rating)}
                                    <span style={{ color: "#444" }}>{"★".repeat(5 - r.rating)}</span>
                                </span>
                            </div>
                            <p style={styles.reviewText}>{r.comment || "No comment."}</p>
                            <p style={styles.mutedSmall}>{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* =====================================================
   HELPERS
===================================================== */
function Info({ label, value }) {
    return (
        <div style={styles.infoItem}>
            <p style={styles.infoLabel}>{label}</p>
            <p style={styles.infoValue}>{value}</p>
        </div>
    );
}

function badge(value, colors) {
    const color = colors[value] || "#d9ad63";
    return {
        background: `${color}1a`,
        color,
        border: `1px solid ${color}40`,
        padding: "4px 10px",
        borderRadius: "15px",
        fontSize: "11px",
        fontWeight: "600",
    };
}

/* =====================================================
   STYLES (Shwetha Cosmic theme)
===================================================== */
const styles = {
    page: {
        minHeight: "100vh",
        background: "#080510",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        paddingBottom: "50px",
    },

    navbar: {
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 5%",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(5,3,10,0.92)",
        position: "sticky",
        top: 0,
        zIndex: 100,
    },

    logo: {
        textDecoration: "none",
        color: "#d9ad63",
        fontSize: "20px",
        fontFamily: 'Georgia, "Times New Roman", serif',
    },

    navRight: { display: "flex", alignItems: "center", gap: "18px" },

    readerBadge: {
        background: "rgba(217,173,99,0.15)",
        border: "1px solid rgba(217,173,99,0.4)",
        color: "#d9ad63",
        padding: "5px 12px",
        borderRadius: "15px",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "1px",
    },

    navLink: { color: "#b8afc0", textDecoration: "none", fontSize: "14px" },

    header: { textAlign: "center", padding: "45px 20px 25px" },

    headerIcon: { fontSize: "45px", marginBottom: "10px" },

    eyebrow: { color: "#d9ad63", letterSpacing: "4px", fontSize: "11px", marginBottom: "8px" },

    title: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "38px", fontWeight: "500", margin: 0,
    },

    gold: { color: "#d9ad63" },

    subtitle: { color: "#91889c", marginTop: "10px", fontSize: "14px" },

    main: {
        width: "94%",
        maxWidth: "1300px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: "22px",
    },

    sidebar: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },

    navItem: {
        textAlign: "left",
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid transparent",
        background: "transparent",
        color: "#91889c",
        fontSize: "14px",
        cursor: "pointer",
        transition: "0.2s",
    },

    navItemActive: {
        background: "#120b1d",
        borderColor: "rgba(217,173,99,0.3)",
        color: "#d9ad63",
        fontWeight: "600",
    },

    content: { minWidth: 0 },

    sectionTitle: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "26px", fontWeight: "500", margin: "0 0 20px",
    },

    card: {
        background: "#120b1d",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "16px",
    },

    cardTitle: { color: "#d9ad63", fontSize: "17px", fontWeight: "600", margin: "0 0 12px" },

    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "14px",
        marginBottom: "16px",
    },

    statCard: {
        display: "flex", alignItems: "center", gap: "12px",
        background: "#120b1d", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px", padding: "18px",
    },

    statIcon: { fontSize: "28px" },

    statLabel: { color: "#91889c", fontSize: "11px", margin: "0 0 4px" },

    statValue: { color: "#d9ad63", fontSize: "22px", fontWeight: "700", margin: 0 },

    notifList: { display: "flex", flexDirection: "column", gap: "8px" },

    notifItem: {
        padding: "12px 14px",
        background: "rgba(217,173,99,0.06)",
        border: "1px solid rgba(217,173,99,0.15)",
        borderRadius: "10px",
        fontSize: "13px",
        color: "#ddd",
    },

    errorWrap: {
        width: "94%", maxWidth: "1300px", margin: "0 auto 12px",
        padding: "13px 16px", borderRadius: "10px",
        background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.25)",
        color: "#ff8585", fontSize: "13px",
    },

    successWrap: {
        width: "94%", maxWidth: "1300px", margin: "0 auto 12px",
        padding: "13px 16px", borderRadius: "10px",
        background: "rgba(101,230,165,0.1)", border: "1px solid rgba(101,230,165,0.25)",
        color: "#65e6a5", fontSize: "13px",
    },

    chips: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },

    chip: {
        padding: "8px 14px", borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "transparent", color: "#91889c", fontSize: "12px", cursor: "pointer",
    },

    chipActive: {
        background: "rgba(217,173,99,0.12)",
        borderColor: "rgba(217,173,99,0.4)", color: "#d9ad63",
    },

    bookingList: { display: "flex", flexDirection: "column", gap: "12px" },

    bookingCard: {
        background: "#120b1d", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px", padding: "18px",
    },

    bookingTop: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: "10px", marginBottom: "14px",
    },

    bookingId: { color: "#d9ad63", fontSize: "15px" },

    bookingService: {
        marginLeft: "10px", color: "#b8afc0", fontSize: "13px",
    },

    badges: { display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" },

    bookingGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "10px",
    },

    infoItem: { background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" },

    infoLabel: { color: "#777080", fontSize: "10px", margin: "0 0 3px" },

    infoValue: { color: "#ddd", fontSize: "13px", margin: 0, wordBreak: "break-word" },

    bookingActions: {
        display: "flex", gap: "10px", marginTop: "14px",
        paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.07)",
    },

    acceptBtn: {
        padding: "9px 16px", borderRadius: "8px", border: "none",
        background: "rgba(101,230,165,0.15)", color: "#65e6a5",
        fontSize: "12px", fontWeight: "600", cursor: "pointer",
    },

    rejectBtn: {
        padding: "9px 16px", borderRadius: "8px",
        border: "1px solid rgba(255,80,80,0.4)",
        background: "rgba(255,80,80,0.08)", color: "#ff8585",
        fontSize: "12px", fontWeight: "600", cursor: "pointer",
    },

    completeBtn: {
        padding: "9px 16px", borderRadius: "8px", border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614", fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },

    consultActions: {
        display: "flex", gap: "10px", marginTop: "14px",
        paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.07)",
        flexWrap: "wrap",
    },

    startConsultBtn: {
        padding: "10px 18px", borderRadius: "8px", border: "none",
        background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
        color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },

    joinConsultBtn: {
        padding: "10px 18px", borderRadius: "8px", border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614", fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },

    endConsultBtn: {
        padding: "10px 18px", borderRadius: "8px",
        border: "1px solid rgba(255,80,80,0.4)",
        background: "rgba(255,80,80,0.08)", color: "#ff8585",
        fontSize: "12px", fontWeight: "600", cursor: "pointer",
    },

    consultDone: {
        color: "#65e6a5", fontSize: "12px", fontWeight: "600",
        padding: "8px 12px", background: "rgba(101,230,165,0.08)",
        borderRadius: "8px", border: "1px solid rgba(101,230,165,0.2)",
    },

    emptyBox: {
        textAlign: "center", padding: "45px 20px",
        background: "#120b1d", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
    },

    customerList: { display: "flex", flexDirection: "column", gap: "10px" },

    customerCard: {
        display: "flex", alignItems: "center", gap: "14px",
        background: "#120b1d", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px", padding: "14px 16px",
    },

    customerAvatar: {
        width: "42px", height: "42px", borderRadius: "50%",
        background: "rgba(217,173,99,0.15)", color: "#d9ad63",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px", fontWeight: "700",
    },

    customerInfo: { flex: 1, minWidth: 0 },

    viewBtn: {
        padding: "8px 14px", borderRadius: "8px",
        border: "1px solid rgba(217,173,99,0.4)",
        background: "rgba(217,173,99,0.08)", color: "#d9ad63",
        fontSize: "12px", cursor: "pointer",
    },

    availRow: {
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexWrap: "wrap",
    },

    availDay: {
        display: "flex", alignItems: "center", gap: "8px",
        width: "170px", color: "#ddd", fontSize: "14px",
    },

    availInput: {
        padding: "9px", borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "#0b0613", color: "#fff", fontSize: "13px",
    },

    availDash: { color: "#777080" },

    saveBtn: {
        marginTop: "20px", padding: "13px 24px",
        borderRadius: "9px", border: "none",
        background: "linear-gradient(135deg, #d9ad63, #b8893f)",
        color: "#0b0614", fontWeight: "700", fontSize: "14px", cursor: "pointer",
    },

    label: {
        display: "block", color: "#d9ad63", fontSize: "11px",
        letterSpacing: "1px", margin: "0 0 7px",
    },

    input: {
        width: "100%", boxSizing: "border-box",
        padding: "12px", borderRadius: "9px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "#0b0613", color: "#fff", outline: "none", fontSize: "14px",
    },

    textarea: {
        width: "100%", boxSizing: "border-box",
        padding: "12px", borderRadius: "9px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "#0b0613", color: "#fff", outline: "none", fontSize: "14px",
        resize: "vertical",
    },

    txList: { display: "flex", flexDirection: "column", gap: "8px" },

    txRow: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: "10px", padding: "10px 12px",
        background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "13px",
    },

    txRight: { display: "flex", alignItems: "center", gap: "10px" },

    reviewList: { display: "flex", flexDirection: "column", gap: "10px" },

    reviewCard: {
        background: "#120b1d", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px", padding: "16px",
    },

    reviewTop: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "8px",
    },

    rating: { color: "#d9ad63", fontSize: "14px" },

    reviewText: { color: "#ddd", fontSize: "14px", lineHeight: "1.6", margin: "0 0 8px" },

    muted: { color: "#91889c", fontSize: "13px", lineHeight: "1.6" },

    mutedSmall: { color: "#777080", fontSize: "11px", margin: "4px 0 0" },

    centerPage: {
        minHeight: "100vh", background: "#080510", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "10px",
    },

    loadingIcon: { fontSize: "55px" },

    /* Responsive */
    "@media (max-width: 900px)": {
        main: { gridTemplateColumns: "1fr" },
    },
};

export default ReaderDashboard;
