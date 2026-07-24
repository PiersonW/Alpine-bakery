"use client";

import { useEffect, useState } from "react";

export default function AdminPickupSettings() {
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("18:00");
  const [interval, setInterval] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setStart(data.pickup_start);
        setEnd(data.pickup_end);
        setInterval(data.pickup_interval_minutes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup_start: start,
        pickup_end: end,
        pickup_interval_minutes: Number(interval),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save. Try again.");
      return;
    }
    setSaved(true);
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Pickup hours</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Pickup hours</h2>
      <p style={{ fontSize: "0.9rem", color: "rgba(38,55,42,0.7)", marginTop: "-10px" }}>
        Sets the range of times customers can choose from at checkout.
      </p>
      <form onSubmit={handleSave}>
        <div style={{ display: "flex", gap: "14px" }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="pickup-start">Earliest pickup</label>
            <input
              id="pickup-start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="pickup-end">Latest pickup</label>
            <input
              id="pickup-end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="pickup-interval">Time slot spacing</label>
          <select
            id="pickup-interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every hour</option>
          </select>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {saved ? (
          <p className="pickup-summary" style={{ marginBottom: "10px" }}>
            Saved — new pickup hours are live.
          </p>
        ) : null}

        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save pickup hours"}
        </button>
      </form>
    </div>
  );
}
