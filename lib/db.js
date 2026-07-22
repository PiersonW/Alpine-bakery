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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // Databases created before "category" existed won't have that column yet.
  // SQLite has no "ADD COLUMN IF NOT EXISTS", so we just try it and ignore
  // the error on every run after the first, once the column already exists.
  try {
    await db.execute(
      `ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'Other'`
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
