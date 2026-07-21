import Navbar from "../components/Navbar";
import Ridge from "../components/Ridge";
import ProductCard from "../components/ProductCard";
import { getDb, ensureSchema } from "../lib/db";

export const dynamic = "force-dynamic";

async function getProducts() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM products ORDER BY created_at DESC"
  );
  return result.rows;
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <Navbar />
      <header className="hero">
        <div className="hero-inner">
          <span className="eyebrow">Baked to order &middot; Local pickup</span>
          <h1>Bread and pastries, baked in small batches at home.</h1>
          <p>
            Everything at Alpine Bakery is made fresh in our home kitchen,
            in limited quantities. Order below and we&rsquo;ll have it
            ready for you.
          </p>
        </div>
        <Ridge />
      </header>

      <main className="shop" id="shop">
        <div className="container">
          <h2>This week&rsquo;s bakes</h2>
          <p className="shop-sub">
            {products.length > 0
              ? "Order ahead — quantities are limited."
              : ""}
          </p>

          {products.length === 0 ? (
            <div className="empty-state">
              Nothing&rsquo;s in the oven yet — check back soon.
            </div>
          ) : (
            <div className="grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          Alpine Bakery &middot; a small home bakery &middot;{" "}
          <a href="/admin">Owner login</a>
        </div>
      </footer>
    </>
  );
}
