import Navbar from "../components/Navbar";
import Ridge from "../components/Ridge";
import ProductCard from "../components/ProductCard";
import { getFeaturedProducts } from "../lib/products";
import { getRecentAnnouncements } from "../lib/announcements";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatAnnouncementDate(dateStr) {
  // Stored as SQLite UTC "YYYY-MM-DD HH:MM:SS"
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SIZE_PX = {
  small: "0.85rem",
  medium: "1rem",
  large: "1.25rem",
  xlarge: "1.6rem",
};

const FONT_CSS = {
  body: '"Work Sans", sans-serif',
  display: '"Fraunces", serif',
  mono: '"JetBrains Mono", monospace',
  playfair: '"Playfair Display", serif',
  poppins: '"Poppins", sans-serif',
  caveat: '"Caveat", cursive',
  pacifico: '"Pacifico", cursive',
  dancing: '"Dancing Script", cursive',
  oswald: '"Oswald", sans-serif',
  merriweather: '"Merriweather", serif',
};

function announcementStyle(a) {
  return {
    fontSize: SIZE_PX[a.font_size] || SIZE_PX.medium,
    fontFamily: FONT_CSS[a.font_family] || FONT_CSS.body,
    color: a.font_color || "#3d2e24",
    fontWeight: a.font_weight === "bold" ? 700 : 400,
    fontStyle: a.font_style === "italic" ? "italic" : "normal",
    textAlign: a.text_align === "center" ? "center" : "left",
  };
}

export default async function HomePage() {
  const products = await getFeaturedProducts();
  const announcements = await getRecentAnnouncements();

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

      {announcements.length > 0 ? (
        <section className="announcements">
          <div className="container">
            <h2>Weekly updates</h2>
            <div className="announcement-list">
              {announcements.map((a) => (
                <div className="announcement-card" key={a.id}>
                  <span className="announcement-date">
                    {formatAnnouncementDate(a.created_at)}
                  </span>
                  <p className="announcement-message" style={announcementStyle(a)}>
                    {a.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
