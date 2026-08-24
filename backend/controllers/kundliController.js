const Kundli = require("../models/Kundli");

const createKundli = async (req, res) => {
  try {
    const {
      user,
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
    } = req.body;

    if (
      !user ||
      !name ||
      !dateOfBirth ||
      !timeOfBirth ||
      !placeOfBirth
    ) {
      return res.status(400).json({
        message: "All Kundli details are required",
      });
    }

    const kundli = await Kundli.create({
      user,
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
    });

    res.status(201).json({
      message: "Kundli saved successfully 🔮",
      kundli,
    });
  } catch (error) {
    console.error("Create Kundli error:", error);

    res.status(500).json({
      message: "Failed to save Kundli",
    });
  }
};

const getUserKundli = async (req, res) => {
  try {
    const { userId } = req.params;

    const kundli = await Kundli.findOne({
      user: userId,
    }).sort({ createdAt: -1 });

    if (!kundli) {
      return res.status(404).json({
        message: "Kundli not found",
      });
    }

    res.status(200).json({
      message: "Kundli found",
      kundli,
    });
  } catch (error) {
    console.error("Get Kundli error:", error);

    res.status(500).json({
      message: "Failed to get Kundli",
    });
  }
};

module.exports = {
  createKundli,
  getUserKundli,
};