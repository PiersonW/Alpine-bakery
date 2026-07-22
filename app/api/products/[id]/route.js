import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "../../../../lib/db";

export async function PUT(request, { params }) {
  await ensureSchema();
  const body = await request.json();
  const { name, description, price_cents, image_url, available, category } = body;

  const db = getDb();
  await db.execute({
    sql: `UPDATE products
          SET name = ?, description = ?, price_cents = ?, image_url = ?, available = ?, category = ?
          WHERE id = ?`,
    args: [
      name,
      description || "",
      Math.round(price_cents),
      image_url || null,
      available ? 1 : 0,
      category || "Other",
      params.id,
    ],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM products WHERE id = ?",
    args: [params.id],
  });
  return NextResponse.json({ ok: true });
}
