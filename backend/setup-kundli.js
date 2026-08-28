/**
 * Kundli table migration for Shwetha Cosmic.
 * Safe to run multiple times — adds missing columns to the existing
 * `kundli` table without touching existing rows.
 *
 *   - name        -> VARCHAR(100) — person's full name
 *   - kundli_data -> JSON — generated Kundli result (planets, houses, etc.)
 *   - index on user_id already exists via the original schema
 *
 * Run once (or any time): node setup-kundli.js
 */
const db = require("./db");

const ALTERS = [
    "ALTER TABLE kundli ADD COLUMN name VARCHAR(100) NULL AFTER user_id",
    "ALTER TABLE kundli ADD COLUMN kundli_data JSON NULL AFTER gender",
];

db.query("SELECT 1 FROM kundli LIMIT 1", (err) => {
    if (err) {
        console.error("❌ Kundli table not found:", err.message);
        db.end();
        return;
    }

    runAlters(0);
});

function runAlters(index) {
    if (index >= ALTERS.length) {
        console.log("✅ Kundli migration complete");
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
