
require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const pool = require("./pool");

async function migrate() {
  const migrationPath = path.join(
    __dirname,
    "migrations",
    "001_initial_schema.sql"
  );

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const version = "001_initial_schema";

    const existing = await client.query(
      "SELECT version FROM schema_migrations WHERE version = $1",
      [version]
    );

    if (existing.rowCount > 0) {
      console.log(`Migration ${version} already applied; skipping.`);
      return;
    }

    const sql = fs.readFileSync(migrationPath, "utf8");

    await client.query(sql);

    await client.query(
      "INSERT INTO schema_migrations (version) VALUES ($1)",
      [version]
    );

    console.log(`Migration ${version} applied successfully.`);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
