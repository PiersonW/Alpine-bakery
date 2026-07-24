"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminProductForm from "../../components/AdminProductForm";
import AdminBlockedDates from "../../components/AdminBlockedDates";
import AdminBulkImport from "../../components/AdminBulkImport";
import AdminPickupSettings from "../../components/AdminPickupSettings";

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadProducts() {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadProducts();
  }

  async function handleToggleFeatured(product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, featured: !product.featured }),
    });
    loadProducts();
  }

  async function handleToggleHidden(product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, hidden: !product.hidden }),
    });
    loadProducts();
  }

  async function handleLogout() {
    await fetch("/api/admin-login", { method: "DELETE" });
    router.push("/admin/login");
  }

  const editingProduct = products.find((p) => p.id === editingId);

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="container">
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem" }}>
            Alpine Bakery — Manage products
          </span>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <a href="/" style={{ color: "var(--snowcap)", fontSize: "0.9rem" }}>
              View site
            </a>
            <button className="btn btn-outline" onClick={handleLogout} style={{ color: "var(--snowcap)", borderColor: "var(--snowcap)" }}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="container admin-grid">
          <div className="card">
            <h2>{editingProduct ? "Edit product" : "Add a new product"}</h2>
            <AdminProductForm
              key={editingId || "new"}
              initial={editingProduct}
              onSaved={() => {
                setEditingId(null);
                loadProducts();
              }}
              onCancel={editingProduct ? () => setEditingId(null) : undefined}
            />
          </div>

          <div>
            <div className="card">
              <h2>Current products</h2>
              {loading ? (
                <p>Loading…</p>
              ) : products.length === 0 ? (
                <p>No products yet — add your first one on the left.</p>
              ) : (
                <div className="admin-product-list">
                  {products.map((p) => (
                    <div className="admin-product-row" key={p.id} style={p.hidden ? { opacity: 0.5 } : undefined}>
                      <img src={p.image_url || undefined} alt="" />
                      <div>
                        <div className="name">
                          {p.featured ? "★ " : ""}
                          {p.name} {!p.available ? "(sold out)" : ""} {p.hidden ? "(hidden)" : ""}
                        </div>
                        <div className="price">
                          ${(p.price_cents / 100).toFixed(2)} · {p.category || "Other"}
                        </div>
                      </div>
                      <div className="row-actions">
                        <button className="link-btn" onClick={() => handleToggleHidden(p)}>
                          {p.hidden ? "Unhide" : "Hide"}
                        </button>
                        <button className="link-btn" onClick={() => handleToggleFeatured(p)}>
                          {p.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button className="link-btn" onClick={() => setEditingId(p.id)}>
                          Edit
                        </button>
                        <button
                          className="link-btn"
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px" }}>
              <AdminBulkImport onImported={loadProducts} />
            </div>
          </div>
        </div>

        <div className="container" style={{ marginTop: "40px" }}>
          <AdminPickupSettings />
        </div>

        <div className="container" style={{ marginTop: "40px" }}>
          <AdminBlockedDates />
        </div>
      </main>
    </div>
  );
}
