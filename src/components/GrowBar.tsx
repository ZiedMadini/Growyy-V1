import { motion } from "framer-motion";

const STAGE_COLOR: Record<string, string> = {
  Flowering:   "#FFD166",
  Vegetative:  "#5fd47e",
  Propagation: "#8ab894",
  Flushing:    "#5fd47e",
};

function SeedlingPlant({ color }: { color: string }) {
  return (
    <svg width="10" height="22" viewBox="0 0 10 22" fill="none" overflow="visible">
      <line x1="5" y1="22" x2="5" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 13 C2 10 0 7 3 9" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M5 13 C8 10 10 7 7 9" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
      <circle cx="5" cy="5.5" r="3" fill={color} opacity="0.85" />
    </svg>
  );
}

function BushPlant({ color }: { color: string }) {
  return (
    <svg width="14" height="28" viewBox="0 0 14 28" fill="none" overflow="visible">
      <line x1="7" y1="28" x2="7" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 2 C4 -2 10 -2 7 2" fill={color} opacity="0.85" />
      <path d="M7 14 C1 10 0 6 4 12"  stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M7 14 C13 10 14 6 10 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M7 21 C1 17 0 13 4 19"  stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M7 21 C13 17 14 13 10 19" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function FlowerPlant({ color }: { color: string }) {
  return (
    <svg width="14" height="30" viewBox="0 0 14 30" fill="none" overflow="visible">
      <line x1="7" y1="30" x2="7" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 17 C1 13 0 9 4 15"  stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M7 17 C13 13 14 9 10 15" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M7 23 C1 19 0 15 4 21"  stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M7 23 C13 19 14 15 10 21" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* petals */}
      <ellipse cx="7"  cy="1.5" rx="2" ry="3"   fill="#FFD166" opacity="0.9" />
      <ellipse cx="3"  cy="4"   rx="2" ry="3"   fill="#FFD166" opacity="0.8" transform="rotate(-45 3 4)" />
      <ellipse cx="11" cy="4"   rx="2" ry="3"   fill="#FFD166" opacity="0.8" transform="rotate(45 11 4)" />
      <circle cx="7" cy="4.5" r="2.2" fill="#FFF5CC" />
    </svg>
  );
}

interface Props {
  pct: number;
  stage: string;
  day: number;
  totalDays: number;
}

export function GrowBar({ pct, stage, day, totalDays }: Props) {
  const color = STAGE_COLOR[stage] ?? "#5fd47e";
  const clampedPct = Math.min(100, Math.max(0, pct));
  const plantLeft = Math.min(88, Math.max(4, clampedPct - 3));

  const PlantIcon =
    stage === "Flowering"
      ? FlowerPlant
      : clampedPct < 30
        ? SeedlingPlant
        : BushPlant;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="relative flex-1" style={{ height: 36 }}>
        {/* soil track */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}70, ${color})` }}
            initial={{ width: "0%" }}
            animate={{ width: `${clampedPct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* plant marker */}
        <motion.div
          className="absolute bottom-1"
          style={{ transformOrigin: "bottom center" }}
          initial={{ left: "4%", scaleY: 0 }}
          animate={{ left: `${plantLeft}%`, scaleY: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ transform: "translateX(-50%)" }}>
            <PlantIcon color={color} />
          </div>
        </motion.div>
      </div>

      <span className="text-[10px] font-num text-ink-dim whitespace-nowrap flex-shrink-0">
        Day <span className="text-ink">{day}</span> / {totalDays}
      </span>
    </div>
  );
}
