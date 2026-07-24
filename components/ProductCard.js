"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);
  const price = (product.price_cents / 100).toFixed(2);
  const images = product.images && product.images.length > 0
    ? product.images
    : (product.image_url ? [product.image_url] : []);
  const hasMultiple = images.length > 1;

  function prevImage(e) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function nextImage(e) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
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
        <div className="ticket-perforation" />
        <div className="ticket-footer">
          <span className="ticket-price">${price}</span>
          <button
            className="btn btn-primary"
            disabled={!product.available}
            onClick={() => addItem(product)}
          >
            {product.available ? "Add to cart" : "Sold out"}
          </button>
        </div>
      </div>
    </div>
  );
}
