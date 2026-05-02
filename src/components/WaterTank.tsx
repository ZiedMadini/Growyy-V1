import { motion } from "framer-motion";

type Props = {
  level: number; // 0-100
  height?: number;
  width?: number | string;
  showLabel?: boolean;
  className?: string;
};

function tankColor(level: number) {
  if (level < 20) return "#FF6B6B";
  if (level < 50) return "#FFD166";
  return "#2EA84A";
}

export function WaterTank({ level, height = 110, width = "100%", showLabel = true, className = "" }: Props) {
  const color = tankColor(level);
  const fillY = 100 - Math.min(100, Math.max(0, level));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass ${className}`}
      style={{ height, width }}
    >
      {/* gradient ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${color}22 0%, transparent 70%)`,
        }}
      />

      {/* SVG water — fills from bottom; we animate the wrapper Y position via the path's Y */}
      <motion.svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        initial={false}
      >
        <defs>
          <linearGradient id={`wg-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        <motion.g
          animate={{ y: fillY }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
        >
          {/* back wave (slower, darker) */}
          <g className="wave-back" style={{ opacity: 0.55 }}>
            <path
              d="M0,8 C25,2 50,14 75,8 C100,2 125,14 150,8 C175,2 200,14 225,8 L225,200 L0,200 Z"
              fill={color}
              opacity="0.6"
            />
            <path
              d="M200,8 C225,2 250,14 275,8 C300,2 325,14 350,8 C375,2 400,14 425,8 L425,200 L200,200 Z"
              fill={color}
              opacity="0.6"
            />
          </g>
          {/* front wave (faster, lighter) */}
          <g className="wave-front">
            <path
              d="M0,10 C25,4 50,16 75,10 C100,4 125,16 150,10 C175,4 200,16 225,10 L225,200 L0,200 Z"
              fill={`url(#wg-${color})`}
            />
            <path
              d="M200,10 C225,4 250,16 275,10 C300,4 325,16 350,10 C375,4 400,16 425,10 L425,200 L200,200 Z"
              fill={`url(#wg-${color})`}
            />
          </g>
        </motion.g>
      </motion.svg>

      {/* glossy top sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/20 pointer-events-none" />

      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-num text-2xl font-semibold text-ink drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
            {Math.round(level)}%
          </span>
        </div>
      )}
    </div>
  );
}
