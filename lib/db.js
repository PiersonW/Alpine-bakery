import { createClient } from "@libsql/client";

let client;

export function getDb() {
  if (!client) {
    client = createClient({
      url: (process.env.TURSO_DATABASE_URL || "").trim(),
      authToken: (process.env.TURSO_AUTH_TOKEN || "").trim(),
    });
  }
  return client;
}

// Creates the products table if it doesn't already exist. Safe to call every time.
export async function ensureSchema() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price_cents INTEGER NOT NULL,
      image_url TEXT,
      available INTEGER NOT NULL DEFAULT 1,
      category TEXT NOT NULL DEFAULT 'Other',
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // Databases created before "category"/"featured" existed won't have those
  // columns yet. SQLite has no "ADD COLUMN IF NOT EXISTS", so we just try
  // each one and ignore the error on every run after the first.
  try {
    await db.execute(
      `ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'Other'`
    );
  } catch (e) {
    // Column already exists -- nothing to do.
  }
  try {
    await db.execute(
      `ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0`
    );
  } catch (e) {
    // Column already exists -- nothing to do.
  }
  await db.execute(`
    CREATE TABLE IF NOT EXISTS blocked_dates (
      date TEXT PRIMARY KEY,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
