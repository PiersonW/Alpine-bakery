import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb, ensureSchema } from "../../../lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_SIZES = ["small", "medium", "large", "xlarge"];
const ALLOWED_WEIGHTS = ["normal", "bold"];
const ALLOWED_STYLES = ["normal", "italic"];
const ALLOWED_ALIGNS = ["left", "center"];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

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
  const body = await request.json();
  const { message } = body;
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Write something first." }, { status: 400 });
  }

  // Validate style fields, falling back to safe defaults for anything
  // missing or unexpected rather than trusting the client blindly.
  const font_size = ALLOWED_SIZES.includes(body.font_size) ? body.font_size : "medium";
  const font_weight = ALLOWED_WEIGHTS.includes(body.font_weight) ? body.font_weight : "normal";
  const font_style = ALLOWED_STYLES.includes(body.font_style) ? body.font_style : "normal";
  const text_align = ALLOWED_ALIGNS.includes(body.text_align) ? body.text_align : "left";
  const font_color = HEX_COLOR.test(body.font_color || "") ? body.font_color : "#3d2e24";

  const db = getDb();
  const id = randomUUID();
  await db.execute({
    sql: `INSERT INTO announcements
            (id, message, font_size, font_color, font_weight, font_style, text_align)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, message.trim(), font_size, font_color, font_weight, font_style, text_align],
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
