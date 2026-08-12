"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import DatePicker from "../../components/DatePicker";
import { useCart } from "../../components/CartContext";
import { generatePickupTimes, formatPickupTime } from "../../lib/pickupTimes";

const MIN_NOTICE_HOURS = 48;

function formatPretty(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeValue(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function CartPage() {
  const { items, setQty, removeItem, totalCents } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [pickupDate, setPickupDate] = useState(null);
  const [pickupTime, setPickupTime] = useState("");
  const [pickupWindow, setPickupWindow] = useState({
    pickup_start: "08:00",
    pickup_end: "18:00",
    pickup_interval_minutes: 30,
  });

  useEffect(() => {
    fetch("/api/blocked-dates")
      .then((res) => res.json())
      .then((data) => setBlockedDates(new Set(data.map((b) => b.date))))
      .catch(() => {});

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setPickupWindow(data))
      .catch(() => {});
  }, []);

  // The earliest moment someone can actually pick up an order — right now
  // plus the required notice window. Recomputed on every render, which is
  // "live enough" since the page re-renders whenever the customer interacts.
  const cutoff = new Date(Date.now() + MIN_NOTICE_HOURS * 60 * 60 * 1000);
  const cutoffDateKey = toDateKey(cutoff);
  const cutoffTimeValue = toTimeValue(cutoff);

  const allTimeOptions = generatePickupTimes(
    pickupWindow.pickup_start,
    pickupWindow.pickup_end,
    pickupWindow.pickup_interval_minutes
  );

  // On the cutoff day itself, only times at/after the cutoff clock time
  // are far enough out. Any day after that, every time slot is fine.
  const timeOptions =
    pickupDate === cutoffDateKey
      ? allTimeOptions.filter((t) => t.value >= cutoffTimeValue)
      : allTimeOptions;

  // If the customer picked a date/time and then enough time passed (or the
  // window filter changed) that it's no longer valid, clear the time so
  // they have to re-pick rather than silently keeping a too-soon selection.
  useEffect(() => {
    if (pickupTime && !timeOptions.some((t) => t.value === pickupTime)) {
      setPickupTime("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupDate]);

  async function handleCheckout() {
    if (!pickupDate) {
      setError("Pick a pickup date before checking out.");
      return;
    }
    if (!pickupTime) {
      setError("Pick a pickup time before checking out.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, pickup_date: pickupDate, pickup_time: pickupTime }),
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
                  {item.optionLabel && item.choiceValue ? (
                    <p className="cart-row-price" style={{ marginBottom: "2px" }}>
                      {item.optionLabel}: {item.choiceValue}
                    </p>
                  ) : null}
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
              <h2>Pickup date &amp; time</h2>
              <p style={{ fontSize: "0.9rem", color: "rgba(38,55,42,0.7)", marginTop: "-10px" }}>
                Everything is baked to order, so pick the day and time
                you&rsquo;d like to swing by and grab it. We need at least
                48 hours&rsquo; notice.
              </p>
              <DatePicker
                selected={pickupDate}
                onSelect={setPickupDate}
                disabledDates={blockedDates}
                blockedDates={blockedDates}
                minDateKey={cutoffDateKey}
                monthsAhead={3}
              />

              <div className="field" style={{ marginTop: "16px", maxWidth: "220px" }}>
                <label htmlFor="pickup-time">Pickup time</label>
                <select
                  id="pickup-time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  disabled={!pickupDate}
                >
                  <option value="">Choose a time…</option>
                  {timeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {pickupDate && timeOptions.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "rgba(38,55,42,0.7)", marginTop: "6px" }}>
                    No times left that far out today — try the next available day.
                  </p>
                ) : null}
              </div>

              {pickupDate && pickupTime ? (
                <p className="pickup-summary">
                  Picking up{" "}
                  <strong>
                    {formatPretty(pickupDate)} at {formatPickupTime(pickupTime)}
                  </strong>
                </p>
              ) : null}
            </div>

            <div className="cart-summary" style={{ flexDirection: "column", alignItems: "stretch", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "rgba(38,55,42,0.75)" }}>
                <span>Subtotal</span>
                <span>${(totalCents / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "rgba(38,55,42,0.75)" }}>
                <span>Sales tax (7%)</span>
                <span>${((totalCents * 0.07) / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                <span className="cart-total">
                  Total: ${((totalCents * 1.07) / 100).toFixed(2)}
                </span>
                <button
                  className="btn btn-primary"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Redirecting to Stripe…" : "Checkout with Stripe"}
                </button>
              </div>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
          </>
        )}
      </div>
    </>
  );
}
