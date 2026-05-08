/** Ambient greenhouse silhouettes for screen backgrounds. */
export function GreenhouseBg({ variant = "leaves" }: { variant?: "leaves" | "pipes" }) {
  if (variant === "pipes") {
    return (
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.08 }}
      >
        <g stroke="#5fd47e" strokeWidth="1.2" fill="none">
          <path d="M20 120 H180 Q200 120 200 140 V260 Q200 280 220 280 H400" />
          <path d="M20 360 H100 Q120 360 120 380 V520 Q120 540 140 540 H400" />
          <path d="M20 620 H260 Q280 620 280 640 V780" />
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
      style={{ opacity: 0.07, filter: "blur(1.5px)" }}
    >
      <g fill="#2EA84A" className="leaf-drift">
        {/* top-left large leaf */}
        <path d="M20 50 C 80 10, 200 60, 230 190 C 245 260, 180 320, 120 300 C 40 270, 10 190, 20 50 Z" />
        {/* top-right large leaf */}
        <path d="M260 15 C 340 45, 395 145, 378 270 C 366 330, 298 332, 268 278 C 218 200, 230 60, 260 15 Z" />
        {/* bottom-left large leaf */}
        <path d="M15 490 C 75 450, 198 510, 228 640 C 244 710, 174 758, 118 742 C 38 712, 8 632, 15 490 Z" />
        {/* bottom-right triangle leaf */}
        <path d="M282 592 C 358 562, 396 668, 380 790 L 282 790 Z" />
        {/* mid-left small accent */}
        <path d="M22 262 C 62 238, 122 268, 136 322 C 143 352, 112 372, 82 362 C 36 344, 14 312, 22 262 Z" opacity="0.75" />
        {/* mid-right small accent */}
        <path d="M302 342 C 356 318, 394 362, 388 418 C 385 444, 358 452, 340 440 C 306 420, 296 386, 302 342 Z" opacity="0.75" />
        {/* lower-left tiny */}
        <path d="M82 712 C 122 698, 168 720, 172 768 L 82 790 Z" opacity="0.65" />
        {/* upper-right tiny */}
        <path d="M320 162 C 360 140, 394 170, 392 212 C 390 232, 368 240, 352 230 C 320 212, 312 192, 320 162 Z" opacity="0.65" />
      </g>
    </svg>
  );
}
