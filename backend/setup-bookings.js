/**
 * Booking table migration for Shwetha Cosmic.
 * Safe to run multiple times — it aligns the existing (or new) `bookings`
 * table with the schema the API expects:
 *
 *   - astrologer_id  -> nullable
 *   - booking_time   -> VARCHAR(20) (holds "10:00 AM" style values)
 *   - consultation_type -> varchar(100)
 *   - status         -> varchar(30) default 'upcoming'
 *   - payment_status -> added, default 'pending'
 *   - updated_at     -> added
 *
 * Run once (or any time): node setup-bookings.js
 */
const db = require("./db");

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    astrologer_id INT NULL,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL,
    consultation_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'upcoming',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const ALTERS = [
  // Make astrologer_id optional
  "ALTER TABLE bookings MODIFY astrologer_id INT NULL",

  // booking_time needs to hold values like "10:00 AM"
  "ALTER TABLE bookings MODIFY booking_time VARCHAR(20) NOT NULL",

  // consultation_type should fit all service names
  "ALTER TABLE bookings MODIFY consultation_type VARCHAR(100) NOT NULL",

  // status defaults to 'upcoming' for new bookings
  "ALTER TABLE bookings MODIFY status VARCHAR(30) NOT NULL DEFAULT 'upcoming'",

  // payment status column (idempotent: fails silently if it already exists)
  "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' AFTER status",

  // updated_at column
  "ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
];

db.query(CREATE_TABLE, (err) => {
  if (err) {
    console.error("❌ Failed to create bookings table:", err.message);
    db.end();
    return;
  }

  console.log("✅ Bookings table exists");

  runAlters(0);
});

function runAlters(index) {
  if (index >= ALTERS.length) {
    console.log("✅ Booking table migration complete");
    db.end();
    return;
  }

  db.query(ALTERS[index], (alterErr) => {
    if (alterErr) {
      // "Duplicate column name" / "check that column/key exists" are fine —
      // the column/constraint is already in the desired state.
      if (
        !alterErr.message.includes("Duplicate column name") &&
        !alterErr.message.includes("Unknown column")
      ) {
        console.warn(`⚠️  ALTER skipped (${ALTERS[index].slice(0, 60)}...): ${alterErr.message}`);
      }
    } else {
      console.log(`✅ ${ALTERS[index].slice(0, 70)}`);
    }

    runAlters(index + 1);
  });
}
