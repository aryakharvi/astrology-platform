const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("./db");

const app = express();

const PORT = 5000;

const JWT_SECRET =
  "shwetha_cosmic_secret_key_2026";


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
      WHERE id = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [req.user.id],
      (err, results) => {

        if (err) {

          console.error(
            "Profile error:",
            err.message
          );

          return res.status(500).json({
            message:
              "Failed to load profile.",
          });
        }

        if (
          results.length === 0
        ) {
          return res.status(404).json({
            message:
              "User not found.",
          });
        }

        res.json({
          message:
            "Profile loaded successfully",

          user:
            results[0],
        });
      }
    );
  }
);


/* =====================================================
   SAVE KUNDLI
===================================================== */

app.post(
  "/api/kundli",

  authenticateToken,

  (req, res) => {

    const {
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
    } = req.body;

    if (
      !dateOfBirth ||
      !timeOfBirth ||
      !placeOfBirth ||
      !gender
    ) {
      return res.status(400).json({
        message:
          "All Kundli fields are required.",
      });
    }

    const checkSql = `
      SELECT id
      FROM kundli
      WHERE user_id = ?
      LIMIT 1
    `;

    db.query(
      checkSql,
      [req.user.id],
      (checkErr, existing) => {

        if (checkErr) {

          console.error(
            "Kundli check error:",
            checkErr.message
          );

          return res.status(500).json({
            message:
              "Failed to check Kundli.",
          });
        }


        /* ============================
           UPDATE
        ============================ */

        if (
          existing.length > 0
        ) {

          const updateSql = `
            UPDATE kundli
            SET
              date_of_birth = ?,
              time_of_birth = ?,
              place_of_birth = ?,
              gender = ?
            WHERE user_id = ?
          `;

          db.query(
            updateSql,

            [
              dateOfBirth,
              timeOfBirth,
              placeOfBirth,
              gender,
              req.user.id,
            ],

            (err) => {

              if (err) {

                console.error(
                  "Kundli update error:",
                  err.message
                );

                return res.status(500).json({
                  message:
                    "Failed to update Kundli.",
                });
              }

              res.json({
                message:
                  "Kundli updated successfully!",
              });
            }
          );

        } else {

          /* ============================
             INSERT
          ============================ */

          const insertSql = `
            INSERT INTO kundli
            (
              user_id,
              date_of_birth,
              time_of_birth,
              place_of_birth,
              gender
            )
            VALUES (?, ?, ?, ?, ?)
          `;

          db.query(
            insertSql,

            [
              req.user.id,
              dateOfBirth,
              timeOfBirth,
              placeOfBirth,
              gender,
            ],

            (err, result) => {

              if (err) {

                console.error(
                  "Kundli insert error:",
                  err.message
                );

                return res.status(500).json({
                  message:
                    "Failed to save Kundli.",
                });
              }

              res.status(201).json({

                message:
                  "Kundli saved successfully!",

                kundliId:
                  result.insertId,

              });
            }
          );
        }
      }
    );
  }
);


/* =====================================================
   GET KUNDLI
===================================================== */

app.get(
  "/api/kundli",

  authenticateToken,

  (req, res) => {

    const sql = `
      SELECT
        id,
        user_id,
        date_of_birth,
        time_of_birth,
        place_of_birth,
        gender,
        created_at
      FROM kundli
      WHERE user_id = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [req.user.id],
      (err, results) => {

        if (err) {

          console.error(
            "Kundli fetch error:",
            err.message
          );

          return res.status(500).json({
            message:
              "Failed to load Kundli.",
          });
        }

        if (
          results.length === 0
        ) {

          return res.json({
            message:
              "No Kundli found",

            kundli:
              null,
          });
        }

        res.json({

          message:
            "Kundli loaded successfully",

          kundli:
            results[0],
        });
      }
    );
  }
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
   START SERVER
===================================================== */

app.listen(
  PORT,
  () => {

    console.log(
      `MySQL API server running on http://localhost:${PORT}`
    );

  }
);