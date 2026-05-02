import { motion } from "framer-motion";

type Props = {
  level: number;
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

const WAVE_FRONT =
  "M0,10 C25,4 50,16 75,10 C100,4 125,16 150,10 C175,4 200,16 225,10 C250,4 275,16 300,10 C325,4 350,16 375,10 C400,4 425,16 450,10 L450,100 L0,100 Z";
const WAVE_BACK =
  "M0,8 C25,2 50,14 75,8 C100,2 125,14 150,8 C175,2 200,14 225,8 C250,2 275,14 300,8 C325,2 350,14 375,8 C400,2 425,14 450,8 L450,100 L0,100 Z";

export function WaterTank({
  level,
  height = 110,
  width = "100%",
  showLabel = true,
  className = "",
}: Props) {
  const color = tankColor(level);
  const fillY = 100 - Math.min(100, Math.max(0, level));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass ${className}`}
      style={{ height, width }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${color}22 0%, transparent 70%)`,
        }}
      />

      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        overflow="hidden"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id={`wg-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
          <clipPath id="tank-clip">
            <rect x="0" y="0" width="200" height="100" />
          </clipPath>
        </defs>

        <g clipPath="url(#tank-clip)">
          <motion.g
            animate={{ y: fillY }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
          >
            <motion.g
              style={{ opacity: 0.55 }}
              animate={{ x: [0, -200] }}
              transition={{ duration: 7, ease: "linear", repeat: Infinity }}
            >
              <path d={WAVE_BACK} fill={color} opacity="0.6" />
            </motion.g>

            <motion.g
              animate={{ x: [0, -200] }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            >
              <path d={WAVE_FRONT} fill={`url(#wg-${color})`} />
            </motion.g>
          </motion.g>
        </g>
      </svg>

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
