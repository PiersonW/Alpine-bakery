import Navbar from "../components/Navbar";
import Ridge from "../components/Ridge";
import ProductCard from "../components/ProductCard";
import { getFeaturedProducts } from "../lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <>
      <Navbar />
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Baked to order &middot; Local pickup</span>
            <h1>Bread and pastries, baked in small batches at home.</h1>
            <p>
              Everything at Alpine Bakery is made fresh in our home kitchen,
              in limited quantities. Order below and we&rsquo;ll have it
              ready for you.
            </p>
            <div className="hero-actions">
              <a href="/shop" className="hero-btn-primary">Browse the menu</a>
              <a href="#shop" className="hero-btn-secondary">This week&rsquo;s bakes</a>
            </div>
          </div>
          <div className="hero-photo">
            <img src="/hero-photo.jpg" alt="A tiered display of Alpine Bakery desserts" />
          </div>
        </div>
        <Ridge />
      </header>

      <main className="shop" id="shop">
        <div className="container">
          <h2>This week&rsquo;s featured bakes</h2>
          <p className="shop-sub">
            {products.length > 0
              ? "Order ahead — quantities are limited."
              : ""}{" "}
            <a href="/shop">Browse the full menu &rarr;</a>
          </p>

          {products.length === 0 ? (
            <div className="empty-state">
              Nothing&rsquo;s featured right now — check back soon, or{" "}
              <a href="/shop">browse the full menu</a>.
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
        <div className="container footer-inner">
          <span>
            Alpine Bakery &middot; a small home bakery &middot;{" "}
            <a href="/admin">Owner login</a>
          </span>
          <div className="footer-details">
            <span>Pickup: 90 East Pioneer Dr, Alpine, UT</span>
            <span>
              Order questions:{" "}
              <a href="mailto:Alpinebakery0901@gmail.com">
                Alpinebakery0901@gmail.com
              </a>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
