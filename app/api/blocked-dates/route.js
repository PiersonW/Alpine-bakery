import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "../../../lib/db";

// Anyone can read the list (customers need it to know which pickup
// dates to avoid); only an authenticated admin can add new ones — see
// middleware.js, which requires auth for every method except GET here.
export async function GET() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM blocked_dates ORDER BY date ASC"
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  await ensureSchema();
  const { date, reason } = await request.json();

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Provide a valid date in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const db = getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO blocked_dates (date, reason) VALUES (?, ?)",
    args: [date, reason || null],
  });

  return NextResponse.json({ ok: true });
}
