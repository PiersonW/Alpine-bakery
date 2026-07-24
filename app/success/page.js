"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useCart } from "../../components/CartContext";
import { formatPickupTime } from "../../lib/pickupTimes";

function formatPretty(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const pickupDate = searchParams.get("pickup_date");
  const pickupTime = searchParams.get("pickup_time");

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
        Order received — thank you!
      </h1>
      <p style={{ maxWidth: "48ch", margin: "12px auto 0" }}>
        {pickupDate ? (
          <>
            We&rsquo;ll have it ready for pickup on{" "}
            <strong>
              {formatPretty(pickupDate)}
              {pickupTime ? ` at ${formatPickupTime(pickupTime)}` : ""}
            </strong>
            .
          </>
        ) : (
          "We'll reach out with pickup details."
        )}{" "}
        A receipt is on its way to your email from Stripe.
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </>
  );
}
