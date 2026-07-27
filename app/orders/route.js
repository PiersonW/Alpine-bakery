import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );
  const orders = result.rows.map((row) => ({
    ...row,
    items: JSON.parse(row.items || "[]"),
  }));
  return NextResponse.json(orders, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(request) {
  const { id, status } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  const db = getDb();
  await db.execute({
    sql: "UPDATE orders SET status = ? WHERE id = ?",
    args: [status, id],
  });
  return NextResponse.json({ success: true });
}
