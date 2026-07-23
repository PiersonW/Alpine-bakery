"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import DatePicker from "../../components/DatePicker";
import { useCart } from "../../components/CartContext";

function formatPretty(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function CartPage() {
  const { items, setQty, removeItem, totalCents } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [pickupDate, setPickupDate] = useState(null);

  useEffect(() => {
    fetch("/api/blocked-dates")
      .then((res) => res.json())
      .then((data) => setBlockedDates(new Set(data.map((b) => b.date))))
      .catch(() => {});
  }, []);

  async function handleCheckout() {
    if (!pickupDate) {
      setError("Pick a pickup date before checking out.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, pickup_date: pickupDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError("Couldn't reach checkout. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="container cart-page">
        <div className="page-header">
          <h1>Your cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            Your cart is empty. <a href="/#shop">Go pick something out.</a>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div className="cart-row" key={item.id}>
                <img src={item.image_url || undefined} alt="" />
                <div>
                  <p className="cart-row-name">{item.name}</p>
                  <p className="cart-row-price">
                    ${(item.price_cents / 100).toFixed(2)} each
                  </p>
                </div>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    aria-label={`Decrease quantity of ${item.name}`}
                    onClick={() => setQty(item.id, item.qty - 1)}
                  >
                    –
                  </button>
                  <span>{item.qty}</span>
                  <button
                    className="qty-btn"
                    aria-label={`Increase quantity of ${item.name}`}
                    onClick={() => setQty(item.id, item.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="remove-link"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="card" style={{ marginTop: "24px" }}>
              <h2>Pickup date</h2>
              <p style={{ fontSize: "0.9rem", color: "rgba(38,55,42,0.7)", marginTop: "-10px" }}>
                Everything is baked to order, so pick the day you&rsquo;d
                like to swing by and grab it.
              </p>
              <DatePicker
                selected={pickupDate}
                onSelect={setPickupDate}
                disabledDates={blockedDates}
                blockedDates={blockedDates}
                monthsAhead={3}
              />
              {pickupDate ? (
                <p className="pickup-summary">
                  Picking up on <strong>{formatPretty(pickupDate)}</strong>
                </p>
              ) : null}
            </div>

            <div className="cart-summary">
              <span className="cart-total">
                Total: ${(totalCents / 100).toFixed(2)}
              </span>
              <button
                className="btn btn-primary"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Redirecting to Stripe…" : "Checkout with Stripe"}
              </button>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
          </>
        )}
      </div>
    </>
  );
}
