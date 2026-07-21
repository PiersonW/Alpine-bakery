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
  const [pending, setPending] = useState(null);
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

  async function handleBlock() {
    if (!pending) return;
    setSaving(true);
    await fetch("/api/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: pending }),
    });
    setPending(null);
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
        Block dates you can&rsquo;t hand off orders. Blocked dates won&rsquo;t
        be pickable at checkout.
      </p>

      <DatePicker
        selected={pending}
        onSelect={(d) => (blockedSet.has(d) ? handleUnblock(d) : setPending(d))}
        blockedDates={blockedSet}
        monthsAhead={4}
      />

      {pending ? (
        <button
          className="btn btn-primary"
          style={{ marginTop: "12px" }}
          onClick={handleBlock}
          disabled={saving}
        >
          {saving ? "Blocking…" : `Block ${formatPretty(pending)}`}
        </button>
      ) : (
        <p style={{ fontSize: "0.8rem", color: "rgba(38,55,42,0.5)", marginTop: "10px" }}>
          Pick a date above to block it. Dates already blocked show
          struck-through — click one to make it available again.
        </p>
      )}

      <div style={{ marginTop: "20px" }}>
        <h3 style={{ fontSize: "0.9rem", margin: "0 0 6px" }}>Blocked dates</h3>
        {blocked.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "rgba(38,55,42,0.5)" }}>None yet.</p>
        ) : (
          blocked.map((b) => (
            <div className="blocked-date-row" key={b.date}>
              <span>{formatPretty(b.date)}</span>
              <button className="link-btn" onClick={() => handleUnblock(b.date)}>
                Unblock
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
