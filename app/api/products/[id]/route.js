import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "../../../../lib/db";

export async function PUT(request, { params }) {
  await ensureSchema();
  const body = await request.json();
  const { name, description, price_cents, image_url, image_urls, available, category, featured, hidden, options } = body;

  const db = getDb();

  let imageUrlValue = image_url || null;
  let imageUrlsValue;

  if (Array.isArray(image_urls)) {
    const images = image_urls.filter(Boolean);
    imageUrlsValue = JSON.stringify(images);
    imageUrlValue = images[0] || null;
  } else if (typeof image_urls === "string") {
    imageUrlsValue = image_urls;
  } else {
    imageUrlsValue = JSON.stringify([]);
  }

  // Same spread-vs-form issue as images: a quick-toggle action (Feature/Hide)
  // spreads the existing product row, where `options` is already a JSON
  // string (or null) rather than a fresh object -- handle both so a toggle
  // never wipes out saved options.
  let optionsValue;
  if (options && typeof options === "object") {
    optionsValue = JSON.stringify(options);
  } else if (typeof options === "string") {
    optionsValue = options;
  } else {
    optionsValue = null;
  }

  await db.execute({
    sql: `UPDATE products
          SET name = ?, description = ?, price_cents = ?, image_url = ?, image_urls = ?, available = ?, category = ?, featured = ?, hidden = ?, options = ?
          WHERE id = ?`,
    args: [
      name,
      description || "",
      Math.round(price_cents),
      imageUrlValue,
      imageUrlsValue,
      available ? 1 : 0,
      category || "Other",
      featured ? 1 : 0,
      hidden ? 1 : 0,
      optionsValue,
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
