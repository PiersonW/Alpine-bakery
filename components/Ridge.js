// The recurring "signature" visual: a mountain-ridge line that separates
// sections, echoing the Alpine name. Flip `flip` to invert the fill/background.
export default function Ridge({ color = "var(--spruce)", background = "var(--snowcap)" }) {
  return (
    <svg
      className="ridge"
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect width="1200" height="40" fill={background} />
      <path
        d="M0 40 L80 12 L150 30 L230 6 L310 26 L400 2 L480 22 L560 10 L650 30 L740 8 L830 24 L920 4 L1000 22 L1080 12 L1200 28 L1200 40 Z"
        fill={color}
      />
    </svg>
  );
}
