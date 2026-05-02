import { motion } from "framer-motion";
import { Thermometer, Droplets, FlaskConical, Zap } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";

const METRICS = [
  {
    icon: Thermometer,
    value: 24.2,
    unit: "°C",
    label: "Temp",
    decimals: 1,
    min: 22,
    max: 26,
    color: "#5fd47e",
  },
  {
    icon: Droplets,
    value: 65,
    unit: "%",
    label: "Humidity",
    decimals: 0,
    min: 50,
    max: 80,
    color: "#5fd47e",
  },
  {
    icon: FlaskConical,
    value: 5.9,
    unit: "pH",
    label: "pH",
    decimals: 1,
    min: 5.5,
    max: 6.5,
    color: "#FFD166",
  },
  { icon: Zap, value: 1.6, unit: "mS", label: "EC", decimals: 1, min: 0, max: 3, color: "#5fd47e" },
];

const CIRC = 188;

export function MonitoringScene() {
  return (
    <div className="h-full flex flex-col px-5 pt-2">
      <div className="grid grid-cols-2 gap-3 flex-1">
        {METRICS.map(({ icon: Icon, value, unit, label, decimals, min, max, color }, i) => {
          const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
          const offset = CIRC - (pct / 100) * CIRC;
          return (
            <motion.div
              key={label}
              className="glass rounded-3xl p-4 flex flex-col"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(46,168,74,0.12)" }}
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-[11px] text-ink-dim font-semibold uppercase tracking-widest">
                  {label}
                </p>
              </div>

              <div className="mt-2 relative flex items-end justify-center" style={{ height: 96 }}>
                <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
                  <path
                    d="M 10 55 A 40 40 0 1 1 90 55"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M 10 55 A 40 40 0 1 1 90 55"
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    initial={{ strokeDashoffset: CIRC }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.0, delay: i * 0.08 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}99)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                  <p className="text-2xl font-num font-semibold leading-none text-ink">
                    <AnimatedNumber value={value} decimals={decimals} duration={900} />
                  </p>
                  <p className="text-[10px] text-ink-dim mt-0.5">{unit}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-5 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
          Feature 01
        </p>
        <h2 className="text-2xl font-bold text-ink mt-1">Live Monitoring</h2>
        <p className="text-sm text-ink-dim mt-2 leading-relaxed">
          Every sensor in your greenhouse, breathing live. Temperature, pH, EC, humidity — always in
          your pocket.
        </p>
      </div>
    </div>
  );
}
