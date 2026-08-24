const Astronomy = require("astronomy-engine");

// ==========================================
// ZODIAC SIGNS
// ==========================================

const zodiacSigns = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

// ==========================================
// SIMPLE LAHIRI AYANAMSA APPROXIMATION
// ==========================================
//
// This converts tropical longitude to a
// sidereal longitude used for Vedic astrology.
//
// For production-level astrology, we can later
// replace this with a dedicated Swiss Ephemeris
// implementation.
//

function getLahiriAyanamsa(year) {
  const referenceYear = 2000;
  const referenceAyanamsa = 23.85675;

  const annualMotion = 0.013968;

  return (
    referenceAyanamsa +
    (year - referenceYear) * annualMotion
  );
}

// ==========================================
// NORMALIZE ANGLE
// ==========================================

function normalizeDegrees(degrees) {
  let result = degrees % 360;

  if (result < 0) {
    result += 360;
  }

  return result;
}

// ==========================================
// GET ZODIAC SIGN
// ==========================================

function getZodiacSign(longitude) {
  const normalized = normalizeDegrees(longitude);

  const index = Math.floor(normalized / 30);

  const degree = normalized % 30;

  return {
    sign: zodiacSigns[index],
    degree: Number(degree.toFixed(2)),
  };
}

// ==========================================
// NAKSHATRAS
// ==========================================

const nakshatras = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

// ==========================================
// GET NAKSHATRA
// ==========================================

function getNakshatra(longitude) {
  const normalized = normalizeDegrees(longitude);

  const nakshatraSize = 360 / 27;

  const index = Math.floor(
    normalized / nakshatraSize
  );

  const positionInNakshatra =
    normalized - index * nakshatraSize;

  const pada = Math.floor(
    positionInNakshatra / (nakshatraSize / 4)
  ) + 1;

  return {
    name: nakshatras[index],
    pada,
  };
}

// ==========================================
// PLANET LONGITUDE
// ==========================================

function getPlanetLongitude(body, date) {
  const position = Astronomy.GeoVector(
    body,
    date,
    true
  );

  const ecliptic = Astronomy.Ecliptic(position);

  return ecliptic.elon;
}

// ==========================================
// CREATE PLANET DATA
// ==========================================

function createPlanet(
  name,
  body,
  date,
  ayanamsa
) {
  const tropicalLongitude =
    getPlanetLongitude(body, date);

  const siderealLongitude = normalizeDegrees(
    tropicalLongitude - ayanamsa
  );

  const zodiac = getZodiacSign(
    siderealLongitude
  );

  return {
    name,
    tropicalLongitude: Number(
      tropicalLongitude.toFixed(2)
    ),
    siderealLongitude: Number(
      siderealLongitude.toFixed(2)
    ),
    sign: zodiac.sign,
    degree: zodiac.degree,
  };
}

// ==========================================
// CALCULATE KUNDLI
// ==========================================

const calculateKundli = async (req, res) => {
  try {
    const {
      dateOfBirth,
      timeOfBirth,
    } = req.body;

    if (!dateOfBirth || !timeOfBirth) {
      return res.status(400).json({
        message:
          "Date of birth and time of birth are required",
      });
    }

    // --------------------------------------
    // Create UTC date
    // --------------------------------------

    const date = new Date(
      `${dateOfBirth}T${timeOfBirth}:00+05:30`
    );

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid date or time",
      });
    }

    const year = date.getFullYear();

    // --------------------------------------
    // Lahiri ayanamsa
    // --------------------------------------

    const ayanamsa =
      getLahiriAyanamsa(year);

    // --------------------------------------
    // Sun
    // --------------------------------------

    const sun = createPlanet(
      "Sun",
      Astronomy.Body.Sun,
      date,
      ayanamsa
    );

    // --------------------------------------
    // Moon
    // --------------------------------------

    const moonTropical =
      Astronomy.EclipticGeoMoon(date);

    const moonSidereal =
      normalizeDegrees(
        moonTropical.elon - ayanamsa
      );

    const moonZodiac =
      getZodiacSign(moonSidereal);

    const moonNakshatra =
      getNakshatra(moonSidereal);

    const moon = {
      name: "Moon",
      tropicalLongitude: Number(
        moonTropical.elon.toFixed(2)
      ),
      siderealLongitude: Number(
        moonSidereal.toFixed(2)
      ),
      sign: moonZodiac.sign,
      degree: moonZodiac.degree,
      nakshatra: moonNakshatra.name,
      pada: moonNakshatra.pada,
    };

    // --------------------------------------
    // Planets
    // --------------------------------------

    const mercury = createPlanet(
      "Mercury",
      Astronomy.Body.Mercury,
      date,
      ayanamsa
    );

    const venus = createPlanet(
      "Venus",
      Astronomy.Body.Venus,
      date,
      ayanamsa
    );

    const mars = createPlanet(
      "Mars",
      Astronomy.Body.Mars,
      date,
      ayanamsa
    );

    const jupiter = createPlanet(
      "Jupiter",
      Astronomy.Body.Jupiter,
      date,
      ayanamsa
    );

    const saturn = createPlanet(
      "Saturn",
      Astronomy.Body.Saturn,
      date,
      ayanamsa
    );

    // --------------------------------------
    // Result
    // --------------------------------------

    res.status(200).json({
      message:
        "Kundli calculated successfully 🔮",

      birthDetails: {
        dateOfBirth,
        timeOfBirth,
      },

      ayanamsa: Number(
        ayanamsa.toFixed(4)
      ),

      sun,

      moon,

      planets: [
        sun,
        moon,
        mercury,
        venus,
        mars,
        jupiter,
        saturn,
      ],

      note:
        "Planetary positions are calculated astronomically and converted to a sidereal zodiac using an approximate Lahiri ayanamsa. House calculations and a production-grade ephemeris will be added next.",
    });
  } catch (error) {
    console.error(
      "Kundli calculation error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to calculate Kundli",
    });
  }
};

module.exports = {
  calculateKundli,
};