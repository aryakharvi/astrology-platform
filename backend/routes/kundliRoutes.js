const express = require("express");

const {
  createKundli,
  getUserKundli,
} = require("../controllers/kundliController");

const router = express.Router();

// Save Kundli
router.post("/", createKundli);

// Get user's Kundli
router.get("/:userId", getUserKundli);

module.exports = router;