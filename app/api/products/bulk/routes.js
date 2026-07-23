import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb, ensureSchema } from "../../../../lib/db";
import { CATEGORIES } from "../../../../lib/categories";

export async function POST(request) {
  await ensureSchema();
  const { products } = await request.json();

  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: "No products to import." }, { status: 400 });
  }

  const db = getDb();
  let inserted = 0;
  const skipped = [];

  for (const p of products) {
    const name = (p.name || "").trim();
    const priceCents = Math.round(Number(p.price_cents));

    if (!name || !priceCents || priceCents <= 0) {
      skipped.push(name || "(row with no name)");
      continue;
    }

    const category = CATEGORIES.includes(p.category) ? p.category : "Other";

    await db.execute({
      sql: `INSERT INTO products (id, name, description, price_cents, image_url, available, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        name,
        (p.description || "").trim(),
        priceCents,
        p.image_url || null,
        1,
        category,
      ],
    });
    inserted++;
  }

  return NextResponse.json({ inserted, skipped });
}
