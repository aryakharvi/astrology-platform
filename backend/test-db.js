const db = require("./db");

db.query("SELECT DATABASE() AS database_name", (err, results) => {
    if (err) {
        console.error("❌ Database test failed:", err.message);
        return;
    }

    console.log("✅ Connected to database:", results[0].database_name);
    db.end();
});