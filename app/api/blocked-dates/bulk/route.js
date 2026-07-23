import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "../../../../lib/db";

export async function POST(request) {
  await ensureSchema();
  const { dates } = await request.json();

  if (!Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json({ error: "No dates to block." }, { status: 400 });
  }

  const db = getDb();
  for (const date of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    await db.execute({
      sql: "INSERT OR IGNORE INTO blocked_dates (date) VALUES (?)",
      args: [date],
    });
  }

  return NextResponse.json({ ok: true, count: dates.length });
}
