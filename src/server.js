
require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

async function shutdown() {
  console.log("Shutting down API server...");

  server.close(async () => {
    const pool = require("./db/pool");

    try {
      await pool.end();
      console.log("Database connection pool closed.");
      process.exit(0);
    } catch (error) {
      console.error("Error closing database pool:", error.message);
      process.exit(1);
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
