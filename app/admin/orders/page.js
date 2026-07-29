"use client";

import { useEffect, useState } from "react";
import AdminManualOrderForm from "../../../components/AdminManualOrderForm";

const STATUS_OPTIONS = ["new", "in progress", "picked up", "cancelled"];

function formatDate(dateStr) {
  if (!dateStr) return "Not specified";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${m}/${d}/${y}`;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

function OrdersCalendar({ orders, selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Count active (non-cancelled) orders per date, and collect what's in them
  const countsByDate = {};
  const namesByDate = {};
  orders.forEach((o) => {
    if (!o.pickup_date || o.status === "cancelled") return;
    countsByDate[o.pickup_date] = (countsByDate[o.pickup_date] || 0) + 1;
    if (!namesByDate[o.pickup_date]) namesByDate[o.pickup_date] = new Set();
    (o.items || []).forEach((item) => {
      if (!item.description || /tax/i.test(item.description)) return;
      namesByDate[o.pickup_date].add(item.description);
    });
  });

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    cells.push(`${viewYear}-${mm}-${dd}`);
  }

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <button className="link-btn" onClick={goPrevMonth}>← Prev</button>
        <h2 style={{ margin: 0 }}>{monthLabel}</h2>
        <button className="link-btn" onClick={goNextMonth}>Next →</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          textAlign: "center",
          fontSize: "0.8rem",
          marginBottom: "4px",
          opacity: 0.7,
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {cells.map((dateStr, idx) => {
          if (!dateStr) return <div key={`empty-${idx}`} />;
          const count = countsByDate[dateStr] || 0;
          const isSelected = dateStr === selectedDate;
          const dayNum = parseInt(dateStr.split("-")[2], 10);
          const names = namesByDate[dateStr] ? Array.from(namesByDate[dateStr]) : [];
          let summary = names.join(", ");
          if (summary.length > 28) summary = summary.slice(0, 25) + "…";
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              style={{
                padding: "8px 4px",
                borderRadius: "6px",
                border: isSelected ? "2px solid #2d4a3a" : "1px solid #ddd",
                background: count > 0 ? "#e8f3ea" : "transparent",
                cursor: "pointer",
                fontWeight: count > 0 ? 600 : 400,
                minHeight: "56px",
              }}
            >
              <div>{dayNum}</div>
              {count > 0 && (
                <>
                  <div style={{ fontSize: "0.65rem" }}>
                    {count} order{count > 1 ? "s" : ""}
                  </div>
                  {summary && (
                    <div style={{ fontSize: "0.65rem", opacity: 0.8, whiteSpace: "normal", lineHeight: 1.2 }}>
                      {summary}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);

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
    // Show the change right away rather than waiting on a round trip.
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch (err) {
      alert("That status change didn't save — please try again.");
      loadOrders(); // pull the real state back from the database
    }
  }

  async function handleDelete(order) {
    const label = order.customer_name || order.customer_email || "this order";
    if (!window.confirm(`Delete ${label}? This can't be undone.`)) return;
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id }),
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      alert("Couldn't delete that order — please try again.");
      loadOrders();
    }
  }

  function formatPickup(order) {
    if (!order.pickup_date) return "Not specified";
    let text = formatDate(order.pickup_date);
    if (order.pickup_time) text += ` at ${formatTime(order.pickup_time)}`;
    return text;
  }

  const visibleOrders = selectedDate
    ? orders.filter((o) => o.pickup_date === selectedDate)
    : orders;

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="container">
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem" }}>
            Alpine Bakery — Orders
          </span>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button
              className="link-btn"
              style={{ color: "var(--snowcap)", fontSize: "0.9rem" }}
              onClick={() => setShowManualForm((v) => !v)}
            >
              {showManualForm ? "Cancel" : "+ Add phone order"}
            </button>
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
        {showManualForm ? (
          <div className="container" style={{ marginBottom: "24px" }}>
            <AdminManualOrderForm
              onSaved={() => {
                setShowManualForm(false);
                loadOrders();
              }}
              onCancel={() => setShowManualForm(false)}
            />
          </div>
        ) : null}

        <div className="container" style={{ marginBottom: "24px" }}>
          <OrdersCalendar orders={orders} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        <div className="container">
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>
                Order queue
                {selectedDate ? ` — ${formatDate(selectedDate)}` : ""}
              </h2>
              {selectedDate && (
                <button className="link-btn" onClick={() => setSelectedDate(null)}>
                  Show all
                </button>
              )}
            </div>
            {loading ? (
              <p>Loading…</p>
            ) : visibleOrders.length === 0 ? (
              <p>No orders {selectedDate ? "for this date." : "yet."}</p>
            ) : (
              <div className="admin-product-list">
                {visibleOrders.map((order) => (
                  <div
                    className="admin-product-row"
                    key={order.id}
                    style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div className="name">
                          {order.customer_name ? `${order.customer_name} — ` : ""}
                          Pickup: {formatPickup(order)}
                        </div>
                        <div className="price" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {order.customer_email ? (
                            <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a>
                          ) : (
                            "No email"
                          )}
                          {order.customer_phone && (
                            <>
                              <span>·</span>
                              <a href={`tel:${order.customer_phone}`}>Call {order.customer_phone}</a>
                              <span>·</span>
                              <a href={`sms:${order.customer_phone}`}>Text</a>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => handleDelete(order)}
                        >
                          Delete
                        </button>
                      </div>
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
