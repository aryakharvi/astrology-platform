/**
 * User profile columns migration for Shwetha Cosmic.
 * Safe to run multiple times — adds missing columns to the `users` table.
 *
 *   - profile_picture -> VARCHAR(500) (URL or data URL)
 *   - date_of_birth   -> DATE
 *   - time_of_birth   -> VARCHAR(10)
 *   - place_of_birth  -> VARCHAR(150)
 *   - gender          -> VARCHAR(20)
 *
 * Run once (or any time): node setup-user-profile.js
 */
const db = require("./db");

const ALTERS = [
    "ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL AFTER phone",
    "ALTER TABLE users ADD COLUMN date_of_birth DATE NULL AFTER profile_picture",
    "ALTER TABLE users ADD COLUMN time_of_birth VARCHAR(10) NULL AFTER date_of_birth",
    "ALTER TABLE users ADD COLUMN place_of_birth VARCHAR(150) NULL AFTER time_of_birth",
    "ALTER TABLE users ADD COLUMN gender VARCHAR(20) NULL AFTER place_of_birth",
];

db.query("SELECT 1 FROM users LIMIT 1", (err) => {
    if (err) {
        console.error("❌ Users table not found:", err.message);
        db.end();
        return;
    }

    runAlters(0);
});

function runAlters(index) {
    if (index >= ALTERS.length) {
        console.log("✅ User profile migration complete");
        db.end();
        return;
    }

    db.query(ALTERS[index], (alterErr) => {
        if (alterErr) {
            // Duplicate column = already migrated, that's fine.
            if (!alterErr.message.includes("Duplicate column name")) {
                console.warn(`⚠️  ALTER skipped (${ALTERS[index].slice(0, 60)}...): ${alterErr.message}`);
            }
        } else {
            console.log(`✅ ${ALTERS[index].slice(0, 70)}`);
        }

        runAlters(index + 1);
    });
}
