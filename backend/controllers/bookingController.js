const db = require("../db");

/* =====================================================
   CREATE BOOKING
   POST /api/bookings
   Auth required
===================================================== */
const createBooking = (req, res) => {
    const {
        astrologer_id,
        service,
        consultation_type,
        booking_date,
        booking_time,
        amount,
        notes,
        call_type,
        duration_minutes,
    } = req.body;

    // Accept both `service` (frontend) and `consultation_type` (db column)
    const serviceName = service || consultation_type;

    if (!serviceName || !booking_date || !booking_time) {
        return res.status(400).json({
            message: "Service, booking date and booking time are required.",
        });
    }

    const sql = `
    INSERT INTO bookings
    (user_id, astrologer_id, consultation_type, booking_date, booking_time, amount, duration_minutes, call_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    // Only allow 'video' or 'audio'; never trust arbitrary values
    const callType = call_type === "audio" ? "audio" : "video";
    const duration = Math.min(Math.max(Number(duration_minutes) || 30, 15), 120);

    db.query(
        sql,
        [
            req.user.id,
            astrologer_id || null,
            serviceName,
            booking_date,
            booking_time,
            amount || 0,
            duration,
            callType,
            notes || null,
        ],
        (err, result) => {
            if (err) {
                console.error("Booking creation error:", err.message);
                return res.status(500).json({
                    message: "Failed to create booking.",
                });
            }

            res.status(201).json({
                message: "Booking created successfully!",
                bookingId: result.insertId,
            });
        }
    );
};

/* =====================================================
   HELPERS
===================================================== */

// MySQL returns DATE/DATETIME columns as Date objects that serialize
// to UTC ISO strings (shifting the day). Convert to plain YYYY-MM-DD
// so the frontend always shows the date the user picked.
function toISODate(value) {
    if (!value) return value;

    if (value instanceof Date) {
        const year = value.getUTCFullYear();
        const month = String(value.getUTCMonth() + 1).padStart(2, "0");
        const day = String(value.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    const str = String(value);
    return str.includes("T") ? str.split("T")[0] : str;
}

/* =====================================================
   GET MY BOOKINGS
   GET /api/bookings
   Auth required
   Includes astrologer name joined from astrologers table
===================================================== */
const getMyBookings = (req, res) => {
    const sql = `
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
      a.name AS astrologer_name,
      r.id AS review_id,
      r.rating AS review_rating,
      r.comment AS review_comment,
      c.status AS consultation_status,
      c.room_id AS consultation_room_id,
      c.started_at AS consultation_started_at
    FROM bookings b
    LEFT JOIN astrologers a ON a.id = b.astrologer_id
    LEFT JOIN reviews r ON r.booking_id = b.id
    LEFT JOIN consultations c ON c.booking_id = b.id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC, b.booking_time DESC
  `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("Bookings fetch error:", err.message);
            return res.status(500).json({
                message: "Failed to load bookings.",
            });
        }

        const bookings = results.map((row) => ({
            ...row,
            booking_date: toISODate(row.booking_date),
            created_at: toISODate(row.created_at),
            reviewed: Boolean(row.review_id),
            duration_minutes: Number(row.duration_minutes || 30),
            call_type: row.call_type || "video",
            consultation_status: row.consultation_status || null,
            consultation_room_id: row.consultation_room_id || null,
            consultation_started_at: row.consultation_started_at || null,
        }));

        res.json({ bookings });
    });
};

/* =====================================================
   CANCEL BOOKING
   PUT /api/bookings/:id/cancel
   Auth required
   Only the owner can cancel; only if not already cancelled/completed
===================================================== */
const cancelBooking = (req, res) => {
    const bookingId = req.params.id;

    const findSql = `
    SELECT id, status
    FROM bookings
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;

    db.query(findSql, [bookingId, req.user.id], (err, results) => {
        if (err) {
            console.error("Booking lookup error:", err.message);
            return res.status(500).json({ message: "Failed to load booking." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const booking = results[0];

        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Booking is already cancelled." });
        }

        if (booking.status === "completed") {
            return res.status(400).json({ message: "Completed bookings cannot be cancelled." });
        }

        const updateSql = `
      UPDATE bookings
      SET status = 'cancelled',
          payment_status = IF(payment_status = 'paid', 'refunded', payment_status)
      WHERE id = ? AND user_id = ?
    `;

        db.query(updateSql, [bookingId, req.user.id], (updateErr) => {
            if (updateErr) {
                console.error("Booking cancel error:", updateErr.message);
                return res.status(500).json({ message: "Failed to cancel booking." });
            }

            res.json({ message: "Booking cancelled successfully." });
        });
    });
};

/* =====================================================
   RESCHEDULE BOOKING
   PUT /api/bookings/:id/reschedule
   Auth required
   Only the owner can reschedule; new date/time required
===================================================== */
const rescheduleBooking = (req, res) => {
    const bookingId = req.params.id;
    const { booking_date, booking_time } = req.body;

    if (!booking_date || !booking_time) {
        return res.status(400).json({
            message: "New booking date and time are required.",
        });
    }

    const findSql = `
    SELECT id, status
    FROM bookings
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;

    db.query(findSql, [bookingId, req.user.id], (err, results) => {
        if (err) {
            console.error("Booking lookup error:", err.message);
            return res.status(500).json({ message: "Failed to load booking." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const booking = results[0];

        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Cancelled bookings cannot be rescheduled." });
        }

        if (booking.status === "completed") {
            return res.status(400).json({ message: "Completed bookings cannot be rescheduled." });
        }

        const updateSql = `
      UPDATE bookings
      SET booking_date = ?, booking_time = ?
      WHERE id = ? AND user_id = ?
    `;

        db.query(
            updateSql,
            [booking_date, booking_time, bookingId, req.user.id],
            (updateErr) => {
                if (updateErr) {
                    console.error("Booking reschedule error:", updateErr.message);
                    return res.status(500).json({ message: "Failed to reschedule booking." });
                }

                res.json({ message: "Booking rescheduled successfully." });
            }
        );
    });
};

/* =====================================================
   ADD REVIEW (only for the owner, only after completed)
   POST /api/bookings/:id/review
   Auth required
   Body: { rating (1-5), comment (optional) }
   One review per booking (idempotent upsert)
===================================================== */
const addReview = (req, res) => {
    const bookingId = req.params.id;
    const { rating, comment } = req.body;

    const ratingNum = Number(rating);

    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({
            message: "Rating must be a whole number between 1 and 5.",
        });
    }

    const findSql = `
    SELECT id, status
    FROM bookings
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;

    db.query(findSql, [bookingId, req.user.id], (err, results) => {
        if (err) {
            console.error("Booking lookup error:", err.message);
            return res.status(500).json({ message: "Failed to load booking." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const booking = results[0];

        if (booking.status !== "completed") {
            return res.status(400).json({
                message: "Only completed consultations can be reviewed.",
            });
        }

        const upsert = `
      INSERT INTO reviews (booking_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        comment = VALUES(comment)
    `;

        db.query(
            upsert,
            [bookingId, req.user.id, ratingNum, comment || null],
            (updateErr) => {
                if (updateErr) {
                    console.error("Review save error:", updateErr.message);
                    return res.status(500).json({ message: "Failed to save review." });
                }

                res.json({ message: "Thank you! Review submitted successfully." });
            }
        );
    });
};

module.exports = {
    createBooking,
    getMyBookings,
    cancelBooking,
    rescheduleBooking,
    addReview,
};
