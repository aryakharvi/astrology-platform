import { useState } from "react";

function Booking() {
  const [selectedService, setSelectedService] =
    useState("Personal Consultation");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time.");
      return;
    }

    setSubmitted(true);
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
                Booking Request Received
              </h2>

              <p
                style={{
                  color: "#aaa3b2",
                  lineHeight: "1.8",
                  marginBottom: "30px",
                }}
              >
                Thank you for choosing Shwetha Cosmic.
                Your consultation request has been recorded.
              </p>

              <div
                style={{
                  background: "#0c0716",
                  borderRadius: "15px",
                  padding: "25px",
                  marginBottom: "30px",
                }}
              >

                <p style={{ marginBottom: "10px" }}>
                  <strong>Service:</strong>{" "}
                  {selectedService}
                </p>

                <p style={{ marginBottom: "10px" }}>
                  <strong>Date:</strong>{" "}
                  {selectedDate}
                </p>

                <p>
                  <strong>Time:</strong>{" "}
                  {selectedTime}
                </p>

              </div>

              <button
                className="primary-btn"
                onClick={() => setSubmitted(false)}
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

              {/* SUBMIT */}
              <button
                type="submit"
                className="primary-btn"
                style={{
                  width: "100%",
                  padding: "17px",
                }}
              >
                Confirm Booking ✦
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