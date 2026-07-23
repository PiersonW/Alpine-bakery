"use client";

import { useEffect, useState } from "react";
import DatePicker from "./DatePicker";

function formatPretty(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function AdminBlockedDates() {
  const [blocked, setBlocked] = useState([]);
  const [pending, setPending] = useState(new Set());
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/blocked-dates");
    const data = await res.json();
    setBlocked(data);
  }

  useEffect(() => {
    load();
  }, []);

  const blockedSet = new Set(blocked.map((b) => b.date));

  function toggleDate(date) {
    if (blockedSet.has(date)) {
      handleUnblock(date);
      return;
    }
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  async function handleBlockSelected() {
    if (pending.size === 0) return;
    setSaving(true);
    await fetch("/api/blocked-dates/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dates: Array.from(pending) }),
    });
    setPending(new Set());
    setSaving(false);
    load();
  }

  async function handleUnblock(date) {
    await fetch(`/api/blocked-dates/${date}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="card">
      <h2>Pickup availability</h2>
      <p style={{ fontSize: "0.9rem", color: "rgba(38,55,42,0.7)", marginTop: "-10px" }}>
        Click a date to select it, click more to select several at once, then
        block them all together. Blocked dates won't be pickable at checkout.
        Click an already-blocked (struck-through) date to make it available
        again.
      </p>

      <DatePicker
        selectedDates={pending}
        onSelect={toggleDate}
        blockedDates={blockedSet}
        monthsAhead={4}
      />

      {pending.size > 0 ? (
        <button
          className="btn btn-primary"
          style={{ marginTop: "12px" }}
          onClick={handleBlockSelected}
          disabled={saving}
        >
          {saving
            ? "Blocking…"
            : `Block ${pending.size} selected date${pending.size === 1 ? "" : "s"}`}
        </button>
      ) : null}

      <div style={{ marginTop: "20px" }}>
        <h3 style={{ fontSize: "0.9rem", margin: "0 0 6px" }}>
          Blocked dates ({blocked.length})
        </h3>
        {blocked.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "rgba(38,55,42,0.5)" }}>None yet.</p>
        ) : (
          <div className="blocked-dates-list">
            {blocked.map((b) => (
              <div className="blocked-date-row" key={b.date}>
                <span>{formatPretty(b.date)}</span>
                <button className="link-btn" onClick={() => handleUnblock(b.date)}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
