import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "../../../../lib/db";

export async function DELETE(request, { params }) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM blocked_dates WHERE date = ?",
    args: [params.date],
  });
  return NextResponse.json({ ok: true });
}
