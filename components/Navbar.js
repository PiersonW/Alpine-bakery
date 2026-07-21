"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export default function Navbar() {
  const { totalCount } = useCart();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <svg className="brand-mark" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 19L8 8L11.5 14L14 10L22 19H2Z"
              fill="var(--crust)"
            />
          </svg>
          Alpine Bakery
        </Link>
        <div className="nav-links">
          <Link href="/#shop">Shop</Link>
          <Link href="/cart" className="cart-pill">
            Cart {totalCount > 0 ? `(${totalCount})` : ""}
          </Link>
        </div>
      </div>
    </nav>
  );
}
