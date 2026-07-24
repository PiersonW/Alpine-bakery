import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb, ensureSchema } from "../../../lib/db";

export async function GET() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM products ORDER BY created_at DESC"
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const { name, description, price_cents, image_urls, available, category, featured, hidden } = body;

  if (!name || !price_cents || price_cents <= 0) {
    return NextResponse.json(
      { error: "Name and a price greater than $0 are required." },
      { status: 400 }
    );
  }

  const images = Array.isArray(image_urls) ? image_urls.filter(Boolean) : [];

  const db = getDb();
  const id = randomUUID();
  await db.execute({
    sql: `INSERT INTO products (id, name, description, price_cents, image_url, image_urls, available, category, featured, hidden)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      name,
      description || "",
      Math.round(price_cents),
      images[0] || null,
      JSON.stringify(images),
      available === false ? 0 : 1,
      category || "Other",
      featured ? 1 : 0,
      hidden ? 1 : 0,
    ],
  });

  return NextResponse.json({ id });
}
