export function LeafLoader({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="loading">
      <path
        d="M20 36 L20 14"
        stroke="#2EA84A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 14 C 8 12, 4 4, 18 2 C 30 6, 32 18, 22 22 C 18 24, 16 20, 20 14 Z"
        stroke="#5fd47e"
        strokeWidth="1.5"
        fill="rgba(46,168,74,0.2)"
        className="leaf-grow"
      />
    </svg>
  );
}
