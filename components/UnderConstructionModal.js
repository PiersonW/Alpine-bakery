"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function UnderConstructionModal() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  if (!open || pathname?.startsWith("/admin")) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Site notice">
      <div className="modal-card">
        <p className="modal-eyebrow">A note before you browse</p>
        <h2>This site is currently under construction.</h2>
        <p>
          To place an order in the meantime, email{" "}
          <a href="mailto:alpinebakery0901@gmail.com">alpinebakery0901@gmail.com</a>.
        </p>
        <button className="btn btn-primary" onClick={() => setOpen(false)}>
          Continue to site
        </button>
      </div>
    </div>
  );
}
