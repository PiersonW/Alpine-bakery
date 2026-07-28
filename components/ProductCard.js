"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);

  const optionGroup = product.optionGroup || null;
  const [selectedChoice, setSelectedChoice] = useState(
    optionGroup?.choices?.[0]?.label || ""
  );

  const images = product.images && product.images.length > 0
    ? product.images
    : (product.image_url ? [product.image_url] : []);
  const hasMultiple = images.length > 1;

  const activeChoice = optionGroup?.choices?.find((c) => c.label === selectedChoice);
  const displayPriceCents = product.price_cents + (activeChoice?.price_delta_cents || 0);
  const price = (displayPriceCents / 100).toFixed(2);

  function prevImage(e) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function nextImage(e) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  }

  function handleAddToCart() {
    if (optionGroup && activeChoice) {
      addItem(product, {
        label: optionGroup.label,
        value: activeChoice.label,
        priceDeltaCents: activeChoice.price_delta_cents || 0,
      });
    } else {
      addItem(product);
    }
  }

  return (
    <div className="ticket">
      {!product.available ? <span className="sold-out-badge">Sold out</span> : null}
      <div
        className="ticket-photo"
        style={images[index] ? { backgroundImage: `url(${images[index]})` } : undefined}
      >
        {hasMultiple ? (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-arrow-left"
              onClick={prevImage}
              aria-label="Previous photo"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              className="gallery-arrow gallery-arrow-right"
              onClick={nextImage}
              aria-label="Next photo"
            >
              &rsaquo;
            </button>
            <div className="gallery-dots">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={"gallery-dot" + (i === index ? " gallery-dot-active" : "")}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="ticket-body">
        <h3 className="ticket-name">{product.name}</h3>
        {product.description ? (
          <p className="ticket-desc">{product.description}</p>
        ) : null}

        {optionGroup ? (
          <div className="field" style={{ margin: "2px 0 6px" }}>
            <label htmlFor={`option-${product.id}`} style={{ fontSize: "0.8rem" }}>
              {optionGroup.label}
            </label>
            <select
              id={`option-${product.id}`}
              value={selectedChoice}
              onChange={(e) => setSelectedChoice(e.target.value)}
            >
              {optionGroup.choices.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                  {c.price_delta_cents
                    ? ` (${c.price_delta_cents > 0 ? "+" : "-"}$${Math.abs(
                        c.price_delta_cents / 100
                      ).toFixed(2)})`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="ticket-perforation" />
        <div className="ticket-footer">
          <span className="ticket-price">${price}</span>
          <button
            className="btn btn-primary"
            disabled={!product.available}
            onClick={handleAddToCart}
          >
            {product.available ? "Add to cart" : "Sold out"}
          </button>
        </div>
      </div>
    </div>
  );
}
