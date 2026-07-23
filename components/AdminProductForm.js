"use client";

import { useState } from "react";
import { CATEGORIES } from "../lib/categories";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}

export default function AdminProductForm({ initial, onSaved, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(
    initial ? (initial.price_cents / 100).toFixed(2) : ""
  );
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [available, setAvailable] = useState(
    initial ? Boolean(initial.available) : true
  );
  const [featured, setFeatured] = useState(
    initial ? Boolean(initial.featured) : false
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      setError("Couldn't upload that photo. Try a different image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const priceNumber = parseFloat(price);
    if (!name.trim()) {
      setError("Give it a name.");
      return;
    }
    if (isNaN(priceNumber) || priceNumber <= 0) {
      setError("Enter a price greater than $0.");
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price_cents: Math.round(priceNumber * 100),
      image_url: imageUrl,
      available,
      category,
      featured,
    };

    const url = initial ? `/api/products/${initial.id}` : "/api/products";
    const method = initial ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save. Try again.");
      return;
    }

    if (!initial) {
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setCategory(CATEGORIES[0]);
      setAvailable(true);
      setFeatured(false);
    }
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Photo</label>
        <div
          className="image-preview"
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        >
          {!imageUrl ? (uploading ? "Uploading…" : "No photo yet") : null}
        </div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sourdough loaf"
        />
      </div>

      <div className="field">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Naturally leavened, baked fresh Saturday mornings."
        />
      </div>

      <div className="field">
        <label htmlFor="price">Price (USD)</label>
        <input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="8.00"
        />
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="availability-toggle">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          In stock / available to order
        </label>
      </div>

      <div className="field">
        <label className="availability-toggle">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Feature on homepage (e.g. this week's pop-up items)
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn btn-primary" disabled={saving || uploading}>
          {saving ? "Saving…" : initial ? "Save changes" : "Add product"}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
