// src/components/welcome/FarmerScene.tsx
import { motion } from "framer-motion";

export const FARMER_SCENE_HEIGHT = 600;

type Props = {
  /** 0 = neutral, 1 = full smile + sparkles */
  celebration: number;
};

export function FarmerScene({ celebration }: Props) {
  return (
    <svg
      viewBox="0 0 400 600"
      width={400}
      height={FARMER_SCENE_HEIGHT}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3a25" />
          <stop offset="100%" stopColor="#0a1a0f" />
        </linearGradient>
        <radialGradient id="sparkleGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFD166" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* GROUND */}
      <rect x="0" y="450" width="400" height="150" fill="url(#ground)" />
      <ellipse cx="200" cy="455" rx="180" ry="14" fill="#2EA84A" opacity="0.25" />

      {/* FARMER BODY */}
      <g>
        <rect x="170" y="380" width="20" height="80" rx="8" fill="#3a4a55" />
        <rect x="210" y="380" width="20" height="80" rx="8" fill="#3a4a55" />
        <path d="M 140 260 Q 140 240 200 240 Q 260 240 260 260 L 250 400 L 150 400 Z" fill="#2EA84A" />
        <rect x="172" y="240" width="56" height="20" rx="4" fill="#1a3a25" />
        <path d="M 145 280 Q 110 320 130 380" stroke="#e8c4a0" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 255 280 Q 290 320 270 380" stroke="#e8c4a0" strokeWidth="14" fill="none" strokeLinecap="round" />
        <circle cx="200" cy="200" r="40" fill="#e8c4a0" />
        <ellipse cx="200" cy="170" rx="65" ry="8" fill="#5d4634" />
        <path d="M 168 170 Q 168 140 200 140 Q 232 140 232 170 Z" fill="#7a5a40" />
        <ellipse cx="200" cy="160" rx="32" ry="10" fill="#5d4634" />
        <circle cx="186" cy="200" r="2.5" fill="#1a0606" />
        <circle cx="214" cy="200" r="2.5" fill="#1a0606" />
        <motion.circle cx="180" cy="215" r="5" fill="#FF6B6B" animate={{ opacity: 0.3 + celebration * 0.4 }} />
        <motion.circle cx="220" cy="215" r="5" fill="#FF6B6B" animate={{ opacity: 0.3 + celebration * 0.4 }} />
        <motion.path
          d={celebration > 0.5 ? "M 184 220 Q 200 236 216 220" : "M 186 224 Q 200 226 214 224"}
          fill="none"
          stroke="#1a0606"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{ pathLength: 1 }}
        />
      </g>

      {/* BUCKET */}
      <g>
        <path d="M 130 380 L 270 380 L 255 460 L 145 460 Z" fill="#8a6a4a" stroke="#5d4634" strokeWidth="2" />
        <ellipse cx="200" cy="380" rx="70" ry="8" fill="#a08060" stroke="#5d4634" strokeWidth="2" />
        <circle cx="170" cy="375" r="14" fill="#FF6B6B" />
        <circle cx="170" cy="372" r="4" fill="rgba(255,255,255,0.4)" />
        <circle cx="205" cy="370" r="15" fill="#FF6B6B" />
        <circle cx="205" cy="367" r="4" fill="rgba(255,255,255,0.4)" />
        <circle cx="235" cy="376" r="13" fill="#5fd47e" />
        <circle cx="235" cy="373" r="4" fill="rgba(255,255,255,0.4)" />
      </g>

      {/* SPARKLES */}
      {celebration > 0.5 && (
        <g>
          {[
            { x: 130, y: 350, d: 0 },
            { x: 270, y: 340, d: 0.2 },
            { x: 110, y: 280, d: 0.4 },
            { x: 290, y: 270, d: 0.6 },
            { x: 200, y: 130, d: 0.3 },
          ].map((s) => (
            <g key={`${s.x}-${s.y}`}>
              <circle cx={s.x} cy={s.y} r="14" fill="url(#sparkleGlow)">
                <animate attributeName="r" values="0;18;0" dur="1.6s" begin={`${s.d}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="1.6s" begin={`${s.d}s`} repeatCount="indefinite" />
              </circle>
              <path
                d={`M ${s.x} ${s.y - 10} L ${s.x} ${s.y + 10} M ${s.x - 10} ${s.y} L ${s.x + 10} ${s.y}`}
                stroke="#FFD166"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.9"
              >
                <animate attributeName="opacity" values="0;1;0" dur="1.6s" begin={`${s.d}s`} repeatCount="indefinite" />
              </path>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
