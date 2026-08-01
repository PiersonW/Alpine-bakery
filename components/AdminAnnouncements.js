"use client";

import { useEffect, useState } from "react";

function formatDate(dateStr) {
  // Stored as SQLite UTC "YYYY-MM-DD HH:MM:SS"
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setAnnouncements(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePost(e) {
    e.preventDefault();
    setError("");
    if (!message.trim()) {
      setError("Write something first.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Couldn't post that. Try again.");
      return;
    }
    setMessage("");
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this update?")) return;
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    await fetch("/api/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div className="card">
      <h2>Homepage announcements</h2>
      <p style={{ fontSize: "0.9rem", color: "rgba(38,55,42,0.7)", marginTop: "-10px" }}>
        Post a quick weekly update — what&rsquo;s baking, a pop-up sale, a
        schedule change. It shows up on the homepage, newest first.
      </p>

      <form onSubmit={handlePost} className="field">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="This week: sourdough Saturday, and a small batch of cinnamon rolls Friday only!"
        />
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn btn-primary" disabled={saving} style={{ marginTop: "10px" }}>
          {saving ? "Posting…" : "Post update"}
        </button>
      </form>

      <div className="blocked-dates-list" style={{ marginTop: "18px" }}>
        {loading ? (
          <p>Loading…</p>
        ) : announcements.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "rgba(38,55,42,0.6)" }}>
            No updates posted yet.
          </p>
        ) : (
          announcements.map((a) => (
            <div className="blocked-date-row" key={a.id}>
              <span>
                <strong>{formatDate(a.created_at)}</strong> — {a.message}
              </span>
              <button className="link-btn" onClick={() => handleDelete(a.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
