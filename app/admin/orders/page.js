"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["new", "in progress", "picked up"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleStatusChange(id, status) {
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadOrders();
  }

  function formatPickup(order) {
    if (!order.pickup_date) return "Not specified";
    let text = order.pickup_date;
    if (order.pickup_time) text += ` at ${order.pickup_time}`;
    return text;
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="container">
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem" }}>
            Alpine Bakery — Orders
          </span>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <a href="/admin" style={{ color: "var(--snowcap)", fontSize: "0.9rem" }}>
              Back to products
            </a>
            <a href="/" style={{ color: "var(--snowcap)", fontSize: "0.9rem" }}>
              View site
            </a>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="container">
          <div className="card">
            <h2>Order queue</h2>
            {loading ? (
              <p>Loading…</p>
            ) : orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <div className="admin-product-list">
                {orders.map((order) => (
                  <div
                    className="admin-product-row"
                    key={order.id}
                    style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div className="name">Pickup: {formatPickup(order)}</div>
                        <div className="price">
                          {order.customer_email || "No email"}
                          {order.customer_phone ? ` · ${order.customer_phone}` : ""}
                        </div>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.quantity}× {item.description} — $
                          {(item.amount_total / 100).toFixed(2)}
                        </li>
                      ))}
                    </ul>

                    <div className="price" style={{ fontWeight: 600 }}>
                      Total: ${(order.total_cents / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
