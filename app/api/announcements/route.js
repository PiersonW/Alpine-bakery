import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb, ensureSchema } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10"
  );
  return NextResponse.json(result.rows, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request) {
  await ensureSchema();
  const { message } = await request.json();
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Write something first." }, { status: 400 });
  }
  const db = getDb();
  const id = randomUUID();
  await db.execute({
    sql: "INSERT INTO announcements (id, message) VALUES (?, ?)",
    args: [id, message.trim()],
  });
  return NextResponse.json({ id });
}

export async function DELETE(request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM announcements WHERE id = ?",
    args: [id],
  });
  return NextResponse.json({ success: true });
}
