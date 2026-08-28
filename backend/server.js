require("dotenv").config();

const express = require("express");
const http = require("http");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("./db");

const {
  createBooking,
  getMyBookings,
  cancelBooking,
  rescheduleBooking,
  addReview,
} = require("./controllers/bookingController");

const {
  getProfile,
  updateProfile,
  changePassword,
} = require("./controllers/userController");

const {
  generateKundli,
  saveKundli,
  getMyKundlis,
  getKundliById,
  deleteKundli,
} = require("./controllers/kundliController");

const {
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
} = require("./controllers/readerController");

const {
  getConsultation,
  startConsultation,
  joinConsultation,
  endConsultation,
  heartbeatConsultation,
} = require("./controllers/consultationController");

const {
  getMyNotifications,
  markNotificationsRead,
} = require("./controllers/notificationController");

const { initSocket } = require("./socket");

const app = express();

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET || "shwetha_cosmic_secret_key_2026";


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {
  res.json({
    message:
      "Astrology Platform Backend is running!",
  });
});


/* =====================================================
   JWT AUTHENTICATION
===================================================== */

function authenticateToken(req, res, next) {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message:
        "Access denied. No token provided.",
    });
  }

  const parts =
    authHeader.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {
    return res.status(401).json({
      message:
        "Access denied. Invalid token format.",
    });
  }

  const token = parts[1];

  try {

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();

  } catch (error) {

    console.error(
      "JWT error:",
      error.message
    );

    return res.status(401).json({
      message:
        "Access denied. Invalid or expired token.",
    });
  }
}


/* =====================================================
   ADMIN AUTHENTICATION
===================================================== */

function requireAdmin(
  req,
  res,
  next
) {

  if (!req.user) {
    return res.status(401).json({
      message:
        "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message:
        "Admin access required.",
    });
  }

  next();
}


/* =====================================================
   REGISTER
===================================================== */

app.post(
  "/api/register",
  async (req, res) => {

    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required.",
      });
    }

    try {

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const sql = `
        INSERT INTO users
        (
          name,
          email,
          password,
          phone
        )
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          name,
          email.trim(),
          hashedPassword,
          phone || null,
        ],
        (err, result) => {

          if (
            err &&
            err.code ===
            "ER_DUP_ENTRY"
          ) {
            return res.status(409).json({
              message:
                "Email already registered.",
            });
          }

          if (err) {

            console.error(
              "Registration error:",
              err.message
            );

            return res.status(500).json({
              message:
                "Registration failed.",
            });
          }

          res.status(201).json({
            message:
              "User registered successfully!",
            userId:
              result.insertId,
          });
        }
      );

    } catch (error) {

      console.error(
        "Server error:",
        error.message
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);


/* =====================================================
   LOGIN
===================================================== */

app.post(
  "/api/login",
  (req, res) => {

    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Email and password are required.",
      });
    }

    const sql = `
      SELECT
        id,
        name,
        email,
        password,
        phone,
        role
      FROM users
      WHERE email = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [email.trim()],
      async (
        err,
        results
      ) => {

        if (err) {

          console.error(
            "Login database error:",
            err.message
          );

          return res.status(500).json({
            message:
              "Database error.",
          });
        }

        if (
          results.length === 0
        ) {
          return res.status(401).json({
            message:
              "Invalid email or password.",
          });
        }

        const user =
          results[0];

        try {

          const passwordMatch =
            await bcrypt.compare(
              password,
              user.password
            );

          if (!passwordMatch) {

            return res.status(401).json({
              message:
                "Invalid email or password.",
            });
          }


          /* ============================
             CREATE JWT
          ============================ */

          const token =
            jwt.sign(
              {
                id: user.id,
                email: user.email,
                role: user.role,
              },

              JWT_SECRET,

              {
                expiresIn: "7d",
              }
            );


          /* ============================
             SEND USER + TOKEN
          ============================ */

          res.json({

            message:
              "Login successful!",

            token: token,

            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
            },

          });

        } catch (error) {

          console.error(
            "Login error:",
            error.message
          );

          res.status(500).json({
            message:
              "Login failed.",
          });
        }
      }
    );
  }
);


/* =====================================================
   GET ALL USERS
   ADMIN ONLY
===================================================== */

app.get(
  "/api/users",

  authenticateToken,

  requireAdmin,

  (req, res) => {

    const sql = `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        created_at
      FROM users
      ORDER BY id DESC
    `;

    db.query(
      sql,
      (err, results) => {

        if (err) {

          console.error(
            "Users error:",
            err.message
          );

          return res.status(500).json({
            message:
              "Database error.",
          });
        }

        res.json(results);
      }
    );
  }
);


/* =====================================================
   PROTECTED TEST
===================================================== */

app.get(
  "/api/protected",

  authenticateToken,

  (req, res) => {

    res.json({
      message:
        "You have access to the protected route!",

      user:
        req.user,
    });
  }
);


/* =====================================================
   PROFILE
===================================================== */

app.get(
  "/api/profile",

  authenticateToken,

  getProfile
);

// Update profile (name, phone, birth details, picture)
app.put(
  "/api/profile",

  authenticateToken,

  updateProfile
);

// Change password
app.put(
  "/api/profile/password",

  authenticateToken,

  changePassword
);


/* =====================================================
   SAVE KUNDLI
===================================================== */

// Generate Kundli (calculate only, not saved)
app.post(
  "/api/kundli/generate",

  authenticateToken,

  generateKundli
);

// Save Kundli (belongs to logged-in user)
app.post(
  "/api/kundli",

  authenticateToken,

  saveKundli
);

// Get my Kundlis (list)
app.get(
  "/api/kundli",

  authenticateToken,

  getMyKundlis
);

// Get one of my Kundlis (ownership-checked)
app.get(
  "/api/kundli/:id",

  authenticateToken,

  getKundliById
);

// Delete one of my Kundlis (ownership-checked)
app.delete(
  "/api/kundli/:id",

  authenticateToken,

  deleteKundli
);


/* =====================================================
   GET ALL ASTROLOGERS
===================================================== */

app.get(
  "/api/astrologers",

  (req, res) => {

    const sql = `
      SELECT
        id,
        name,
        specialization,
        experience,
        rating,
        price_per_minute,
        languages,
        bio,
        image,
        is_online,
        created_at
      FROM astrologers
      ORDER BY rating DESC
    `;

    db.query(
      sql,
      (err, results) => {

        if (err) {

          console.error(
            "Astrologer fetch error:",
            err.message
          );

          return res.status(500).json({
            message:
              "Failed to load astrologers.",
          });
        }

        res.json({
          message:
            "Astrologers loaded successfully",

          astrologers:
            results,
        });
      }
    );
  }
);


/* =====================================================
   GET SINGLE ASTROLOGER
===================================================== */

app.get(
  "/api/astrologers/:id",

  (req, res) => {

    const astrologerId =
      req.params.id;

    const sql = `
      SELECT
        id,
        name,
        specialization,
        experience,
        rating,
        price_per_minute,
        languages,
        bio,
        image,
        is_online,
        created_at
      FROM astrologers
      WHERE id = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [astrologerId],
      (err, results) => {

        if (err) {

          console.error(
            "Astrologer fetch error:",
            err.message
          );

          return res.status(500).json({
            message:
              "Failed to load astrologer.",
          });
        }

        if (
          results.length === 0
        ) {

          return res.status(404).json({
            message:
              "Astrologer not found.",
          });
        }

        res.json({

          message:
            "Astrologer loaded successfully",

          astrologer:
            results[0],
        });
      }
    );
  }
);


/* =====================================================
   BOOKINGS
===================================================== */

// Create a booking (auth required)
app.post(
  "/api/bookings",
  authenticateToken,
  createBooking
);

// Get my bookings (auth required)
app.get(
  "/api/bookings",
  authenticateToken,
  getMyBookings
);

// Cancel a booking (auth required)
app.put(
  "/api/bookings/:id/cancel",
  authenticateToken,
  cancelBooking
);

// Reschedule a booking (auth required)
app.put(
  "/api/bookings/:id/reschedule",
  authenticateToken,
  rescheduleBooking
);

// Review a completed booking (auth required, owner only)
app.post(
  "/api/bookings/:id/review",
  authenticateToken,
  addReview
);


/* =====================================================
   CONSULTATIONS (real-time audio/video)
   All routes behind authenticateToken.
   Ownership + eligibility verified in the controller
   (booking status, payment, reader assignment).
===================================================== */

// Get consultation context for a booking (owner or Shwetha)
app.get(
  "/api/consultations/:bookingId",
  authenticateToken,
  getConsultation
);

// Start consultation (Shwetha only)
app.post(
  "/api/consultations/:bookingId/start",
  authenticateToken,
  startConsultation
);

// Join consultation (customer owner or Shwetha)
app.post(
  "/api/consultations/:bookingId/join",
  authenticateToken,
  joinConsultation
);

// End consultation (customer owner or Shwetha)
app.post(
  "/api/consultations/:bookingId/end",
  authenticateToken,
  endConsultation
);

// Heartbeat (keeps session alive / detects reconnect)
app.post(
  "/api/consultations/:bookingId/heartbeat",
  authenticateToken,
  heartbeatConsultation
);


/* =====================================================
   NOTIFICATIONS
===================================================== */

// Get my notifications
app.get(
  "/api/notifications",
  authenticateToken,
  getMyNotifications
);

// Mark notifications read
app.put(
  "/api/notifications/read",
  authenticateToken,
  markNotificationsRead
);


/* =====================================================
   READER DASHBOARD API (Shwetha only)
   All routes behind authenticateToken + requireReader
===================================================== */

// Stats / overview
app.get(
  "/api/reader/stats",
  authenticateToken,
  requireReader,
  getStats
);

// All bookings (optional ?status=)
app.get(
  "/api/reader/bookings",
  authenticateToken,
  requireReader,
  getReaderBookings
);

// Update booking status (accept / reject / complete / cancel)
app.put(
  "/api/reader/bookings/:id/status",
  authenticateToken,
  requireReader,
  updateBookingStatus
);

// Reader profile
app.get(
  "/api/reader/profile",
  authenticateToken,
  requireReader,
  getReaderProfile
);

app.put(
  "/api/reader/profile",
  authenticateToken,
  requireReader,
  updateReaderProfile
);

// Customers
app.get(
  "/api/reader/customers",
  authenticateToken,
  requireReader,
  getCustomers
);

app.get(
  "/api/reader/customers/:id",
  authenticateToken,
  requireReader,
  getCustomerDetail
);

// Availability
app.get(
  "/api/reader/availability",
  authenticateToken,
  requireReader,
  getAvailability
);

app.put(
  "/api/reader/availability",
  authenticateToken,
  requireReader,
  saveAvailability
);

// Earnings
app.get(
  "/api/reader/earnings",
  authenticateToken,
  requireReader,
  getEarnings
);

// Reviews
app.get(
  "/api/reader/reviews",
  authenticateToken,
  requireReader,
  getReviews
);


/* =====================================================
   404
===================================================== */

app.use(
  (req, res) => {

    res.status(404).json({
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);


/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(
  (err, req, res, next) => {

    console.error(
      "Server error:",
      err.message
    );

    res.status(500).json({
      message:
        "Internal server error.",
    });
  }
);


/* =====================================================
   START SERVER (HTTP + Socket.IO)
===================================================== */

const httpServer = http.createServer(app);

// Attach JWT-authenticated Socket.IO signaling
initSocket(httpServer);

httpServer.listen(
  PORT,
  () => {

    console.log(
      `MySQL API server running on http://localhost:${PORT}`
    );

    console.log(
      `Socket.IO signaling ready on ws://localhost:${PORT}`
    );

  }
);