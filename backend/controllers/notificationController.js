const db = require("../db");

/* =====================================================
   CREATE NOTIFICATION (shared helper)
   Used by controllers + socket handler to insert a
   notification row without creating duplicates for the
   same (user_id, type, booking-scoped message) event.
===================================================== */
function createNotification({ userId, type = "general", title = null, message }) {
    return new Promise((resolve, reject) => {
        // Idempotency: skip when an unread notification of the same type
        // and title already exists for this user (dedupes reminder loops).
        const dupSql = `
      SELECT id FROM notifications
      WHERE user_id = ? AND type = ? AND title = ? AND is_read = 0
      LIMIT 1
    `;

        db.query(dupSql, [userId, type, title], (dupErr, dupRows) => {
            if (dupErr) return reject(dupErr);

            if (dupRows.length > 0) {
                return resolve(dupRows[0].id);
            }

            const insertSql = `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, ?, ?, ?)
      `;

            db.query(insertSql, [userId, type, title, message], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    });
}

/* =====================================================
   GET MY NOTIFICATIONS
   GET /api/notifications
   Auth required
===================================================== */
const getMyNotifications = (req, res) => {
    const sql = `
    SELECT id, type, title, message, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("Notifications error:", err.message);
            return res.status(500).json({ message: "Failed to load notifications." });
        }

        const unread = results.filter((n) => Number(n.is_read) === 0).length;

        res.json({
            notifications: results.map((n) => ({
                ...n,
                is_read: Boolean(Number(n.is_read)),
            })),
            unread_count: unread,
        });
    });
};

/* =====================================================
   MARK NOTIFICATIONS READ
   PUT /api/notifications/read
   Auth required
   Body: { ids?: number[] } — omit to mark all as read
===================================================== */
const markNotificationsRead = (req, res) => {
    const { ids } = req.body;

    let sql;
    let params;

    if (Array.isArray(ids) && ids.length > 0) {
        sql = `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (?)`;
        params = [req.user.id, ids];
    } else {
        sql = `UPDATE notifications SET is_read = 1 WHERE user_id = ?`;
        params = [req.user.id];
    }

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Notifications read error:", err.message);
            return res.status(500).json({ message: "Failed to update notifications." });
        }

        res.json({ message: "Notifications marked as read." });
    });
};

module.exports = {
    createNotification,
    getMyNotifications,
    markNotificationsRead,
};
