"use client";

import { useEffect, useState } from "react";

function emptyRow() {
  return { mode: "product", productId: "", optionValue: "", description: "", unitPrice: "", quantity: 1 };
}

function parseOptions(product) {
  try {
    return product?.options ? JSON.parse(product.options) : null;
  } catch (e) {
    return null;
  }
}

export default function AdminManualOrderForm({ onSaved, onCancel }) {
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.filter((p) => p.available && !p.hidden)))
      .catch(() => {});
  }, []);

  function updateRow(index, changes) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...changes } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function rowUnitPriceCents(row) {
    if (row.mode === "custom") {
      const val = parseFloat(row.unitPrice);
      return isNaN(val) ? 0 : Math.round(val * 100);
    }
    const product = products.find((p) => p.id === row.productId);
    if (!product) return 0;
    const optionGroup = parseOptions(product);
    const choice = optionGroup?.choices?.find((c) => c.label === row.optionValue);
    return product.price_cents + (choice?.price_delta_cents || 0);
  }

  function rowDescription(row) {
    if (row.mode === "custom") return row.description.trim();
    const product = products.find((p) => p.id === row.productId);
    if (!product) return "";
    return row.optionValue ? `${product.name} — ${row.optionValue}` : product.name;
  }

  const subtotalCents = rows.reduce((sum, row) => {
    const qty = Math.max(1, parseInt(row.quantity, 10) || 1);
    return sum + rowUnitPriceCents(row) * qty;
  }, 0);
  const taxCents = Math.round(subtotalCents * 0.07);
  const totalCents = subtotalCents + taxCents;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!pickupDate) {
      setError("Pick a pickup date.");
      return;
    }

    const items = [];
    for (const row of rows) {
      const desc = rowDescription(row);
      const qty = Math.max(1, parseInt(row.quantity, 10) || 1);
      const unit = rowUnitPriceCents(row);
      if (!desc || unit <= 0) {
        setError("Every item needs a description and a price greater than $0.");
        return;
      }
      items.push({ description: desc, quantity: qty, amount_total: unit * qty });
    }
    items.push({ description: "Sales tax (7%)", quantity: 1, amount_total: taxCents });

    setSaving(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName.trim() || null,
        customer_email: customerEmail.trim() || null,
        customer_phone: customerPhone.trim() || null,
        pickup_date: pickupDate,
        pickup_time: pickupTime || null,
        items,
        total_cents: totalCents,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      setError("Couldn't save that order. Try again.");
      return;
    }
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: "24px" }}>
      <h2>Add a phone order</h2>

      <div className="field">
        <label htmlFor="customerName">Customer name</label>
        <input
          id="customerName"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="customerEmail">Email (optional)</label>
          <input
            id="customerEmail"
            type="text"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="jane@email.com"
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="customerPhone">Phone (optional)</label>
          <input
            id="customerPhone"
            type="text"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="pickupDate">Pickup date</label>
          <input
            id="pickupDate"
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="pickupTime">Pickup time</label>
          <input
            id="pickupTime"
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Items</label>
        {rows.map((row, i) => {
          const product = products.find((p) => p.id === row.productId);
          const optionGroup = product ? parseOptions(product) : null;
          return (
            <div
              key={i}
              style={{ border: "1px solid var(--line)", borderRadius: "8px", padding: "10px", marginBottom: "10px" }}
            >
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <select
                  value={row.mode}
                  onChange={(e) => updateRow(i, { mode: e.target.value })}
                  style={{ flex: "0 0 130px" }}
                >
                  <option value="product">From menu</option>
                  <option value="custom">Custom item</option>
                </select>

                {row.mode === "product" ? (
                  <select
                    value={row.productId}
                    onChange={(e) => updateRow(i, { productId: e.target.value, optionValue: "" })}
                    style={{ flex: 2 }}
                  >
                    <option value="">Choose a product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${(p.price_cents / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(i, { description: e.target.value })}
                    placeholder="Custom cake, half off day-old loaf, etc."
                    style={{ flex: 2 }}
                  />
                )}
              </div>

              {row.mode === "product" && optionGroup ? (
                <div style={{ marginBottom: "8px" }}>
                  <select
                    value={row.optionValue}
                    onChange={(e) => updateRow(i, { optionValue: e.target.value })}
                  >
                    <option value="">{optionGroup.label}…</option>
                    {optionGroup.choices.map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.label}
                        {c.price_delta_cents
                          ? ` (${c.price_delta_cents > 0 ? "+" : "-"}$${Math.abs(c.price_delta_cents / 100).toFixed(2)})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {row.mode === "custom" ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                    placeholder="Price each"
                    style={{ flex: 1 }}
                  />
                ) : null}
                <input
                  type="number"
                  min="1"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, { quantity: e.target.value })}
                  style={{ width: "70px" }}
                  aria-label="Quantity"
                />
                {rows.length > 1 ? (
                  <button type="button" className="link-btn" onClick={() => removeRow(i)}>
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        <button type="button" className="link-btn" onClick={addRow}>
          + Add another item
        </button>
      </div>

      <div className="pickup-summary">
        Subtotal ${(subtotalCents / 100).toFixed(2)} + tax ${(taxCents / 100).toFixed(2)} ={" "}
        <strong>Total ${(totalCents / 100).toFixed(2)}</strong>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Add order"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
