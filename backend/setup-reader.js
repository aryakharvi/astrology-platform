/**
 * Reader dashboard tables migration for Shwetha Cosmic.
 * Creates tables that genuinely don't exist yet:
 *
 *   - reader_profile    : Shwetha's editable reader profile (one row per user)
 *   - reader_availability : Shwetha's consultation availability schedule
 *   - reviews           : customer reviews (only created from real bookings)
 *
 * Reuses the existing `bookings` table for all earnings/bookings stats —
 * no fake data, no duplicate booking tables.
 *
 * Safe to run multiple times. Run: node setup-reader.js
 */
const db = require("./db");

const CREATE_READER_PROFILE = `
  CREATE TABLE IF NOT EXISTS reader_profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    display_name VARCHAR(100) NULL,
    bio TEXT NULL,
    specialties VARCHAR(255) NULL,
    consultation_price DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    experience_years INT NULL,
    languages VARCHAR(255) NULL,
    contact_email VARCHAR(150) NULL,
    contact_phone VARCHAR(20) NULL,
    profile_image VARCHAR(500) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const CREATE_AVAILABILITY = `
  CREATE TABLE IF NOT EXISTS reader_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday ... 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    break_minutes INT NOT NULL DEFAULT 5,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_reader_day (user_id, day_of_week),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const CREATE_REVIEWS = `
  CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_booking_review (booking_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

db.query(CREATE_READER_PROFILE, (err) => {
    if (err) {
        console.error("❌ reader_profile failed:", err.message);
    } else {
        console.log("✅ reader_profile table ready");
    }

    db.query(CREATE_AVAILABILITY, (err2) => {
        if (err2) {
            console.error("❌ reader_availability failed:", err2.message);
        } else {
            console.log("✅ reader_availability table ready");
        }

        db.query(CREATE_REVIEWS, (err3) => {
            if (err3) {
                console.error("❌ reviews failed:", err3.message);
            } else {
                console.log("✅ reviews table ready");
            }

            db.end();
        });
    });
});
