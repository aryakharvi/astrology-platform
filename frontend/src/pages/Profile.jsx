import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

/* =====================================================
   PROFILE PAGE
   Displays + edits the logged-in user's profile.
   Also supports changing the password.
===================================================== */
const Profile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");

  // Password form
  const [showPassword, setShowPassword] = useState(false);
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passSaving, setPassSaving] = useState(false);
  const [passMessage, setPassMessage] = useState("");
  const [passError, setPassError] = useState("");

  /* ================= LOAD PROFILE ================= */

  useEffect(() => {
    loadProfile();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const loadProfile = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load profile");
      }

      setProfile(data.user);

      // Prefill the edit form
      setForm({
        name: data.user.name || "",
        phone: data.user.phone || "",
        date_of_birth: data.user.date_of_birth || "",
        time_of_birth: data.user.time_of_birth || "",
        place_of_birth: data.user.place_of_birth || "",
        gender: data.user.gender || "",
      });
    } catch (err) {
      console.error("Profile load error:", err);
      setError(err.message);

      if (
        err.message.toLowerCase().includes("token") ||
        err.message.toLowerCase().includes("access denied") ||
        err.message.toLowerCase().includes("unauthorized")
      ) {
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT FORM ================= */

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = getToken();

      const response = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setProfile(data.user);

      // Update localStorage user so other pages see fresh data
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, ...data.user })
        );
      } catch (ignore) {
        // ignore localStorage sync errors
      }

      setEditing(false);
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err.message || "Failed to update profile");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");

    // Restore form from current profile
    setForm({
      name: profile?.name || "",
      phone: profile?.phone || "",
      date_of_birth: profile?.date_of_birth || "",
      time_of_birth: profile?.time_of_birth || "",
      place_of_birth: profile?.place_of_birth || "",
      gender: profile?.gender || "",
      profile_picture: profile?.profile_picture || "",
    });
  };

  /* ================= PROFILE PICTURE ================= */

  const handlePictureSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept images, max ~1MB to keep the data URL reasonable
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Image must be smaller than 1MB.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, profile_picture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  /* ================= CHANGE PASSWORD ================= */

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage("");
    setPassError("");

    // Validation
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) {
      setPassError("Please fill in all password fields.");
      return;
    }

    if (passForm.newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    setPassSaving(true);

    try {
      const token = getToken();

      const response = await fetch(`${API_BASE}/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setPassForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPassMessage("✅ Password changed successfully! Please login again.");
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }, 2500);
    } catch (err) {
      console.error("Password change error:", err);
      setPassError(err.message || "Failed to change password");
    } finally {
      setPassSaving(false);
    }
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: "center" }}>
          <div style={styles.loadingIcon}>🌙</div>
          <h2 style={styles.loadingTitle}>Loading your profile...</h2>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: "center" }}>
          <h2 style={styles.loadingTitle}>🔐 Please Login</h2>
          <p style={styles.loadingSub}>Your login session was not found.</p>
          <button onClick={() => navigate("/login")} style={styles.primaryBtn}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ================= HEADER ================= */}
      <header style={styles.header}>
        <a href="/" style={styles.logoLink}>
          🌙 <span style={styles.logoGold}>Shwetha Cosmic</span>
        </a>

        <div style={styles.headerRight}>
          <button onClick={() => navigate("/dashboard")} style={styles.dashboardBtn}>
            ← Dashboard
          </button>
          <button onClick={logout} style={styles.logoutBtn}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main style={styles.main}>
        {/* Avatar + Name */}
        <div style={styles.avatarBlock}>
          <div style={styles.avatar}>
            {(editing ? form.profile_picture : profile.profile_picture) ? (
              <img
                src={editing ? form.profile_picture : profile.profile_picture}
                alt="Profile"
                style={styles.avatarImg}
              />
            ) : (
              "👤"
            )}
          </div>
          <h1 style={styles.name}>
            {(editing ? form.name : profile.name) || "User"}
          </h1>
          <p style={styles.email}>{profile.email}</p>

          <span style={styles.roleBadge}>
            {profile.role === "admin" ? "👑 Admin" : "Member"}
          </span>

          {editing && (
            <div style={styles.picturePicker}>
              <label style={styles.pictureLabel}>
                📷 {form.profile_picture ? "Change Picture" : "Add Picture"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureSelect}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Flash message */}
        {message && <div style={styles.success}> {message}</div>}
        {error && !editing && <div style={styles.error}>⚠️ {error}</div>}

        {/* ================= PROFILE CARD ================= */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>👤 Profile Information</h2>

            {!editing && (
              <button
                onClick={() => {
                  setEditing(true);
                  setError("");
                }}
                style={styles.editBtn}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            /* ===== EDIT FORM ===== */
            <form onSubmit={handleSave}>
              <div style={styles.formGrid}>
                <Field
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleEditChange}
                  placeholder="Enter your full name"
                  required
                />

                <Field
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleEditChange}
                  placeholder="Enter your phone number"
                  type="tel"
                />

                <Field
                  label="Date of Birth"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleEditChange}
                  type="date"
                />

                <Field
                  label="Time of Birth"
                  name="time_of_birth"
                  value={form.time_of_birth}
                  onChange={handleEditChange}
                  type="time"
                />

                <Field
                  label="Place of Birth"
                  name="place_of_birth"
                  value={form.place_of_birth}
                  onChange={handleEditChange}
                  placeholder="e.g. Mumbai, India"
                />

                <div>
                  <label style={styles.fieldLabel}>Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleEditChange}
                    style={styles.select}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Read-only email note */}
              <p style={styles.readOnlyNote}>
                📧 Email cannot be changed:{" "}
                <strong>{profile.email}</strong>
              </p>

              {/* Action buttons */}
              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...styles.saveBtn,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            /* ===== VIEW MODE ===== */
            <div>
              <ProfileRow label="Full Name" value={profile.name || "—"} />
              <ProfileRow label="Email" value={profile.email || "—"} />
              <ProfileRow label="Phone" value={profile.phone || "—"} />
              <ProfileRow
                label="Date of Birth"
                value={formatDisplayDate(profile.date_of_birth)}
              />
              <ProfileRow label="Time of Birth" value={profile.time_of_birth || "—"} />
              <ProfileRow label="Place of Birth" value={profile.place_of_birth || "—"} />
              <ProfileRow
                label="Gender"
                value={formatGender(profile.gender)}
                last
              />
            </div>
          )}
        </div>

        {/* ================= CHANGE PASSWORD CARD ================= */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>🔒 Change Password</h2>
          </div>

          {passMessage && <div style={styles.success}>{passMessage}</div>}
          {passError && <div style={styles.error}>⚠️ {passError}</div>}

          <form onSubmit={handleChangePassword}>
            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={passForm.currentPassword}
              onChange={handlePassChange}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />

            <PasswordField
              label="New Password"
              name="newPassword"
              value={passForm.newPassword}
              onChange={handlePassChange}
              show={showPassword}
            />

            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
              value={passForm.confirmPassword}
              onChange={handlePassChange}
              show={showPassword}
            />

            <button
              type="submit"
              disabled={passSaving}
              style={{
                ...styles.changePassBtn,
                opacity: passSaving ? 0.7 : 1,
              }}
            >
              {passSaving ? "Updating..." : "🔑 Change Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

/* =====================================================
   SUB-COMPONENTS
===================================================== */

function Field({ label, name, value, onChange, placeholder, type = "text", required }) {
  return (
    <div>
      <label style={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={styles.input}
      />
    </div>
  );
}

function PasswordField({ label, name, value, onChange, show, onToggle }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={styles.fieldLabel}>{label}</label>
      <div style={styles.passwordWrap}>
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          style={styles.passwordInput}
          autoComplete="off"
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            style={styles.eyeBtn}
            aria-label="Toggle password visibility"
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ label, value, last }) {
  return (
    <div
      style={{
        padding: "15px 0",
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <p style={styles.rowLabel}>{label}</p>
      <p style={styles.rowValue}>{value}</p>
    </div>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function formatDisplayDate(value) {
  if (!value) return "—";
  const str = String(value);
  const datePart = str.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return str;

  const [y, m, d] = datePart.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return str;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatGender(value) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* =====================================================
   STYLES (Shwetha Cosmic theme)
===================================================== */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #241442 0%, #0b0614 45%, #05030a 100%)",
    color: "#fff",
    fontFamily: "Arial, Helvetica, sans-serif",
    paddingBottom: "60px",
  },

  header: {
    height: "75px",
    padding: "0 7%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(5,3,10,0.9)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  logoLink: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "600",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  logoGold: { color: "#d9ad63" },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  dashboardBtn: {
    padding: "9px 15px",
    borderRadius: "8px",
    border: "1px solid rgba(217,173,99,0.5)",
    background: "transparent",
    color: "#d9ad63",
    cursor: "pointer",
    fontSize: "13px",
  },

  logoutBtn: {
    padding: "9px 15px",
    borderRadius: "8px",
    border: "1px solid rgba(255,80,80,0.4)",
    background: "rgba(255,80,80,0.1)",
    color: "#ff8585",
    cursor: "pointer",
    fontSize: "13px",
  },

  main: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "50px 25px 20px",
  },

  avatarBlock: {
    textAlign: "center",
    marginBottom: "35px",
  },

  avatar: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    background: "rgba(217,173,99,0.12)",
    border: "2px solid rgba(217,173,99,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    margin: "0 auto 18px",
    overflow: "hidden",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  name: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: "500",
    fontSize: "34px",
    margin: "0 0 6px",
  },

  email: {
    color: "#91889c",
    margin: "0 0 12px",
  },

  roleBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "20px",
    background: "rgba(217,173,99,0.12)",
    border: "1px solid rgba(217,173,99,0.3)",
    color: "#d9ad63",
    fontSize: "12px",
    fontWeight: "600",
  },

  picturePicker: {
    marginTop: "15px",
  },

  pictureLabel: {
    display: "inline-block",
    padding: "10px 18px",
    borderRadius: "25px",
    border: "1px solid rgba(217,173,99,0.4)",
    background: "rgba(217,173,99,0.08)",
    color: "#d9ad63",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  success: {
    padding: "14px 16px",
    marginBottom: "20px",
    borderRadius: "10px",
    background: "rgba(101,230,165,0.1)",
    border: "1px solid rgba(101,230,165,0.25)",
    color: "#65e6a5",
    fontSize: "13px",
  },

  error: {
    padding: "14px 16px",
    marginBottom: "20px",
    borderRadius: "10px",
    background: "rgba(255,80,80,0.1)",
    border: "1px solid rgba(255,80,80,0.25)",
    color: "#ff8585",
    fontSize: "13px",
  },

  card: {
    background: "rgba(20,12,32,0.85)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "28px",
    marginBottom: "25px",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "10px",
  },

  cardTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "22px",
    fontWeight: "500",
    margin: 0,
  },

  editBtn: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(217,173,99,0.4)",
    background: "rgba(217,173,99,0.1)",
    color: "#d9ad63",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },

  fieldLabel: {
    display: "block",
    color: "#d9ad63",
    fontSize: "11px",
    letterSpacing: "1px",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0b0613",
    color: "#fff",
    outline: "none",
    fontSize: "14px",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0b0613",
    color: "#fff",
    outline: "none",
    fontSize: "14px",
    cursor: "pointer",
  },

  readOnlyNote: {
    marginTop: "20px",
    color: "#91889c",
    fontSize: "13px",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },

  cancelBtn: {
    padding: "12px 20px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "#91889c",
    fontSize: "14px",
    cursor: "pointer",
  },

  saveBtn: {
    padding: "12px 22px",
    borderRadius: "9px",
    border: "none",
    background: "linear-gradient(135deg, #d9ad63, #b8893f)",
    color: "#0b0614",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },

  changePassBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "8px",
    borderRadius: "9px",
    border: "none",
    background: "linear-gradient(135deg, #d9ad63, #b8893f)",
    color: "#0b0614",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },

  passwordWrap: {
    position: "relative",
  },

  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    paddingRight: "48px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0b0613",
    color: "#fff",
    outline: "none",
    fontSize: "14px",
  },

  eyeBtn: {
    position: "absolute",
    right: "6px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    padding: "6px",
  },

  rowLabel: {
    margin: "0 0 5px",
    color: "#d9ad63",
    fontSize: "12px",
    letterSpacing: "0.5px",
  },

  rowValue: {
    margin: 0,
    color: "#eee",
    fontSize: "15px",
    wordBreak: "break-word",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b0614",
    color: "#fff",
    fontFamily: "Arial, Helvetica, sans-serif",
    padding: "20px",
  },

  loadingIcon: {
    fontSize: "55px",
    marginBottom: "15px",
  },

  loadingTitle: {
    color: "#d9ad63",
    fontWeight: "500",
    margin: "0 0 10px",
  },

  loadingSub: {
    color: "#91889c",
    marginBottom: "20px",
  },

  primaryBtn: {
    padding: "12px 24px",
    borderRadius: "9px",
    border: "none",
    background: "linear-gradient(135deg, #d9ad63, #b8893f)",
    color: "#0b0614",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },
};

export default Profile;
