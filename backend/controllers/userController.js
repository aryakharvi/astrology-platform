const bcrypt = require("bcryptjs");
const db = require("../db");

/* =====================================================
   GET PROFILE
   GET /api/profile
   Auth required
===================================================== */
const getProfile = (req, res) => {
    const sql = `
    SELECT
      id,
      name,
      email,
      phone,
      role,
      profile_picture,
      date_of_birth,
      time_of_birth,
      place_of_birth,
      gender,
      created_at
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("Profile fetch error:", err.message);
            return res.status(500).json({ message: "Failed to load profile." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = results[0];

        res.json({
            message: "Profile loaded successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profile_picture: user.profile_picture,
                date_of_birth: toISODate(user.date_of_birth),
                time_of_birth: user.time_of_birth,
                place_of_birth: user.place_of_birth,
                gender: user.gender,
                created_at: user.created_at,
            },
        });
    });
};

/* =====================================================
   UPDATE PROFILE
   PUT /api/profile
   Auth required
   Editable fields: name, phone, profile_picture,
   date_of_birth, time_of_birth, place_of_birth, gender
===================================================== */
const updateProfile = (req, res) => {
    const {
        name,
        phone,
        profile_picture,
        date_of_birth,
        time_of_birth,
        place_of_birth,
        gender,
    } = req.body;

    const sql = `
    UPDATE users
    SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      profile_picture = COALESCE(?, profile_picture),
      date_of_birth = ?,
      time_of_birth = ?,
      place_of_birth = ?,
      gender = ?
    WHERE id = ?
  `;

    // Empty strings are treated as null so users can clear optional fields,
    // and MySQL doesn't reject "" for DATE columns.
    const toNullable = (v) => (v === "" ? null : v ?? null);

    const params = [
        toNullable(name),
        toNullable(phone),
        toNullable(profile_picture),
        toNullable(date_of_birth),
        toNullable(time_of_birth),
        toNullable(place_of_birth),
        toNullable(gender),
        req.user.id,
    ];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Profile update error:", err.message);
            return res.status(500).json({ message: "Failed to update profile." });
        }

        // Return the fresh profile
        getProfile(req, res);
    });
};

/* =====================================================
   CHANGE PASSWORD
   PUT /api/profile/password
   Auth required
   Requires current password + new password
===================================================== */
const changePassword = (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Current password and new password are required.",
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "New password must be at least 6 characters long.",
        });
    }

    const findSql = `
    SELECT id, password
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

    db.query(findSql, [req.user.id], async (err, results) => {
        if (err) {
            console.error("Password lookup error:", err.message);
            return res.status(500).json({ message: "Failed to change password." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        try {
            const passwordMatch = await bcrypt.compare(
                currentPassword,
                results[0].password
            );

            if (!passwordMatch) {
                return res.status(400).json({
                    message: "Current password is incorrect.",
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updateSql = `
        UPDATE users
        SET password = ?
        WHERE id = ?
      `;

            db.query(updateSql, [hashedPassword, req.user.id], (updateErr) => {
                if (updateErr) {
                    console.error("Password update error:", updateErr.message);
                    return res.status(500).json({ message: "Failed to change password." });
                }

                res.json({ message: "Password changed successfully." });
            });
        } catch (error) {
            console.error("Password change error:", error.message);
            res.status(500).json({ message: "Failed to change password." });
        }
    });
};

/* =====================================================
   HELPERS
===================================================== */

// MySQL DATE columns come back as "YYYY-MM-DD" strings thanks to
// dateStrings:true in db.js. This is a safety net for any Date objects.
function toISODate(value) {
    if (!value) return null;

    if (value instanceof Date) {
        const year = value.getUTCFullYear();
        const month = String(value.getUTCMonth() + 1).padStart(2, "0");
        const day = String(value.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    const str = String(value);
    return str.includes("T") ? str.split("T")[0] : str;
}

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
};
