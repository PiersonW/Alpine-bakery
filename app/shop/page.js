import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import { getAllProducts, groupByCategory } from "../../lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShopPage() {
  const products = await getAllProducts();
  const sections = groupByCategory(products);

  return (
    <>
      <Navbar />

      <main className="shop" style={{ paddingTop: "48px" }}>
        <div className="container">
          <div className="page-header" style={{ padding: 0, marginBottom: "8px" }}>
            <h1>Full menu</h1>
          </div>
          <p className="shop-sub">
            Everything we make, baked to order. Items marked sold out are
            temporarily unavailable but may return.
          </p>

          {products.length === 0 ? (
            <div className="empty-state">
              Nothing&rsquo;s on the menu yet — check back soon.
            </div>
          ) : (
            sections.map((section) => (
              <div className="category-section" key={section.name}>
                <h3 className="category-heading">{section.name}</h3>
                <div className="grid">
                  {section.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))
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
