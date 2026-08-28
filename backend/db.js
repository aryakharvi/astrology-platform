require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "astrology_platform",
    // Return DATE/DATETIME/TIMESTAMP columns as plain strings instead of
    // JS Date objects. This avoids timezone shifts (e.g. a user picking
    // 2026-10-01 being stored/returned as 2026-09-30T18:30:00.000Z).
    dateStrings: true
});

db.connect((err) => {
    if (err) {
        console.error("❌ MySQL connection failed:", err.message);
        return;
    }

    console.log("✅ MySQL connected successfully!");
});

module.exports = db;