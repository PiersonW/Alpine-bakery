"use client";

import { useEffect, useState } from "react";

const SIZE_OPTIONS = [
  { value: "small", label: "Small", px: "0.85rem" },
  { value: "medium", label: "Medium", px: "1rem" },
  { value: "large", label: "Large", px: "1.25rem" },
  { value: "xlarge", label: "Extra Large", px: "1.6rem" },
];

const FONT_OPTIONS = [
  { value: "body", label: "Classic (Work Sans)", css: '"Work Sans", sans-serif' },
  { value: "display", label: "Elegant Serif (Fraunces)", css: '"Fraunces", serif' },
  { value: "mono", label: "Typewriter (JetBrains Mono)", css: '"JetBrains Mono", monospace' },
  { value: "playfair", label: "Classic Serif (Playfair Display)", css: '"Playfair Display", serif' },
  { value: "poppins", label: "Modern Sans (Poppins)", css: '"Poppins", sans-serif' },
  { value: "caveat", label: "Handwritten (Caveat)", css: '"Caveat", cursive' },
  { value: "pacifico", label: "Playful Script (Pacifico)", css: '"Pacifico", cursive' },
  { value: "dancing", label: "Elegant Script (Dancing Script)", css: '"Dancing Script", cursive' },
  { value: "oswald", label: "Bold Condensed (Oswald)", css: '"Oswald", sans-serif' },
  { value: "merriweather", label: "Traditional Serif (Merriweather)", css: '"Merriweather", serif' },
];

function fontToCss(font) {
  const match = FONT_OPTIONS.find((f) => f.value === font);
  return match ? match.css : "var(--font-body)";
}

function sizeToPx(size) {
  const match = SIZE_OPTIONS.find((s) => s.value === size);
  return match ? match.px : "1rem";
}

function formatDate(dateStr) {
  // Stored as SQLite UTC "YYYY-MM-DD HH:MM:SS"
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toggleBtnStyle(active) {
  return {
    minWidth: "42px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: active ? "1px solid #3d2e24" : "1px solid rgba(61,46,36,0.25)",
    background: active ? "#3d2e24" : "transparent",
    color: active ? "#f7f2ea" : "#3d2e24",
    fontWeight: 600,
    cursor: "pointer",
  };
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState("");
  const [fontSize, setFontSize] = useState("medium");
  const [fontFamily, setFontFamily] = useState("body");
  const [fontColor, setFontColor] = useState("#3d2e24");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [align, setAlign] = useState("left");
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
      body: JSON.stringify({
        message,
        font_size: fontSize,
        font_family: fontFamily,
        font_color: fontColor,
        font_weight: bold ? "bold" : "normal",
        font_style: italic ? "italic" : "normal",
        text_align: align,
      }),
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

  const previewStyle = {
    fontSize: sizeToPx(fontSize),
    fontFamily: fontToCss(fontFamily),
    color: fontColor,
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? "italic" : "normal",
    textAlign: align,
    margin: 0,
  };

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

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            marginTop: "12px",
          }}
        >
          <label style={{ fontSize: "0.85rem" }}>
            Font{" "}
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              style={{ marginLeft: "4px" }}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Size{" "}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              style={{ marginLeft: "4px" }}
            >
              {SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
            Color
            <input
              type="color"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
              style={{ width: "32px", height: "28px", padding: 0, border: "none", cursor: "pointer" }}
            />
          </label>

          <button
            type="button"
            onClick={() => setBold((b) => !b)}
            style={toggleBtnStyle(bold)}
            aria-pressed={bold}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => setItalic((i) => !i)}
            style={{ ...toggleBtnStyle(italic), fontStyle: "italic" }}
            aria-pressed={italic}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => setAlign((a) => (a === "left" ? "center" : "left"))}
            style={toggleBtnStyle(align === "center")}
            aria-pressed={align === "center"}
            title="Center align"
          >
            {align === "center" ? "Centered" : "Left"}
          </button>
        </div>

        <div
          style={{
            marginTop: "12px",
            padding: "14px 16px",
            border: "1px dashed rgba(61,46,36,0.3)",
            borderRadius: "10px",
            background: "rgba(61,46,36,0.03)",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "rgba(38,55,42,0.55)", margin: "0 0 6px" }}>
            Preview
          </p>
          <p style={previewStyle}>{message.trim() || "Your update will look like this."}</p>
        </div>

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
                <strong>{formatDate(a.created_at)}</strong> —{" "}
                <span
                  style={{
                    fontSize: sizeToPx(a.font_size),
                    fontFamily: fontToCss(a.font_family),
                    color: a.font_color,
                    fontWeight: a.font_weight === "bold" ? 700 : 400,
                    fontStyle: a.font_style === "italic" ? "italic" : "normal",
                  }}
                >
                  {a.message}
                </span>
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
