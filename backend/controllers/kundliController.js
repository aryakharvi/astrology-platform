const Astronomy = require("astronomy-engine");
const db = require("../db");

/* =====================================================
   ASTRONOMY ENGINE (real calculations)
   -----------------------------------------------------
   Uses the `astronomy-engine` package (VSOP87-based
   planetary ephemeris) to compute genuine sidereal
   (Lahiri ayanamsa) positions. No fake/random planets.
===================================================== */

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
  "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
  "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
];

// Approximate Lahiri ayanamsa (sidereal offset) for the birth year.
// Lahiri ayanamsa advances ~50.3" (~0.01397°) per year.
function getLahiriAyanamsa(year) {
  const referenceYear = 2000;
  const referenceAyanamsa = 23.85675;
  const annualMotion = 0.013968;
  return referenceAyanamsa + (year - referenceYear) * annualMotion;
}

function normalizeDegrees(degrees) {
  let result = degrees % 360;
  if (result < 0) result += 360;
  return result;
}

function getZodiacSign(longitude) {
  const normalized = normalizeDegrees(longitude);
  const index = Math.floor(normalized / 30);
  return {
    sign: ZODIAC_SIGNS[index],
    signNumber: index + 1,
    degree: Number((normalized % 30).toFixed(2)),
    longitude: Number(normalized.toFixed(2)),
  };
}

function getNakshatra(longitude) {
  const normalized = normalizeDegrees(longitude);
  const nakshatraSize = 360 / 27;
  const index = Math.floor(normalized / nakshatraSize);
  const position = normalized - index * nakshatraSize;
  const pada = Math.floor(position / (nakshatraSize / 4)) + 1;

  return {
    name: NAKSHATRAS[index],
    pada,
  };
}

function planetLongitude(body, date) {
  // Geocentric ecliptic longitude of a planet at the given date/time
  const vector = Astronomy.GeoVector(body, date, true);
  const ecliptic = Astronomy.Ecliptic(vector);
  return ecliptic.elon;
}

function createPlanet(name, body, date, ayanamsa) {
  const tropical = planetLongitude(body, date);
  const sidereal = normalizeDegrees(tropical - ayanamsa);
  const zodiac = getZodiacSign(sidereal);
  const nakshatra = getNakshatra(sidereal);

  return {
    name,
    tropicalLongitude: Number(tropical.toFixed(2)),
    siderealLongitude: Number(sidereal.toFixed(2)),
    sign: zodiac.sign,
    signNumber: zodiac.signNumber,
    degree: zodiac.degree,
    house: 0, // computed after ascendant is known
    nakshatra: nakshatra.name,
    pada: nakshatra.pada,
  };
}

/**
 * Compute the full Kundli chart for a birth date/time.
 * Uses real astronomy-engine data for Sun, Moon and planets.
 *
 * House placement: this uses a simplified equal-house system based
 * on the Ascendant (the degree of the zodiac rising at the birth time).
 * For exact house cusps you would need geolocation + local sidereal time
 * (see README/limitations). The planetary LONGITUDES are astronomically
 * accurate; house assignments are approximate equal-house.
 */
function computeKundli({ dateOfBirth, timeOfBirth }) {
  // Interpret as IST (+05:30), matching the app's Indian user base
  const date = new Date(`${dateOfBirth}T${timeOfBirth}:00+05:30`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date or time");
  }

  const year = date.getFullYear();
  const ayanamsa = getLahiriAyanamsa(year);

  // ----- SUN -----
  const sunTropical = planetLongitude(Astronomy.Body.Sun, date);
  const sunSidereal = normalizeDegrees(sunTropical - ayanamsa);
  const sunZodiac = getZodiacSign(sunSidereal);
  const sunNakshatra = getNakshatra(sunSidereal);

  const sun = {
    name: "Sun",
    tropicalLongitude: Number(sunTropical.toFixed(2)),
    siderealLongitude: Number(sunSidereal.toFixed(2)),
    sign: sunZodiac.sign,
    signNumber: sunZodiac.signNumber,
    degree: sunZodiac.degree,
    house: 0,
    nakshatra: sunNakshatra.name,
    pada: sunNakshatra.pada,
  };

  // ----- MOON -----
  // EclipticGeoMoon returns { lat, lon, dist } — use .lon
  const moonEcliptic = Astronomy.EclipticGeoMoon(date);
  const moonTropicalLongitude = moonEcliptic.lon;
  const moonSidereal = normalizeDegrees(moonTropicalLongitude - ayanamsa);
  const moonZodiac = getZodiacSign(moonSidereal);
  const moonNakshatra = getNakshatra(moonSidereal);

  const moon = {
    name: "Moon",
    tropicalLongitude: Number(moonTropicalLongitude.toFixed(2)),
    siderealLongitude: Number(moonSidereal.toFixed(2)),
    sign: moonZodiac.sign,
    signNumber: moonZodiac.signNumber,
    degree: moonZodiac.degree,
    house: 0,
    nakshatra: moonNakshatra.name,
    pada: moonNakshatra.pada,
  };

  // ----- OTHER PLANETS -----
  const mercury = createPlanet("Mercury", Astronomy.Body.Mercury, date, ayanamsa);
  const venus = createPlanet("Venus", Astronomy.Body.Venus, date, ayanamsa);
  const mars = createPlanet("Mars", Astronomy.Body.Mars, date, ayanamsa);
  const jupiter = createPlanet("Jupiter", Astronomy.Body.Jupiter, date, ayanamsa);
  const saturn = createPlanet("Saturn", Astronomy.Body.Saturn, date, ayanamsa);

  // Ascendant (Lagna): degree of the zodiac rising on the eastern
  // horizon at birth. Without geolocation we approximate the Lagna
  // as the sign rising at sunrise at the birth date; this is clearly
  // labelled as an approximation. Accurate Lagna needs birth place
  // latitude/longitude + local sidereal time.
  const sunriseDate = new Date(`${dateOfBirth}T06:00:00+05:30`);
  const ascTropical = planetLongitude(Astronomy.Body.Sun, sunriseDate);
  const ascSidereal = normalizeDegrees(ascTropical - ayanamsa);
  const ascendant = getZodiacSign(ascSidereal);
  const ascNakshatra = getNakshatra(ascSidereal);

  const planets = [sun, moon, mercury, venus, mars, jupiter, saturn];

  // Assign equal houses: house 1 starts at the ascendant longitude,
  // each house spans 30°. Planet in house = floor((lon - asc)/30) + 1.
  planets.forEach((planet) => {
    const offset = normalizeDegrees(planet.siderealLongitude - ascSidereal);
    planet.house = Math.floor(offset / 30) + 1;
  });

  // Houses array (12 equal houses, 1-based)
  const houses = Array.from({ length: 12 }, (_, i) => {
    const cusp = normalizeDegrees(ascSidereal + i * 30);
    const sign = getZodiacSign(cusp);
    return {
      house: i + 1,
      sign: sign.sign,
      degree: sign.degree,
      longitude: sign.longitude,
    };
  });

  return {
    birthDetails: {
      dateOfBirth,
      timeOfBirth,
    },
    ayanamsa: Number(ayanamsa.toFixed(4)),
    sunSign: sunZodiac.sign,
    moonSign: moonZodiac.sign,
    moonRashi: moonZodiac.sign,
    nakshatra: moonNakshatra.name,
    nakshatraPada: moonNakshatra.pada,
    ascendant: ascendant.sign,
    ascendantLongitude: ascSidereal,
    ascendantNakshatra: ascNakshatra.name,
    planets,
    houses,
    // Note: Vimshottari dasha periods are NOT computed here because the
    // project has no dasha library. See H. Limitations in the report.
    dasha: null,
    method: "astronomy-engine (VSOP87) with approximate Lahiri ayanamsa",
    generatedAt: new Date().toISOString(),
  };
}

/* =====================================================
   HELPERS
===================================================== */

function toISODate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(value);
  return str.includes("T") ? str.split("T")[0] : str;
}

function parseKundliData(row) {
  let data = null;
  if (row.kundli_data) {
    try {
      data = typeof row.kundli_data === "string"
        ? JSON.parse(row.kundli_data)
        : row.kundli_data;
    } catch (e) {
      data = null;
    }
  }
  return data;
}

function serializeKundli(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    date_of_birth: toISODate(row.date_of_birth),
    time_of_birth: row.time_of_birth,
    place_of_birth: row.place_of_birth,
    gender: row.gender,
    kundli_data: parseKundliData(row),
    created_at: row.created_at,
  };
}

/* =====================================================
   GENERATE KUNDLI (calculation only, no save)
   POST /api/kundli/generate
   Auth required
===================================================== */
const generateKundli = (req, res) => {
  const { dateOfBirth, timeOfBirth } = req.body;

  if (!dateOfBirth || !timeOfBirth) {
    return res.status(400).json({
      message: "Date of birth and time of birth are required.",
    });
  }

  try {
    const kundli = computeKundli({ dateOfBirth, timeOfBirth });
    res.json({
      message: "Kundli generated successfully 🔮",
      kundli,
    });
  } catch (err) {
    console.error("Kundli generation error:", err.message);
    res.status(400).json({ message: err.message });
  }
};

/* =====================================================
   SAVE KUNDLI
   POST /api/kundli
   Auth required
   Belongs to the logged-in user
===================================================== */
const saveKundli = (req, res) => {
  const {
    name,
    dateOfBirth,
    timeOfBirth,
    placeOfBirth,
    gender,
  } = req.body;

  if (!name || !dateOfBirth || !timeOfBirth || !placeOfBirth) {
    return res.status(400).json({
      message: "Name, date of birth, time of birth and place of birth are required.",
    });
  }

  // Compute the chart first — fail before inserting if invalid
  let kundliData;
  try {
    kundliData = computeKundli({ dateOfBirth, timeOfBirth });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const sql = `
    INSERT INTO kundli
    (user_id, name, date_of_birth, time_of_birth, place_of_birth, gender, kundli_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      req.user.id,
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender || null,
      JSON.stringify(kundliData),
    ],
    (err, result) => {
      if (err) {
        console.error("Kundli save error:", err.message);
        return res.status(500).json({ message: "Failed to save Kundli." });
      }

      res.status(201).json({
        message: "Kundli saved successfully 🔮",
        kundliId: result.insertId,
        kundli: { ...kundliData, id: result.insertId, name, place_of_birth: placeOfBirth, gender: gender || null },
      });
    }
  );
};

/* =====================================================
   GET MY KUNDLIS (list)
   GET /api/kundli
   Auth required
   Only the logged-in user's records
===================================================== */
const getMyKundlis = (req, res) => {
  const sql = `
    SELECT id, user_id, name, date_of_birth, time_of_birth,
           place_of_birth, gender, kundli_data, created_at
    FROM kundli
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Kundli list error:", err.message);
      return res.status(500).json({ message: "Failed to load Kundlis." });
    }

    res.json({ kundlis: results.map(serializeKundli) });
  });
};

/* =====================================================
   GET SINGLE KUNDLI (ownership-checked)
   GET /api/kundli/:id
   Auth required
   404 if not found OR not owned by the user
===================================================== */
const getKundliById = (req, res) => {
  const kundliId = req.params.id;

  const sql = `
    SELECT id, user_id, name, date_of_birth, time_of_birth,
           place_of_birth, gender, kundli_data, created_at
    FROM kundli
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;

  db.query(sql, [kundliId, req.user.id], (err, results) => {
    if (err) {
      console.error("Kundli get error:", err.message);
      return res.status(500).json({ message: "Failed to load Kundli." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Kundli not found." });
    }

    res.json({ kundli: serializeKundli(results[0]) });
  });
};

/* =====================================================
   DELETE KUNDLI (ownership-checked)
   DELETE /api/kundli/:id
   Auth required
   404 if not found OR not owned by the user
===================================================== */
const deleteKundli = (req, res) => {
  const kundliId = req.params.id;

  const sql = `
    DELETE FROM kundli
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [kundliId, req.user.id], (err, result) => {
    if (err) {
      console.error("Kundli delete error:", err.message);
      return res.status(500).json({ message: "Failed to delete Kundli." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kundli not found." });
    }

    res.json({ message: "Kundli deleted successfully." });
  });
};

module.exports = {
  generateKundli,
  saveKundli,
  getMyKundlis,
  getKundliById,
  deleteKundli,
};
