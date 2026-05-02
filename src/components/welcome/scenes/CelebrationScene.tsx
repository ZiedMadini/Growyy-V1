import { motion } from "framer-motion";
import { GrowyBot } from "@/components/GrowyBot";

const SPARKLE_POSITIONS = [
  { x: "15%", y: "18%", delay: 0.2, size: 6 },
  { x: "80%", y: "14%", delay: 0.5, size: 4 },
  { x: "8%", y: "50%", delay: 0.8, size: 5 },
  { x: "88%", y: "45%", delay: 0.3, size: 7 },
  { x: "25%", y: "72%", delay: 0.6, size: 4 },
  { x: "72%", y: "68%", delay: 0.9, size: 5 },
  { x: "50%", y: "10%", delay: 1.0, size: 4 },
  { x: "40%", y: "80%", delay: 0.4, size: 6 },
];

export function CelebrationScene() {
  return (
    <div className="h-full flex flex-col items-center justify-between px-5 pt-4 pb-2 relative overflow-hidden">
      {/* Radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(46,168,74,0.22) 0%, transparent 70%)",
        }}
      />

      {/* Sparkle dots */}
      {SPARKLE_POSITIONS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            background: i % 2 === 0 ? "#5fd47e" : "#FFD166",
            boxShadow: `0 0 ${s.size * 2}px ${i % 2 === 0 ? "#5fd47e" : "#FFD166"}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0.6, 1, 0],
            scale: [0, 1.2, 0.9, 1.1, 0],
          }}
          transition={{
            duration: 2.4,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* GrowyBot hero */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <GrowyBot size={140} />
        </motion.div>

        <motion.div
          className="text-center px-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-3xl font-bold text-ink leading-tight">
            Welcome to <span style={{ color: "#5fd47e" }}>Growyy</span>
          </h2>
          <p className="text-sm text-ink-dim mt-3 leading-relaxed max-w-[280px] mx-auto">
            Your greenhouse intelligence is set up and ready. Let's start growing smarter.
          </p>
        </motion.div>

        {/* Stat chips */}
        <motion.div
          className="flex gap-2 flex-wrap justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {["4 Rooms", "6 Tanks", "AI Ready"].map((chip) => (
            <span
              key={chip}
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{
                background: "rgba(46,168,74,0.15)",
                border: "1px solid rgba(95,212,126,0.3)",
                color: "#5fd47e",
              }}
            >
              {chip}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
