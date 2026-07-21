"use client";

import { useCart } from "./CartContext";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const price = (product.price_cents / 100).toFixed(2);

  return (
    <div className="ticket">
      {!product.available ? <span className="sold-out-badge">Sold out</span> : null}
      <div
        className="ticket-photo"
        style={product.image_url ? { backgroundImage: `url(${product.image_url})` } : undefined}
      />
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
