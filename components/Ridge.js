// The recurring "signature" visual: a thin mountain-ridge line that
// separates sections, echoing the logo's linework and the Alpine name.
export default function Ridge({ color = "var(--rose-deep)", background = "var(--ivory)" }) {
  return (
    <svg
      className="ridge"
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect width="1200" height="60" fill={background} />
      <polyline
        points="0,50 120,50 200,15 260,38 340,5 420,38 480,15 560,50 1200,50"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
