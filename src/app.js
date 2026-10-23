
const express = require("express");
const pool = require("./db/pool");

const app = express();

app.use(express.json());

// Basic API health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "AI Image Understanding & Content Matching Engine",
  });
});

// Database connectivity check
app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, current_user AS username"
    );

    res.status(200).json({
      status: "ok",
      database: result.rows[0].database,
      username: result.rows[0].username,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      status: "error",
      message: "Database connection unavailable",
    });
  }
});

module.exports = app;
