"use client";

import { useState } from "react";
import { CATEGORIES } from "../lib/categories";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const MAX_PHOTOS = 5;

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

function initialImages(initial) {
  if (!initial) return [];
  try {
    const parsed = initial.image_urls ? JSON.parse(initial.image_urls) : [];
    if (parsed.length > 0) return parsed;
  } catch (e) {
    // fall through to legacy single image
  }
  return initial.image_url ? [initial.image_url] : [];
}

function initialOptionGroup(initial) {
  if (!initial?.options) return null;
  try {
    return JSON.parse(initial.options);
  } catch (e) {
    return null;
  }
}

const BLANK_CHOICES = [
  { label: "", priceDelta: "0.00" },
  { label: "", priceDelta: "0.00" },
];

export default function AdminProductForm({ initial, onSaved, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(
    initial ? (initial.price_cents / 100).toFixed(2) : ""
  );
  const [images, setImages] = useState(initialImages(initial));
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [available, setAvailable] = useState(
    initial ? Boolean(initial.available) : true
  );
  const [featured, setFeatured] = useState(
    initial ? Boolean(initial.featured) : false
  );
  const [hidden, setHidden] = useState(
    initial ? Boolean(initial.hidden) : false
  );

  const existingOptions = initialOptionGroup(initial);
  const [hasOptions, setHasOptions] = useState(Boolean(existingOptions));
  const [optionLabel, setOptionLabel] = useState(existingOptions?.label || "");
  const [choices, setChoices] = useState(
    existingOptions?.choices?.length
      ? existingOptions.choices.map((c) => ({
          label: c.label,
          priceDelta: ((c.price_delta_cents || 0) / 100).toFixed(2),
        }))
      : BLANK_CHOICES
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const room = MAX_PHOTOS - images.length;
    const toUpload = files.slice(0, room);
    if (files.length > room) {
      setError(`Only ${MAX_PHOTOS} photos allowed per product -- added the first ${room}.`);
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(toUpload.map(uploadImage));
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError("Couldn't upload one of those photos. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function updateChoice(index, key, value) {
    setChoices((prev) => prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)));
  }

  function addChoice() {
    setChoices((prev) => [...prev, { label: "", priceDelta: "0.00" }]);
  }

  function removeChoice(index) {
    setChoices((prev) => prev.filter((_, i) => i !== index));
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

    let optionsPayload = null;
    if (hasOptions) {
      const cleanChoices = choices
        .filter((c) => c.label.trim())
        .map((c) => ({
          label: c.label.trim(),
          price_delta_cents: Math.round((parseFloat(c.priceDelta) || 0) * 100),
        }));
      if (!optionLabel.trim() || cleanChoices.length < 2) {
        setError('Give the option a name (like "Size") and at least two choices, or turn options off.');
        return;
      }
      optionsPayload = { label: optionLabel.trim(), choices: cleanChoices };
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price_cents: Math.round(priceNumber * 100),
      image_urls: images,
      available,
      category,
      featured,
      hidden,
      options: optionsPayload,
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
      setImages([]);
      setCategory(CATEGORIES[0]);
      setAvailable(true);
      setFeatured(false);
      setHidden(false);
      setHasOptions(false);
      setOptionLabel("");
      setChoices(BLANK_CHOICES);
    }
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Photos ({images.length}/{MAX_PHOTOS})</label>
        {images.length > 0 ? (
          <div className="photo-thumb-grid">
            {images.map((url, i) => (
              <div className="photo-thumb" key={url + i}>
                <div
                  className="photo-thumb-img"
                  style={{ backgroundImage: `url(${url})` }}
                />
                {i === 0 ? <span className="photo-thumb-primary">Main</span> : null}
                <button
                  type="button"
                  className="photo-thumb-remove"
                  onClick={() => removeImage(i)}
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="image-preview">
            {uploading ? "Uploading…" : "No photos yet"}
          </div>
        )}
        {images.length < MAX_PHOTOS ? (
          <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={uploading} />
        ) : (
          <p style={{ fontSize: "0.8rem", color: "rgba(38,55,42,0.5)" }}>
            Remove a photo to add another.
          </p>
        )}
        <p style={{ fontSize: "0.75rem", color: "rgba(38,55,42,0.5)", marginTop: "4px" }}>
          The first photo is the main one customers see; the rest show as a gallery.
        </p>
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
        <p style={{ fontSize: "0.75rem", color: "rgba(38,55,42,0.5)", marginTop: "4px" }}>
          If this product has choices with different prices (below), enter the base/default price here.
        </p>
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
            checked={hasOptions}
            onChange={(e) => setHasOptions(e.target.checked)}
          />
          This product has size or flavor choices
        </label>
      </div>

      {hasOptions ? (
        <div className="field" style={{ border: "1px solid var(--line)", borderRadius: "8px", padding: "14px" }}>
          <label htmlFor="optionLabel">Choice name (e.g. &quot;Size&quot; or &quot;Flavor&quot;)</label>
          <input
            id="optionLabel"
            type="text"
            value={optionLabel}
            onChange={(e) => setOptionLabel(e.target.value)}
            placeholder="Size"
            style={{ marginBottom: "14px" }}
          />

          <label>Choices customers can pick from</label>
          {choices.map((choice, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={choice.label}
                onChange={(e) => updateChoice(i, "label", e.target.value)}
                placeholder={i === 0 ? "Large loaf" : "Small loaf"}
                style={{ flex: 2 }}
              />
              <input
                type="number"
                step="0.01"
                value={choice.priceDelta}
                onChange={(e) => updateChoice(i, "priceDelta", e.target.value)}
                placeholder="0.00"
                style={{ flex: 1 }}
                title="Price difference from the base price above. Use a negative number for a discount, e.g. -2.00"
              />
              {choices.length > 2 ? (
                <button type="button" className="link-btn" onClick={() => removeChoice(i)}>
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          <button type="button" className="link-btn" onClick={addChoice}>
            + Add another choice
          </button>
          <p style={{ fontSize: "0.75rem", color: "rgba(38,55,42,0.5)", marginTop: "8px" }}>
            The number next to each choice is added to (or, if negative, subtracted from) the base price. Leave at 0.00 if every choice costs the same.
          </p>
        </div>
      ) : null}

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

      <div className="field">
        <label className="availability-toggle">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => setHidden(e.target.checked)}
          />
          Hide from menu entirely (e.g. out of season)
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
