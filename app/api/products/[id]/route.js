import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "../../../../lib/db";

export async function PUT(request, { params }) {
  await ensureSchema();
  const body = await request.json();
  const { name, description, price_cents, image_url, image_urls, available, category, featured, hidden } = body;

  const db = getDb();

  // image_urls arrives as a real array from the edit form, but as an
  // already-JSON-encoded string when a quick-toggle action (like
  // Feature/Hide) spreads an existing product row instead of resubmitting
  // the form -- handle both so a toggle never wipes out saved photos.
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

  await db.execute({
    sql: `UPDATE products
          SET name = ?, description = ?, price_cents = ?, image_url = ?, image_urls = ?, available = ?, category = ?, featured = ?, hidden = ?
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
