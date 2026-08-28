const jwt = require("jsonwebtoken");
const { loadBookingContext, buildRoomId } = require("./controllers/consultationController");
const { createNotification } = require("./controllers/notificationController");

const JWT_SECRET = process.env.JWT_SECRET || "shwetha_cosmic_secret_key_2026";

/* =====================================================
   SOCKET.IO SIGNALING SERVER
   -----------------------------------------------------
   Handles WebRTC signaling for consultations:
     join consultation room (JWT-authenticated)
     offer / answer / ICE candidates
     participant joined / left
     consultation started / completed / ended
     reconnect / heartbeat

   A user may only join a room for a booking they are
   authorized for (customer owner or Shwetha/admin).
   The room is derived from the booking — never exposed
   as a public unrestricted room.
===================================================== */

/**
 * Create and attach a Socket.IO server to the HTTP server.
 * @param {http.Server} httpServer
 * @param {import('socket.io').Server} io
 */
function initSocket(httpServer) {
    const { Server } = require("socket.io");

    const io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
            ],
            credentials: true,
        },
    });

    /* ---------- AUTH MIDDLEWARE ---------- */
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required."));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded; // { id, email, role }
            next();
        } catch (e) {
            return next(new Error("Invalid or expired token."));
        }
    });

    /* ---------- CONNECTION ---------- */
    io.on("connection", (socket) => {
        const user = socket.user;

        if (!user) {
            socket.disconnect(true);
            return;
        }

        /* ---- JOIN CONSULTATION ROOM ----
           Verify on the server that this user may join the booking's room.
        */
        socket.on("join_consultation", (payload, ack) => {
            const bookingId = Number(payload?.booking_id);

            if (!bookingId) {
                return ack && ack({ error: "Booking id is required." });
            }

            loadBookingContext(bookingId, (err, rows) => {
                if (err) {
                    return ack && ack({ error: "Failed to load consultation." });
                }

                const row = rows[0];
                if (!row) {
                    return ack && ack({ error: "Booking not found." });
                }

                // Authorization: customer owner or Shwetha
                const isReader = user.role === "admin";
                const isOwner = Number(user.id) === Number(row.user_id);

                if (!isReader && !isOwner) {
                    return ack && ack({ error: "Access denied." });
                }

                // A consultation must exist (started by Shwetha)
                if (!row.consultation_id) {
                    return ack && ack({ error: "Consultation has not started yet." });
                }

                if (row.consultation_status === "completed") {
                    return ack && ack({ error: "Consultation is already completed." });
                }

                if (["cancelled", "rejected"].includes(row.status)) {
                    return ack && ack({ error: "Booking is cancelled." });
                }

                const room = buildRoomId(bookingId);
                socket.join(room);

                // Track user identity within the room
                socket.data.room = room;
                socket.data.booking_id = bookingId;
                socket.data.role = user.role;
                socket.data.name = user.name || (isReader ? "Shwetha" : "Customer");

                // Broadcast to others in the room
                socket.to(room).emit("participant_joined", {
                    user_id: user.id,
                    role: user.role,
                    name: socket.data.name,
                });

                // Send the room info back to the joiner
                ack && ack({
                    ok: true,
                    room,
                    booking_id: bookingId,
                    consultation_type: row.consultation_type,
                    call_type: row.call_type,
                    duration_minutes: Number(row.duration_minutes || 30),
                    customer_name: row.customer_name,
                    astrologer_name: row.astrologer_name || "Shwetha",
                    started_at: row.started_at,
                });
            });
        });

        /* ---- LEAVE CONSULTATION ROOM ---- */
        socket.on("leave_consultation", (payload, ack) => {
            const room = socket.data.room || buildRoomId(Number(payload?.booking_id));
            if (room) {
                socket.to(room).emit("participant_left", {
                    user_id: user.id,
                    role: user.role,
                });
                socket.leave(room);
            }
            socket.data.room = null;
            socket.data.booking_id = null;
            ack && ack({ ok: true });
        });

        /* ---- WEBRTC SIGNALING ---- */
        socket.on("offer", (payload) => {
            const room = socket.data.room;
            if (!room) return;
            socket.to(room).emit("offer", { ...payload, from: user.id });
        });

        socket.on("answer", (payload) => {
            const room = socket.data.room;
            if (!room) return;
            socket.to(room).emit("answer", { ...payload, from: user.id });
        });

        socket.on("ice_candidate", (payload) => {
            const room = socket.data.room;
            if (!room) return;
            socket.to(room).emit("ice_candidate", { ...payload, from: user.id });
        });

        /* ---- CALL CONTROLS ---- */
        socket.on("toggle_camera", (payload) => {
            const room = socket.data.room;
            if (!room) return;
            socket.to(room).emit("peer_camera_changed", {
                user_id: user.id,
                enabled: Boolean(payload?.enabled),
            });
        });

        socket.on("toggle_mic", (payload) => {
            const room = socket.data.room;
            if (!room) return;
            socket.to(room).emit("peer_mic_changed", {
                user_id: user.id,
                muted: Boolean(payload?.muted),
            });
        });

        /* ---- RECONNECTION STATE ---- */
        socket.on("reconnecting", (payload) => {
            const room = socket.data.room;
            if (!room) return;
            socket.to(room).emit("peer_reconnecting", { user_id: user.id });
        });

        /* ---- CONSULTATION STARTED (reader) ---- */
        socket.on("consultation_started", (payload) => {
            const room = socket.data.room || buildRoomId(Number(payload?.booking_id));
            if (room) {
                io.to(room).emit("consultation_started", {
                    booking_id: payload?.booking_id,
                    started_at: new Date().toISOString(),
                });
            }
        });

        /* ---- CONSULTATION ENDED (any party) ----
           Emit to the room so both sides tear down WebRTC.
        */
        socket.on("call_ended", (payload) => {
            const room = socket.data.room || buildRoomId(Number(payload?.booking_id));
            if (room) {
                io.to(room).emit("call_ended", {
                    booking_id: payload?.booking_id,
                    reason: payload?.reason || "call ended",
                    ended_at: new Date().toISOString(),
                });
            }
        });

        /* ---- HEARTBEAT ---- */
        socket.on("heartbeat", (payload) => {
            const room = socket.data.room;
            if (room) {
                socket.to(room).emit("peer_heartbeat", { user_id: user.id });
            }
        });

        /* ---- DISCONNECT ---- */
        socket.on("disconnect", () => {
            const room = socket.data.room;
            if (room) {
                socket.to(room).emit("participant_left", {
                    user_id: user.id,
                    role: user.role,
                    reason: "disconnected",
                });
            }
            socket.data.room = null;
            socket.data.booking_id = null;
        });
    });

    return io;
}

module.exports = { initSocket };
