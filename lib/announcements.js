import { getDb, ensureSchema } from "./db";

export async function getRecentAnnouncements(limit = 5) {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM announcements ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });
  return result.rows;
}
