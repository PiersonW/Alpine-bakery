"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export default function Navbar() {
  const { totalCount } = useCart();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <img src="/logo.png" alt="Alpine Bakery" className="brand-logo" />
        </Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/shop">Full Menu</Link>
          <Link href="/cart" className="cart-pill">
            Cart {totalCount > 0 ? `(${totalCount})` : ""}
          </Link>
        </div>
      </div>
    </nav>
  );
}
