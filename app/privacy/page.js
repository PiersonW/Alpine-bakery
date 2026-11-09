import Navbar from "../../components/Navbar";

export const metadata = {
  title: "Privacy Policy | Alpine Bakery",
  description: "How Alpine Bakery handles your information.",
};

const CONTACT_EMAIL = "Alpinebakery0901@gmail.com";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: "720px", padding: "40px 24px 72px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "4px" }}>
          Privacy Policy
        </h1>
        <p style={{ opacity: 0.7, marginTop: 0 }}>Effective November 9, 2026</p>

        <p>
          This policy explains what Alpine Bakery collects when you use
          alpinebakery.org or the Alpine Bakery mobile app, and how we use it.
          We only collect what we need to fill your order.
        </p>

        <h2 style={{ fontSize: "1.25rem" }}>What we collect</h2>
        <ul>
          <li>
            <strong>Order details:</strong> what you ordered, your total, and
            your pickup date and time.
          </li>
          <li>
            <strong>Contact details:</strong> the name, email address and phone
            number you enter at checkout, so we can reach you about your order.
          </li>
          <li>
            <strong>Payment details:</strong> you pay through Stripe. Stripe
            collects and processes your card or other payment details. We never
            see or store your full card number.
          </li>
        </ul>

        <h2 style={{ fontSize: "1.25rem" }}>What stays on your device</h2>
        <p>
          Your cart is saved on your phone or in your browser. The app also
          keeps a list of orders you placed so you can order again. That list
          stays on your phone and is removed if you delete the app.
        </p>

        <h2 style={{ fontSize: "1.25rem" }}>How we use it</h2>
        <p>
          We use your information to take payment, bake and prepare your order,
          have it ready for pickup, and contact you with questions about it. We
          do not sell your information, show ads, or use tracking or analytics
          tools.
        </p>

        <h2 style={{ fontSize: "1.25rem" }}>Who helps us run this</h2>
        <p>
          We share information only with the service providers needed to run
          the bakery&rsquo;s ordering system: Stripe (payments and receipts),
          Vercel (website hosting), Turso (order records), and Resend (order
          notification emails to the bakery). Our website also loads its fonts
          from Google Fonts. We may share information if the law requires it.
        </p>

        <h2 style={{ fontSize: "1.25rem" }}>Keeping and deleting your information</h2>
        <p>
          We keep order records for as long as we need them to run the bakery
          and meet tax and accounting requirements. You don&rsquo;t need an
          account to order. To ask what we have about you, or to have it
          corrected or deleted, email us at the address below. We may need to
          keep some records where the law requires it.
        </p>

        <h2 style={{ fontSize: "1.25rem" }}>Children</h2>
        <p>
          Our website and app are not directed to children under 13, and we do
          not knowingly collect information from them.
        </p>

        <h2 style={{ fontSize: "1.25rem" }}>Changes</h2>
        <p>
          If this policy changes, we&rsquo;ll update this page and its effective
          date.
        </p>

        <h2 style={{ fontSize: "1.25rem" }}>Contact us</h2>
        <p>
          Alpine Bakery, 90 East Pioneer Dr, Alpine, UT
          <br />
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    </>
  );
}
