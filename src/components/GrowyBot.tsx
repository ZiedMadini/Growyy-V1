import { motion } from "framer-motion";

type Props = {
  isThinking?: boolean;
  isTalking?: boolean;
  size?: number;
};

export function GrowyBot({ isThinking = false, isTalking = false, size = 80 }: Props) {
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      {/* leaf on top */}
      <svg
        width={size * 0.4}
        height={size * 0.35}
        viewBox="0 0 40 35"
        className={isThinking ? "leaf-sway-fast" : "leaf-sway"}
        style={{ marginBottom: -4 }}
      >
        <path
          d="M20 33 C 8 28, 4 12, 18 2 C 30 10, 36 24, 24 32"
          fill="#2EA84A"
          stroke="#5fd47e"
          strokeWidth="1"
        />
        <path d="M20 33 L 19 8" stroke="#0a1a0f" strokeWidth="0.8" fill="none" />
      </svg>

      {/* head */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        className={isThinking ? "bot-thinking" : ""}
      >
        <defs>
          <radialGradient id="bot-grad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </radialGradient>
          <radialGradient id="eye-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5fd47e" />
            <stop offset="100%" stopColor="#2EA84A" />
          </radialGradient>
        </defs>

        {/* head body — frosted glass disc */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="url(#bot-grad)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <ellipse cx="40" cy="22" rx="22" ry="6" fill="rgba(255,255,255,0.05)" />

        {/* antenna dot */}
        <circle cx="40" cy="6" r="2" fill="#2EA84A">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="40" y1="8" x2="40" y2="14" stroke="#2EA84A" strokeWidth="1" />

        {/* eyes */}
        {isThinking ? (
          <>
            <circle cx="28" cy="40" r="3" fill="#2EA84A">
              <animate
                attributeName="opacity"
                values="0.2;1;0.2"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="52" cy="40" r="3" fill="#2EA84A">
              <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
            </circle>
          </>
        ) : (
          <>
            <ellipse cx="28" cy="40" rx="4" ry="5" fill="url(#eye-glow)" className="bot-blink" />
            <ellipse cx="52" cy="40" rx="4" ry="5" fill="url(#eye-glow)" className="bot-blink" />
          </>
        )}

        {/* mouth */}
        {isTalking ? (
          <ellipse cx="40" cy="55" rx="6" ry="2" fill="#5fd47e" className="bot-mouth-talk" />
        ) : (
          <path
            d="M32 55 Q 40 60, 48 55"
            stroke="#5fd47e"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* cheek glow */}
        <circle cx="20" cy="50" r="3" fill="#2EA84A" opacity="0.3" />
        <circle cx="60" cy="50" r="3" fill="#2EA84A" opacity="0.3" />
      </motion.svg>
    </div>
  );
}
