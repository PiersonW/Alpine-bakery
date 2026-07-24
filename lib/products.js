import { getDb, ensureSchema } from "./db";
import { CATEGORIES } from "./categories";

// Turns the stored JSON string of photo URLs into a real array, with a
// fallback to the single legacy image_url for products saved before
// multi-photo support existed.
function parseImages(row) {
  let images = [];
  try {
    images = row.image_urls ? JSON.parse(row.image_urls) : [];
  } catch (e) {
    images = [];
  }
  if (images.length === 0 && row.image_url) {
    images = [row.image_url];
  }
  return { ...row, images };
}

export async function getFeaturedProducts() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM products WHERE featured = 1 AND hidden = 0 ORDER BY created_at DESC"
  );
  return result.rows.map(parseImages);
}

export async function getAllProducts() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM products WHERE hidden = 0 ORDER BY created_at DESC"
  );
  return result.rows.map(parseImages);
}

// Groups products by category, in the fixed order defined in
// lib/categories.js, skipping any category with nothing in it.
export function groupByCategory(products) {
  const groups = {};
  for (const product of products) {
    const cat = product.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(product);
  }

  const orderedNames = [
    ...CATEGORIES.filter((c) => groups[c]),
    ...Object.keys(groups).filter((c) => !CATEGORIES.includes(c)),
  ];

  return orderedNames.map((name) => ({ name, items: groups[name] }));
}
