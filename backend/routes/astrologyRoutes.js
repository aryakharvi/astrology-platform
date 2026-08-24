const express = require("express");

const {
  calculateKundli,
} = require("../controllers/astrologyController");

const router = express.Router();

router.post("/calculate", calculateKundli);

module.exports = router;