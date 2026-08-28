import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

function Booking() {
  const [callType, setCallType] = useState("video");
  const [durationMinutes, setDurationMinutes] = useState(30);

  const [selectedService, setSelectedService] =
    useState("Personal Consultation");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [selectedAstrologer, setSelectedAstrologer] =
    useState(null);

  const [bookingId, setBookingId] = useState(null);

  const services = [
    "Personal Consultation",
    "Kundli Reading",
    "Love & Relationship",
    "Career & Finance",
    "Marriage & Compatibility",
  ];

  const times = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "6:00 PM",
    "7:00 PM",
  ];

  // Load astrologer chosen on the Astrologer page (if any)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("selectedAstrologer");
      if (saved) {
        const astro = JSON.parse(saved);
        setSelectedAstrologer(astro);

        // Default the consultation type to that astrologer's
        // specialization if it matches a service option
        if (astro?.specialization) {
          setSelectedService(astro.specialization);
        }
      }
    } catch (e) {
      console.error("Astrologer selection error:", e);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to confirm your booking.");
      window.location.href = "/login";
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          astrologer_id: selectedAstrologer?.id || null,
          service: selectedService,
          booking_date: selectedDate,
          booking_time: selectedTime,
          amount: selectedAstrologer?.price_per_minute || 0,
          call_type: callType,
          duration_minutes: durationMinutes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create booking");
      }

      setBookingId(data.bookingId || null);
      setSubmitted(true);

      // Clear the astrologer selection once booked
      localStorage.removeItem("selectedAstrologer");
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "Unable to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-page">

      {/* NAVBAR */}
      <nav className="navbar">

        <a href="/" className="logo">
          🌙 <span>Shwetha Cosmic</span>
        </a>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/astrologer">Astrologer</a>
          <a href="/booking">Booking</a>
          <a href="/login">Login</a>
        </div>

        <a href="/register">
          <button className="register-btn">
            Register
          </button>
        </a>

      </nav>

      {/* PAGE HEADER */}
      <section
        className="hero"
        style={{ minHeight: "55vh" }}
      >

        <div className="hero-content">

          <p className="eyebrow">
            ✦ SHWETHA COSMIC ✦
          </p>

          <h1>
            Book Your
            <br />
            <span>Consultation</span>
          </h1>

          <p className="hero-description">
            Choose your consultation type, preferred date
            and convenient time with Shwetha.
          </p>

        </div>

        <div className="hero-moon">
          📅
        </div>

      </section>

      {/* BOOKING SECTION */}
      <section>

        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >

          {submitted ? (

            /* SUCCESS */
            <div
              className="service-card"
              style={{
                textAlign: "center",
                padding: "60px 30px",
              }}
            >

              <div
                style={{
                  fontSize: "65px",
                  marginBottom: "20px",
                }}
              >
                ✨
              </div>

              <h2
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                  fontSize: "38px",
                  marginBottom: "18px",
                }}
              >
                Booking Confirmed ✨
              </h2>

              <p
                style={{
                  color: "#aaa3b2",
                  lineHeight: "1.8",
                  marginBottom: "30px",
                }}
              >
                Thank you for choosing Shwetha Cosmic.
                Your consultation has been booked successfully.
              </p>

              <div
                style={{
                  background: "#0c0716",
                  borderRadius: "15px",
                  padding: "25px",
                  marginBottom: "30px",
                }}
              >

                {bookingId && (
                  <p style={{ marginBottom: "10px" }}>
                    <strong>Booking ID:</strong>{" "}
                    #{bookingId}
                  </p>
                )}

                <p style={{ marginBottom: "10px" }}>
                  <strong>Service:</strong>{" "}
                  {selectedService}
                </p>

                <p style={{ marginBottom: "10px" }}>
                  <strong>Astrologer:</strong>{" "}
                  {selectedAstrologer?.name || "Shwetha Cosmic"}
                </p>

                <p style={{ marginBottom: "10px" }}>
                  <strong>Date:</strong>{" "}
                  {selectedDate}
                </p>

                <p>
                  <strong>Time:</strong>{" "}
                  {selectedTime}
                </p>

                <p style={{ marginBottom: "10px" }}>
                  <strong>Mode:</strong>{" "}
                  {callType === "audio" ? "🎙️ Audio Call" : "🎥 Video Call"}
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {durationMinutes} minutes
                </p>

              </div>

              <a
                href="/dashboard"
                className="primary-btn"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                View My Bookings
              </a>

              <button
                className="secondary-btn"
                onClick={() => {
                  setSubmitted(false);
                  setBookingId(null);
                }}
                style={{
                  marginLeft: "12px",
                }}
              >
                Make Another Booking
              </button>

            </div>

          ) : (

            /* BOOKING FORM */
            <form
              onSubmit={handleSubmit}
              className="service-card"
              style={{
                padding: "40px",
              }}
            >

              {/* SERVICE */}
              <div style={{ marginBottom: "30px" }}>

                <label
                  style={{
                    display: "block",
                    color: "#d9ad63",
                    marginBottom: "12px",
                    fontSize: "13px",
                    letterSpacing: "1px",
                  }}
                >
                  SELECT CONSULTATION
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >

                  {services.map((service) => (

                    <button
                      type="button"
                      key={service}
                      onClick={() =>
                        setSelectedService(service)
                      }
                      style={{
                        padding: "15px",
                        borderRadius: "10px",
                        border:
                          selectedService === service
                            ? "1px solid #d9ad63"
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          selectedService === service
                            ? "rgba(217,173,99,0.12)"
                            : "#130c20",
                        color:
                          selectedService === service
                            ? "#d9ad63"
                            : "#aaa3b2",
                        cursor: "pointer",
                      }}
                    >
                      {service}
                    </button>

                  ))}

                </div>

              </div>

              {/* CONSULTATION TYPE (Video / Audio) */}
              <div style={{ marginBottom: "30px" }}>

                <label
                  style={{
                    display: "block",
                    color: "#d9ad63",
                    marginBottom: "12px",
                    fontSize: "13px",
                    letterSpacing: "1px",
                  }}
                >
                  CONSULTATION MODE
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {[
                    { key: "video", icon: "🎥", label: "Video Call", desc: "Camera + mic" },
                    { key: "audio", icon: "🎙️", label: "Audio Call", desc: "Voice only" },
                  ].map((mode) => (
                    <button
                      type="button"
                      key={mode.key}
                      onClick={() => setCallType(mode.key)}
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        border:
                          callType === mode.key
                            ? "1px solid #d9ad63"
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          callType === mode.key
                            ? "rgba(217,173,99,0.12)"
                            : "#130c20",
                        color:
                          callType === mode.key
                            ? "#d9ad63"
                            : "#aaa3b2",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                        {mode.icon}
                      </div>
                      <strong style={{ display: "block", marginBottom: "4px" }}>
                        {mode.label}
                      </strong>
                      <small style={{ color: "#777080" }}>{mode.desc}</small>
                    </button>
                  ))}
                </div>

              </div>

              {/* DURATION */}
              <div style={{ marginBottom: "30px" }}>

                <label
                  style={{
                    display: "block",
                    color: "#d9ad63",
                    marginBottom: "12px",
                    fontSize: "13px",
                    letterSpacing: "1px",
                  }}
                >
                  DURATION
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {[15, 30, 45, 60].map((minutes) => (
                    <button
                      type="button"
                      key={minutes}
                      onClick={() => setDurationMinutes(minutes)}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border:
                          durationMinutes === minutes
                            ? "1px solid #d9ad63"
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          durationMinutes === minutes
                            ? "rgba(217,173,99,0.12)"
                            : "#130c20",
                        color:
                          durationMinutes === minutes
                            ? "#d9ad63"
                            : "#aaa3b2",
                        cursor: "pointer",
                      }}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>

              </div>

              {/* DATE */}
              <div style={{ marginBottom: "30px" }}>

                <label
                  htmlFor="date"
                  style={{
                    display: "block",
                    color: "#d9ad63",
                    marginBottom: "12px",
                    fontSize: "13px",
                    letterSpacing: "1px",
                  }}
                >
                  SELECT DATE
                </label>

                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(e.target.value)
                  }
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: "10px",
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    background: "#130c20",
                    color: "white",
                    outline: "none",
                  }}
                />

              </div>

              {/* TIME */}
              <div style={{ marginBottom: "30px" }}>

                <label
                  style={{
                    display: "block",
                    color: "#d9ad63",
                    marginBottom: "12px",
                    fontSize: "13px",
                    letterSpacing: "1px",
                  }}
                >
                  SELECT TIME
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: "10px",
                  }}
                >

                  {times.map((time) => (

                    <button
                      type="button"
                      key={time}
                      onClick={() =>
                        setSelectedTime(time)
                      }
                      style={{
                        padding: "13px",
                        borderRadius: "10px",
                        border:
                          selectedTime === time
                            ? "1px solid #d9ad63"
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          selectedTime === time
                            ? "rgba(217,173,99,0.12)"
                            : "#130c20",
                        color:
                          selectedTime === time
                            ? "#d9ad63"
                            : "#aaa3b2",
                        cursor: "pointer",
                      }}
                    >
                      {time}
                    </button>

                  ))}

                </div>

              </div>

              {/* USER DETAILS */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  marginBottom: "30px",
                }}
              >

                <div>

                  <label
                    htmlFor="name"
                    style={{
                      display: "block",
                      color: "#d9ad63",
                      marginBottom: "10px",
                      fontSize: "13px",
                    }}
                  >
                    YOUR NAME
                  </label>

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    required
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      background: "#130c20",
                      color: "white",
                      outline: "none",
                    }}
                  />

                </div>

                <div>

                  <label
                    htmlFor="phone"
                    style={{
                      display: "block",
                      color: "#d9ad63",
                      marginBottom: "10px",
                      fontSize: "13px",
                    }}
                  >
                    PHONE NUMBER
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    required
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      background: "#130c20",
                      color: "white",
                      outline: "none",
                    }}
                  />

                </div>

              </div>

              {/* MESSAGE */}
              <div style={{ marginBottom: "30px" }}>

                <label
                  htmlFor="message"
                  style={{
                    display: "block",
                    color: "#d9ad63",
                    marginBottom: "10px",
                    fontSize: "13px",
                  }}
                >
                  WHAT WOULD YOU LIKE TO ASK?
                </label>

                <textarea
                  id="message"
                  rows="5"
                  placeholder="Tell Shwetha what you would like guidance about..."
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: "10px",
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    background: "#130c20",
                    color: "white",
                    outline: "none",
                    resize: "vertical",
                  }}
                />

              </div>

              {/* ERROR */}
              {error && (
                <p
                  style={{
                    textAlign: "center",
                    color: "#ff8585",
                    fontSize: "13px",
                    marginBottom: "15px",
                  }}
                >
                  ⚠️ {error}
                </p>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                className="primary-btn"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "17px",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting
                  ? "Confirming..."
                  : "Confirm Booking ✦"}
              </button>

              <p
                style={{
                  textAlign: "center",
                  color: "#6f6977",
                  fontSize: "11px",
                  marginTop: "15px",
                }}
              >
                Payment will be added later.
              </p>

            </form>

          )}

        </div>

      </section>

      {/* FOOTER */}
      <footer>

        <div className="footer-logo">
          🌙 Shwetha Cosmic
        </div>

        <p>
          Astrology • Guidance • Destiny
        </p>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/astrologer">Astrologer</a>
          <a href="/booking">Booking</a>
        </div>

        <p className="copyright">
          © 2026 Shwetha Cosmic. All rights reserved.
        </p>

      </footer>

    </div>
  );
}

export default Booking;