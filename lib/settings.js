import { getDb, ensureSchema } from "./db";

export async function getSettings() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute("SELECT * FROM settings WHERE id = 1");
  return result.rows[0];
}

export async function updateSettings({ pickup_start, pickup_end, pickup_interval_minutes }) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `UPDATE settings
          SET pickup_start = ?, pickup_end = ?, pickup_interval_minutes = ?
          WHERE id = 1`,
    args: [pickup_start, pickup_end, pickup_interval_minutes],
  });
}
