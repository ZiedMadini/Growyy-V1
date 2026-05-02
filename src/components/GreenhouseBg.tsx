/** Ambient greenhouse silhouettes for screen backgrounds. */
export function GreenhouseBg({ variant = "leaves" }: { variant?: "leaves" | "pipes" }) {
  if (variant === "pipes") {
    return (
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.05 }}
      >
        <g stroke="#5fd47e" strokeWidth="1.2" fill="none">
          <path d="M-20 120 H180 Q200 120 200 140 V260 Q200 280 220 280 H440" />
          <path d="M-20 360 H100 Q120 360 120 380 V520 Q120 540 140 540 H440" />
          <path d="M-20 620 H260 Q280 620 280 640 V780" />
          <circle cx="180" cy="120" r="3" />
          <circle cx="200" cy="280" r="3" />
          <circle cx="120" cy="540" r="3" />
        </g>
      </svg>
    );
  }
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.04, filter: "blur(2px)" }}
    >
      <g fill="#2EA84A">
        <path d="M-50 80 C 40 40, 160 80, 220 200 C 240 260, 180 320, 120 300 C 40 270, -20 200, -50 80 Z" />
        <path d="M260 -20 C 360 20, 460 140, 420 280 C 400 340, 320 320, 280 260 C 220 180, 230 60, 260 -20 Z" />
        <path d="M-40 520 C 60 480, 200 540, 240 660 C 260 720, 180 760, 120 740 C 40 710, -20 640, -40 520 Z" />
        <path d="M280 600 C 380 580, 480 700, 440 820 L 280 820 Z" />
      </g>
    </svg>
  );
}
