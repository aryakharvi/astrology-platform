/**
 * Consultation + Notifications tables migration for Shwetha Cosmic.
 *
 * Creates:
 *   - consultations      : one row per consultation (linked to a booking)
 *   - notifications      : in-app notifications for customers + Shwetha
 *
 * Also adds to `bookings`:
 *   - duration_minutes   : consultation length (default 30)
 *   - call_type          : 'video' | 'audio' (default 'video')
 *
 * Safe to run multiple times. Run: node setup-consultations.js
 */
const db = require("./db");

const CREATE_CONSULTATIONS = `
  CREATE TABLE IF NOT EXISTS consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    room_id VARCHAR(100) NOT NULL UNIQUE,
    consultation_type VARCHAR(100) NULL,
    call_type VARCHAR(10) NOT NULL DEFAULT 'video',
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    started_at DATETIME NULL,
    ended_at DATETIME NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_booking_consultation (booking_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const CREATE_NOTIFICATIONS = `
  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'general',
    title VARCHAR(200) NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

// Add booking columns (idempotent — "Duplicate column name" is fine)
const BOOKING_ALTERS = [
    "ALTER TABLE bookings ADD COLUMN duration_minutes INT NOT NULL DEFAULT 30 AFTER amount",
    "ALTER TABLE bookings ADD COLUMN call_type VARCHAR(10) NOT NULL DEFAULT 'video' AFTER duration_minutes",
];

function runAlters(index, done) {
    if (index >= BOOKING_ALTERS.length) {
        done();
        return;
    }

    db.query(BOOKING_ALTERS[index], (err) => {
        if (err && !err.message.includes("Duplicate column name")) {
            console.warn(`⚠️  ALTER skipped (${BOOKING_ALTERS[index].slice(0, 60)}...): ${err.message}`);
        } else {
            console.log(`✅ ${BOOKING_ALTERS[index].slice(0, 70)}`);
        }
        runAlters(index + 1, done);
    });
}

db.query(CREATE_CONSULTATIONS, (err) => {
    if (err) {
        console.error("❌ consultations failed:", err.message);
    } else {
        console.log("✅ consultations table ready");
    }

    db.query(CREATE_NOTIFICATIONS, (err2) => {
        if (err2) {
            console.error("❌ notifications failed:", err2.message);
        } else {
            console.log("✅ notifications table ready");
        }

        runAlters(0, () => {
            console.log("✅ Booking consultation columns ready");
            db.end();
        });
    });
});
