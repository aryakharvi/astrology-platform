const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

// ================= MIDDLEWARE =================

app.use(cors());
app.use(express.json());

// ================= HOME =================

app.get("/", (req, res) => {
  res.json({
    message: "Shwetha Cosmic API is running ✨",
  });
});

// ================= AUTH ROUTES =================

app.use("/api/auth", authRoutes);

// ================= MONGODB =================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully ✅");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Shwetha Cosmic server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed ❌");
    console.error(error.message);
  });