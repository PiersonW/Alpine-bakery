import { getDb, ensureSchema } from "./db";
import { CATEGORIES } from "./categories";

export async function getFeaturedProducts() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function getAllProducts() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM products ORDER BY created_at DESC"
  );
  return result.rows;
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
