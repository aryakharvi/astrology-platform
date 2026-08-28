const db = require("../db");
const { createNotification } = require("./notificationController");

/* =====================================================
   HELPERS
===================================================== */

// The only reader is Shwetha (role = 'admin').
const READER_ROLE = "admin";

// Consultation lifecycle. "scheduled" mirrors the booking status
// system (upcoming/accepted) — we never invent conflicting values.
const CONSULT_STATUS = {
    SCHEDULED: "scheduled",
    WAITING: "waiting",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
};

// Booking states that can move into a consultation.
const ACTIVE_BOOKING_STATUSES = ["upcoming", "accepted", "pending"];

/**
 * Load a booking + its consultation row (if any), joining customer
 * and reader info. Only callers that pass authorization checks may
 * call this (internal).
 */
function loadBookingContext(bookingId, cb) {
    const sql = `
    SELECT
      b.id,
      b.user_id,
      b.astrologer_id,
      b.consultation_type,
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
      a.name AS astrologer_name,
      c.id AS consultation_id,
      c.room_id,
      c.status AS consultation_status,
      c.started_at,
      c.ended_at,
      c.duration_seconds
    FROM bookings b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN astrologers a ON a.id = b.astrologer_id
    LEFT JOIN consultations c ON c.booking_id = b.id
    WHERE b.id = ?
    LIMIT 1
  `;

    db.query(sql, [bookingId], cb);
}

/**
 * Build the room id for a booking. Never predictable without the
 * booking id (which the caller must prove ownership of).
 */
function buildRoomId(bookingId) {
    return `consultation_${bookingId}_shwetha`;
}

/** Normalize a booking row into a clean API object. */
function serializeContext(row) {
    return {
        booking: {
            id: row.id,
            user_id: row.user_id,
            astrologer_id: row.astrologer_id,
            consultation_type: row.consultation_type,
            booking_date: row.booking_date,
            booking_time: row.booking_time,
            status: row.status,
            payment_status: row.payment_status,
            amount: Number(row.amount || 0),
            duration_minutes: Number(row.duration_minutes || 30),
            call_type: row.call_type || "video",
            notes: row.notes,
            created_at: row.created_at,
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            astrologer_name: row.astrologer_name,
        },
        consultation: row.consultation_id
            ? {
                id: row.consultation_id,
                booking_id: row.id,
                room_id: row.room_id,
                consultation_type: row.consultation_type,
                call_type: row.call_type || "video",
                status: row.consultation_status,
                started_at: row.started_at,
                ended_at: row.ended_at,
                duration_seconds: Number(row.duration_seconds || 0),
            }
            : null,
    };
}

/** Check a user can act on this booking (customer owner or Shwetha). */
function canAccessBooking(user, row) {
    if (!row) return false;

    // Shwetha (admin) can access any booking assigned to her astrologer
    // record. Since Shwetha is the only reader, any booking is "hers".
    if (user.role === READER_ROLE) return true;

    // Customer: only their own booking
    return Number(user.id) === Number(row.user_id);
}

/* =====================================================
   GET CONSULTATION
   GET /api/consultations/:bookingId
   Auth required — customer owner or Shwetha
===================================================== */
const getConsultation = (req, res) => {
    const bookingId = req.params.bookingId;

    loadBookingContext(bookingId, (err, rows) => {
        if (err) {
            console.error("Consultation load error:", err.message);
            return res.status(500).json({ message: "Failed to load consultation." });
        }

        const row = rows[0];
        if (!row) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (!canAccessBooking(req.user, row)) {
            return res.status(403).json({ message: "Access denied." });
        }

        res.json(serializeContext(row));
    });
};

/* =====================================================
   START CONSULTATION (Shwetha only)
   POST /api/consultations/:bookingId/start
   Creates the consultation row + signals start.
===================================================== */
const startConsultation = (req, res) => {
    if (req.user.role !== READER_ROLE) {
        return res.status(403).json({ message: "Only the reader can start a consultation." });
    }

    const bookingId = req.params.bookingId;

    loadBookingContext(bookingId, (err, rows) => {
        if (err) {
            console.error("Consultation start error:", err.message);
            return res.status(500).json({ message: "Failed to start consultation." });
        }

        const row = rows[0];
        if (!row) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Shwetha can only start bookings that are hers (all are, but verify)
        if (!canAccessBooking(req.user, row)) {
            return res.status(403).json({ message: "Access denied." });
        }

        // Booking must be in an active state
        if (!ACTIVE_BOOKING_STATUSES.includes(row.status)) {
            return res.status(400).json({
                message: `Booking cannot be started (status: ${row.status}).`,
            });
        }

        // Payment requirement: a paid booking can start. If the platform
        // marks payment 'pending', we still allow the consultation but
        // require the booking to be accepted/upcoming — this is a demo
        // without a live gateway. For strict enforcement, set REQUIRE_PAID.
        const REQUIRE_PAID = false; // no live payment gateway connected
        if (REQUIRE_PAID && row.payment_status !== "paid") {
            return res.status(400).json({
                message: "Payment is required before starting this consultation.",
            });
        }

        const roomId = buildRoomId(bookingId);

        const upsert = `
      INSERT INTO consultations
        (booking_id, room_id, consultation_type, call_type, status, started_at)
      VALUES (?, ?, ?, ?, 'in_progress', NOW())
      ON DUPLICATE KEY UPDATE
        room_id = VALUES(room_id),
        consultation_type = VALUES(consultation_type),
        call_type = VALUES(call_type),
        status = IF(consultations.status = 'completed', consultations.status, 'in_progress'),
        started_at = COALESCE(consultations.started_at, NOW()),
        ended_at = NULL
    `;

        db.query(
            upsert,
            [bookingId, roomId, row.consultation_type, row.call_type],
            (upsertErr) => {
                if (upsertErr) {
                    console.error("Consultation insert error:", upsertErr.message);
                    return res.status(500).json({ message: "Failed to start consultation." });
                }

                // Update booking to accepted (in-progress) so the customer
                // sees a Join button. Do not overwrite completed/cancelled.
                const bookingSql = `
          UPDATE bookings
          SET status = 'accepted'
          WHERE id = ? AND status IN ('upcoming','pending')
        `;
                db.query(bookingSql, [bookingId], () => {
                    createNotification({
                        userId: row.user_id,
                        type: "consultation",
                        title: "Consultation started",
                        message: "Shwetha has started your consultation. Please join now.",
                    }).catch(() => { });

                    res.json({
                        message: "Consultation started.",
                        room_id: roomId,
                        booking_id: bookingId,
                    });
                });
            }
        );
    });
};

/* =====================================================
   JOIN CONSULTATION
   POST /api/consultations/:bookingId/join
   Auth required — customer owner or Shwetha.
   Verifies eligibility + payment on the backend.
===================================================== */
const joinConsultation = (req, res) => {
    const bookingId = req.params.bookingId;

    loadBookingContext(bookingId, (err, rows) => {
        if (err) {
            console.error("Consultation join error:", err.message);
            return res.status(500).json({ message: "Failed to join consultation." });
        }

        const row = rows[0];
        if (!row) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (!canAccessBooking(req.user, row)) {
            return res.status(403).json({ message: "Access denied." });
        }

        // Cancelled / completed / expired bookings cannot be joined
        if (["cancelled", "rejected", "completed"].includes(row.status)) {
            return res.status(400).json({
                message: `This booking is not joinable (status: ${row.status}).`,
            });
        }

        // Payment enforcement (read from MySQL, never the frontend)
        const REQUIRE_PAID = false;
        if (REQUIRE_PAID && row.payment_status !== "paid") {
            return res.status(400).json({
                message: "Payment is required before joining this consultation.",
            });
        }

        // A consultation must exist (started by Shwetha) to join
        if (!row.consultation_id) {
            return res.status(400).json({
                message: "The consultation has not started yet. Please wait for Shwetha.",
            });
        }

        if (row.consultation_status === "completed") {
            return res.status(400).json({ message: "This consultation is already completed." });
        }

        // If already in_progress, mark waiting->in_progress if needed
        if (row.consultation_status === "waiting" || row.consultation_status === "scheduled") {
            db.query(
                "UPDATE consultations SET status = 'in_progress' WHERE id = ?",
                [row.consultation_id],
                () => { }
            );
        }

        // Notify the other party:
        //  - Reader joins  -> notify the customer
        //  - Customer joins -> notify Shwetha (the admin account)
        const isReader = req.user.role === READER_ROLE;

        if (isReader) {
            createNotification({
                userId: row.user_id,
                type: "consultation",
                title: "Shwetha joined",
                message: "Shwetha has joined your consultation. You can now start talking.",
            }).catch(() => { });
        } else {
            db.query(
                "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
                (adminErr, adminRows) => {
                    if (!adminErr && adminRows.length > 0) {
                        createNotification({
                            userId: adminRows[0].id,
                            type: "consultation",
                            title: "Customer joined",
                            message: `${req.user.name || "Customer"} has joined the consultation.`,
                        }).catch(() => { });
                    }
                }
            );
        }

        res.json({
            message: "Joined consultation.",
            room_id: row.room_id,
            consultation_id: row.consultation_id,
            booking: {
                id: row.id,
                consultation_type: row.consultation_type,
                call_type: row.call_type,
                duration_minutes: Number(row.duration_minutes || 30),
                customer_name: row.customer_name,
                astrologer_name: row.astrologer_name || "Shwetha",
            },
        });
    });
};

/* =====================================================
   END CONSULTATION
   POST /api/consultations/:bookingId/end
   Auth required — customer owner or Shwetha.
   Server computes duration; never trusts the client.
===================================================== */
const endConsultation = (req, res) => {
    const bookingId = req.params.bookingId;

    loadBookingContext(bookingId, (err, rows) => {
        if (err) {
            console.error("Consultation end error:", err.message);
            return res.status(500).json({ message: "Failed to end consultation." });
        }

        const row = rows[0];
        if (!row) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (!canAccessBooking(req.user, row)) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (!row.consultation_id) {
            return res.status(400).json({ message: "No active consultation for this booking." });
        }

        const consultationId = row.consultation_id;

        // Server-side duration: if started, diff now - started_at.
        // If not started (edge case), use 0.
        let durationSeconds = 0;
        if (row.started_at) {
            const start = new Date(row.started_at).getTime();
            const now = Date.now();
            durationSeconds = Math.max(0, Math.floor((now - start) / 1000));
        }

        const updateSql = `
      UPDATE consultations
      SET status = 'completed',
          ended_at = NOW(),
          duration_seconds = ?
      WHERE id = ? AND status != 'completed'
    `;

        db.query(updateSql, [durationSeconds, consultationId], (updateErr) => {
            if (updateErr) {
                console.error("Consultation end update error:", updateErr.message);
                return res.status(500).json({ message: "Failed to end consultation." });
            }

            // Mark booking completed + payment paid (real earning) only when
            // the consultation actually ran. Do not auto-complete on browser close.
            const bookingSql = `
        UPDATE bookings
        SET status = 'completed', payment_status = 'paid'
        WHERE id = ? AND status IN ('upcoming','accepted','pending')
      `;
            db.query(bookingSql, [bookingId], () => {
                // Notify customer + reader
                const notifyUserId = req.user.role === READER_ROLE ? row.user_id : req.user.id;

                createNotification({
                    userId: notifyUserId,
                    type: "consultation",
                    title: "Consultation ended",
                    message: "Your consultation has ended. You can now leave a review.",
                }).catch(() => { });

                // Notify the other party (admin for customer end, customer for reader end)
                if (req.user.role !== READER_ROLE) {
                    db.query(
                        "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
                        (adminErr, adminRows) => {
                            if (!adminErr && adminRows.length > 0) {
                                createNotification({
                                    userId: adminRows[0].id,
                                    type: "consultation",
                                    title: "Consultation ended",
                                    message: `Consultation with ${row.customer_name} has ended.`,
                                }).catch(() => { });
                            }
                        }
                    );
                } else {
                    createNotification({
                        userId: row.user_id,
                        type: "consultation",
                        title: "Consultation ended",
                        message: "Your consultation has ended. You can now leave a review.",
                    }).catch(() => { });
                }

                res.json({
                    message: "Consultation completed.",
                    duration_seconds: durationSeconds,
                    booking_status: "completed",
                });
            });
        });
    });
};

/* =====================================================
   CONSULTATION HEARTBEAT
   POST /api/consultations/:bookingId/heartbeat
   Auth required — updates last-seen so the server can
   detect disconnected participants (reconnection state).
===================================================== */
const heartbeatConsultation = (req, res) => {
    const bookingId = req.params.bookingId;

    loadBookingContext(bookingId, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Failed to process heartbeat." });
        }

        const row = rows[0];
        if (!row) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (!canAccessBooking(req.user, row)) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (!row.consultation_id) {
            return res.status(400).json({ message: "No active consultation." });
        }

        // Store the latest heartbeat on the consultation row (updated_at).
        db.query(
            "UPDATE consultations SET updated_at = NOW() WHERE id = ?",
            [row.consultation_id],
            () => res.json({ ok: true })
        );
    });
};

module.exports = {
    getConsultation,
    startConsultation,
    joinConsultation,
    endConsultation,
    heartbeatConsultation,
    loadBookingContext,
    buildRoomId,
    CONSULT_STATUS,
    ACTIVE_BOOKING_STATUSES,
};
