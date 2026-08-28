const db = require("../db");

/* =====================================================
   AUTHORIZATION
   Only the authorized Shwetha reader (role = 'admin')
   can access any /api/reader endpoint.
===================================================== */
function requireReader(req, res, next) {
    // authenticateToken already populated req.user
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required." });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Reader only." });
    }

    next();
}

/* =====================================================
   GET READER STATS (overview)
   GET /api/reader/stats
===================================================== */
const getStats = (req, res) => {
    // Local date (server TZ) so "today" matches the user's calendar day,
    // not UTC which can shift by a day in IST (+05:30).
    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-");

    // Active = upcoming or accepted (reader may have accepted already)
    const sql = `
    SELECT
      SUM(CASE WHEN booking_date = ? AND status IN ('upcoming','accepted','pending') THEN 1 ELSE 0 END) AS today_bookings,
      SUM(CASE WHEN status IN ('upcoming','accepted','pending') AND booking_date >= ? THEN 1 ELSE 0 END) AS upcoming_bookings,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status IN ('upcoming','accepted','pending') THEN 1 ELSE 0 END) AS pending,
      COUNT(DISTINCT user_id) AS total_customers,
      SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' THEN amount ELSE 0 END) AS total_earnings
    FROM bookings
  `;

    db.query(sql, [today, today], (err, results) => {
        if (err) {
            console.error("Reader stats error:", err.message);
            return res.status(500).json({ message: "Failed to load stats." });
        }

        const row = results[0] || {};

        res.json({
            stats: {
                today_bookings: Number(row.today_bookings || 0),
                upcoming_bookings: Number(row.upcoming_bookings || 0),
                completed: Number(row.completed || 0),
                pending: Number(row.pending || 0),
                total_customers: Number(row.total_customers || 0),
                total_earnings: Number(row.total_earnings || 0),
            },
        });
    });
};

/* =====================================================
   GET ALL READER BOOKINGS
   GET /api/reader/bookings
   Optional query: ?status=upcoming
===================================================== */
const getReaderBookings = (req, res) => {
    const { status } = req.query;

    let sql = `
    SELECT
      b.id,
      b.user_id,
      b.astrologer_id,
      b.consultation_type AS service,
      b.booking_date,
      b.booking_time,
      b.status,
      b.payment_status,
      b.amount,
      b.duration_minutes,
      b.call_type,
      b.notes,
      b.created_at,
      u.name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      c.id AS consultation_id,
      c.room_id AS consultation_room_id,
      c.status AS consultation_status,
      c.started_at AS consultation_started_at,
      c.ended_at AS consultation_ended_at
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    LEFT JOIN consultations c ON c.booking_id = b.id
  `;

    const params = [];

    if (status) {
        sql += ` WHERE b.status = ?`;
        params.push(status);
    }

    sql += ` ORDER BY b.booking_date DESC, b.booking_time DESC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Reader bookings error:", err.message);
            return res.status(500).json({ message: "Failed to load bookings." });
        }

        res.json({
            bookings: results.map((row) => ({
                ...normalizeBooking(row),
                duration_minutes: Number(row.duration_minutes || 30),
                call_type: row.call_type || "video",
                consultation_id: row.consultation_id || null,
                consultation_room_id: row.consultation_room_id || null,
                consultation_status: row.consultation_status || null,
                consultation_started_at: row.consultation_started_at || null,
                consultation_ended_at: row.consultation_ended_at || null,
            })),
        });
    });
};

/* =====================================================
   UPDATE BOOKING STATUS (accept/reject/complete/cancel)
   PUT /api/reader/bookings/:id/status
   Body: { status }
===================================================== */
const updateBookingStatus = (req, res) => {
    const bookingId = req.params.id;
    const { status } = req.body;

    const allowed = ["accepted", "rejected", "completed", "cancelled"];
    if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
    }

    const findSql = `
    SELECT id, status, payment_status
    FROM bookings
    WHERE id = ?
    LIMIT 1
  `;

    db.query(findSql, [bookingId], (err, results) => {
        if (err) {
            console.error("Booking lookup error:", err.message);
            return res.status(500).json({ message: "Failed to load booking." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const booking = results[0];

        // Business rules
        if (booking.status === "completed") {
            return res.status(400).json({ message: "Completed bookings cannot be changed." });
        }

        // When completing, mark payment as paid (real earning)
        let paymentSql = `UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?`;
        let params = [status, bookingId];

        if (status === "completed") {
            paymentSql = `
        UPDATE bookings
        SET status = ?, payment_status = 'paid', updated_at = NOW()
        WHERE id = ?
      `;
            params = [status, bookingId];
        } else if (status === "cancelled" || status === "rejected") {
            // Cancel/reject after a payment was collected: refund it so
            // earnings stay truthful (mirrors the customer-side cancel).
            paymentSql = `
        UPDATE bookings
        SET status = ?,
            payment_status = IF(payment_status = 'paid', 'refunded', payment_status),
            updated_at = NOW()
        WHERE id = ?
      `;
            params = [status, bookingId];
        }

        db.query(paymentSql, params, (updateErr) => {
            if (updateErr) {
                console.error("Booking status update error:", updateErr.message);
                return res.status(500).json({ message: "Failed to update booking." });
            }

            res.json({ message: `Booking ${status} successfully.` });
        });
    });
};

/* =====================================================
   GET READER PROFILE
   GET /api/reader/profile
===================================================== */
const getReaderProfile = (req, res) => {
    const sql = `
    SELECT
      u.id AS user_id,
      u.name AS account_name,
      u.email AS account_email,
      u.phone AS account_phone,
      u.role,
      rp.id AS profile_id,
      rp.display_name,
      rp.bio,
      rp.specialties,
      rp.consultation_price,
      rp.experience_years,
      rp.languages,
      rp.contact_email,
      rp.contact_phone,
      rp.profile_image
    FROM users u
    LEFT JOIN reader_profile rp ON rp.user_id = u.id
    WHERE u.id = ? AND u.role = 'admin'
    LIMIT 1
  `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("Reader profile error:", err.message);
            return res.status(500).json({ message: "Failed to load profile." });
        }

        if (results.length === 0) {
            return res.status(403).json({ message: "Access denied. Reader only." });
        }

        // Seed defaults from the astrologers table (Shwetha's public listing)
        if (!results[0].display_name || !results[0].bio) {
            seedFromAstrologers(results[0], (seeded) => {
                res.json({ profile: seeded });
            });
            return;
        }

        res.json({ profile: results[0] });
    });
};

function seedFromAstrologers(row, done) {
    // Use the astrologers table entry for Shwetha as initial profile data
    const sql = `
    SELECT name, specialization, experience, price_per_minute, languages, bio, image
    FROM astrologers
    WHERE name LIKE 'Shwetha%'
    ORDER BY id ASC
    LIMIT 1
  `;

    db.query(sql, [], (err, results) => {
        if (err || results.length === 0) {
            return done(row);
        }

        const a = results[0];
        const profile = {
            ...row,
            display_name: row.display_name || a.name,
            bio: row.bio || a.bio,
            specialties: row.specialties || a.specialization,
            consultation_price: row.consultation_price ?? a.price_per_minute,
            experience_years: row.experience_years ?? a.experience,
            languages: row.languages || a.languages,
            profile_image: row.profile_image || a.image,
        };

        // Persist the seed so it only happens once
        const upsert = `
      INSERT INTO reader_profile
        (user_id, display_name, bio, specialties, consultation_price,
         experience_years, languages, contact_email, contact_phone, profile_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        display_name = COALESCE(reader_profile.display_name, VALUES(display_name)),
        bio = COALESCE(reader_profile.bio, VALUES(bio)),
        specialties = COALESCE(reader_profile.specialties, VALUES(specialties))
    `;

        db.query(
            upsert,
            [
                row.user_id, a.name, a.bio, a.specialization, a.price_per_minute,
                a.experience, a.languages, row.account_email, row.account_phone, a.image,
            ],
            () => done(profile)
        );
    });
}

/* =====================================================
   UPDATE READER PROFILE
   PUT /api/reader/profile
   Cannot change role (role is never in the update set)
===================================================== */
const updateReaderProfile = (req, res) => {
    const {
        display_name,
        bio,
        specialties,
        consultation_price,
        experience_years,
        languages,
        contact_email,
        contact_phone,
        profile_image,
    } = req.body;

    const upsert = `
    INSERT INTO reader_profile
      (user_id, display_name, bio, specialties, consultation_price,
       experience_years, languages, contact_email, contact_phone, profile_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      display_name = VALUES(display_name),
      bio = VALUES(bio),
      specialties = VALUES(specialties),
      consultation_price = VALUES(consultation_price),
      experience_years = VALUES(experience_years),
      languages = VALUES(languages),
      contact_email = VALUES(contact_email),
      contact_phone = VALUES(contact_phone),
      profile_image = VALUES(profile_image)
  `;

    db.query(
        upsert,
        [
            req.user.id,
            display_name ?? null,
            bio ?? null,
            specialties ?? null,
            consultation_price ?? 25,
            experience_years ?? null,
            languages ?? null,
            contact_email ?? null,
            contact_phone ?? null,
            profile_image ?? null,
        ],
        (err) => {
            if (err) {
                console.error("Reader profile update error:", err.message);
                return res.status(500).json({ message: "Failed to update profile." });
            }

            res.json({ message: "Profile updated successfully." });
        }
    );
};

/* =====================================================
   GET CUSTOMERS
   GET /api/reader/customers
===================================================== */
const getCustomers = (req, res) => {
    const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      COUNT(b.id) AS booking_count,
      MAX(b.booking_date) AS last_appointment
    FROM users u
    JOIN bookings b ON b.user_id = u.id
    GROUP BY u.id, u.name, u.email, u.phone
    ORDER BY last_appointment DESC
  `;

    db.query(sql, [], (err, results) => {
        if (err) {
            console.error("Customers error:", err.message);
            return res.status(500).json({ message: "Failed to load customers." });
        }

        res.json({
            customers: results.map((c) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                booking_count: Number(c.booking_count || 0),
                last_appointment: c.last_appointment || null,
            })),
        });
    });
};

/* =====================================================
   GET CUSTOMER DETAIL (incl. Kundli info if present)
   GET /api/reader/customers/:id
===================================================== */
const getCustomerDetail = (req, res) => {
    const customerId = req.params.id;

    const userSql = `
    SELECT id, name, email, phone, created_at
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

    db.query(userSql, [customerId], (err, userResults) => {
        if (err || userResults.length === 0) {
            return res.status(404).json({ message: "Customer not found." });
        }

        const user = userResults[0];

        const kundliSql = `
      SELECT id, name, date_of_birth, time_of_birth, place_of_birth, gender, kundli_data, created_at
      FROM kundli
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

        db.query(kundliSql, [customerId], (err2, kundliResults) => {
            if (err2) {
                console.error("Customer kundli error:", err2.message);
                return res.status(500).json({ message: "Failed to load customer." });
            }

            let kundli = null;
            if (kundliResults.length > 0) {
                const k = kundliResults[0];
                kundli = {
                    id: k.id,
                    name: k.name,
                    date_of_birth: k.date_of_birth,
                    time_of_birth: k.time_of_birth,
                    place_of_birth: k.place_of_birth,
                    gender: k.gender,
                    kundli_data: parseKundliData(k.kundli_data),
                };
            }

            res.json({ customer: { ...user, kundli } });
        });
    });
};

/* =====================================================
   GET AVAILABILITY
   GET /api/reader/availability
===================================================== */
const getAvailability = (req, res) => {
    const sql = `
    SELECT id, day_of_week, start_time, end_time, duration_minutes, break_minutes, enabled
    FROM reader_availability
    WHERE user_id = ?
    ORDER BY day_of_week ASC
  `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("Availability error:", err.message);
            return res.status(500).json({ message: "Failed to load availability." });
        }

        res.json({
            availability: results.map((a) => ({
                ...a,
                start_time: toTimeString(a.start_time),
                end_time: toTimeString(a.end_time),
            })),
        });
    });
};

/* =====================================================
   SAVE AVAILABILITY (bulk upsert)
   PUT /api/reader/availability
   Body: { availability: [{ day_of_week, start_time, end_time,
          duration_minutes, break_minutes, enabled }] }
===================================================== */
const saveAvailability = (req, res) => {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
        return res.status(400).json({ message: "Availability must be an array." });
    }

    const upsert = `
    INSERT INTO reader_availability
      (user_id, day_of_week, start_time, end_time, duration_minutes, break_minutes, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      start_time = VALUES(start_time),
      end_time = VALUES(end_time),
      duration_minutes = VALUES(duration_minutes),
      break_minutes = VALUES(break_minutes),
      enabled = VALUES(enabled)
  `;

    // Enabled days must have valid times; disabled days (off) are stored
    // with enabled=0 and may have empty times.
    let failed = false;
    let pending = availability.length;

    if (pending === 0) {
        return res.json({ message: "Availability saved." });
    }

    availability.forEach((slot) => {
        const day = Number(slot.day_of_week);
        const enabled = slot.enabled ? 1 : 0;

        if (day < 0 || day > 6) {
            failed = true;
            pending--;
            if (pending === 0) {
                if (failed) {
                    return res.status(400).json({ message: "Invalid availability day." });
                }
                res.json({ message: "Availability saved." });
            }
            return;
        }

        // Enabled day with no times is invalid
        if (enabled && (!slot.start_time || !slot.end_time)) {
            failed = true;
            pending--;
            if (pending === 0) {
                if (failed) {
                    return res.status(400).json({ message: "Enabled days need a start and end time." });
                }
                res.json({ message: "Availability saved." });
            }
            return;
        }

        db.query(
            upsert,
            [
                req.user.id,
                day,
                slot.start_time || null,
                slot.end_time || null,
                slot.duration_minutes || 30,
                slot.break_minutes || 5,
                enabled,
            ],
            (err) => {
                if (err) {
                    console.error("Availability save error:", err.message);
                    failed = true;
                }

                pending--;
                if (pending === 0) {
                    if (failed) {
                        return res.status(500).json({ message: "Failed to save some availability slots." });
                    }
                    res.json({ message: "Availability saved." });
                }
            }
        );
    });
};

/* =====================================================
   GET EARNINGS
   GET /api/reader/earnings
===================================================== */
const getEarnings = (req, res) => {
    const sql = `
    SELECT
      SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' THEN amount ELSE 0 END) AS completed_earnings,
      SUM(CASE WHEN status IN ('upcoming','accepted','pending') AND payment_status = 'pending' THEN amount ELSE 0 END) AS pending_payments,
      COUNT(*) AS total_transactions
    FROM bookings
  `;

    db.query(sql, [], (err, results) => {
        if (err) {
            console.error("Earnings error:", err.message);
            return res.status(500).json({ message: "Failed to load earnings." });
        }

        const row = results[0] || {};
        const completed = Number(row.completed_earnings || 0);
        const pending = Number(row.pending_payments || 0);

        // Recent transactions (latest bookings with amounts)
        const txSql = `
      SELECT b.id, b.booking_date, b.booking_time, b.consultation_type AS service,
             b.amount, b.status, b.payment_status, u.name AS customer_name
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      ORDER BY b.id DESC
      LIMIT 10
    `;

        db.query(txSql, [], (err2, txResults) => {
            if (err2) {
                console.error("Transactions error:", err2.message);
                return res.status(500).json({ message: "Failed to load earnings." });
            }

            res.json({
                earnings: {
                    total_earnings: completed,
                    completed_earnings: completed,
                    pending_payments: pending,
                    total_transactions: Number(row.total_transactions || 0),
                    transactions: txResults.map(normalizeBooking),
                },
            });
        });
    });
};

/* =====================================================
   GET REVIEWS
   GET /api/reader/reviews
===================================================== */
const getReviews = (req, res) => {
    const sql = `
    SELECT
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      u.name AS customer_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
  `;

    db.query(sql, [], (err, results) => {
        if (err) {
            console.error("Reviews error:", err.message);
            return res.status(500).json({ message: "Failed to load reviews." });
        }

        res.json({ reviews: results });
    });
};

/* =====================================================
   HELPERS
===================================================== */

function normalizeBooking(row) {
    return {
        id: row.id,
        user_id: row.user_id,
        astrologer_id: row.astrologer_id,
        service: row.service,
        booking_date: toISODate(row.booking_date),
        booking_time: toTimeString(row.booking_time),
        status: row.status,
        payment_status: row.payment_status,
        amount: Number(row.amount || 0),
        notes: row.notes,
        created_at: row.created_at,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
    };
}

function parseKundliData(value) {
    if (!value) return null;
    try {
        return typeof value === "string" ? JSON.parse(value) : value;
    } catch (e) {
        return null;
    }
}

function toISODate(value) {
    if (!value) return null;
    if (value instanceof Date) {
        const y = value.getUTCFullYear();
        const m = String(value.getUTCMonth() + 1).padStart(2, "0");
        const d = String(value.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    const str = String(value);
    return str.includes("T") ? str.split("T")[0] : str.slice(0, 10);
}

function toTimeString(value) {
    if (!value) return null;
    if (value instanceof Date) {
        const h = String(value.getUTCHours()).padStart(2, "0");
        const m = String(value.getUTCMinutes()).padStart(2, "0");
        return `${h}:${m}`;
    }
    return String(value).slice(0, 5);
}

module.exports = {
    requireReader,
    getStats,
    getReaderBookings,
    updateBookingStatus,
    getReaderProfile,
    updateReaderProfile,
    getCustomers,
    getCustomerDetail,
    getAvailability,
    saveAvailability,
    getEarnings,
    getReviews,
};
