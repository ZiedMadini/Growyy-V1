import { motion } from "framer-motion";
import { Droplet, Lightbulb, Wind } from "lucide-react";

const DOSES = [
  { name: "Solution A", amount: "35 ml", pct: 0.78, color: "#5fd47e" },
  { name: "Solution B", amount: "35 ml", pct: 0.72, color: "#5fd47e" },
  { name: "Bloom Boost", amount: "20 ml", pct: 0.44, color: "#FFD166" },
];

const CONTROLS = [
  { icon: Lightbulb, label: "Grow Lights", value: "100%", active: true },
  { icon: Wind, label: "Ventilation", value: "Auto", active: true },
];

export function ControlScene() {
  return (
    <div className="h-full flex flex-col px-5 pt-2">
      {/* Dosing card */}
      <motion.div
        className="glass rounded-3xl p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(46,168,74,0.12)" }}
          >
            <Droplet className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-ink">Dosing Run</p>
          <span
            className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(46,168,74,0.18)", color: "#5fd47e" }}
          >
            Active
          </span>
        </div>

        <div className="space-y-3">
          {DOSES.map(({ name, amount, pct, color }, i) => (
            <div key={name}>
              <div className="flex justify-between mb-1.5">
                <p className="text-xs text-ink-dim">{name}</p>
                <p className="text-xs font-num text-ink">{amount}</p>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Control toggles */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {CONTROLS.map(({ icon: Icon, label, value, active }, i) => (
          <motion.div
            key={label}
            className="glass rounded-2xl p-3 flex flex-col gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: active ? "rgba(46,168,74,0.18)" : "rgba(255,255,255,0.05)" }}
              >
                <Icon className="w-4 h-4" style={{ color: active ? "#5fd47e" : "#6a9778" }} />
              </div>
              <motion.div
                className="w-9 h-5 rounded-full relative"
                style={{
                  background: active
                    ? "linear-gradient(135deg,#2EA84A,#5fd47e)"
                    : "rgba(255,255,255,0.1)",
                  boxShadow: active ? "0 0 10px rgba(46,168,74,0.5)" : undefined,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <motion.span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                  animate={{ x: active ? 18 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.5 + i * 0.1 }}
                />
              </motion.div>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">{label}</p>
              <p className="text-[10px] font-num text-primary mt-0.5">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-5 pb-2 flex-1 flex flex-col justify-end">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
          Feature 02
        </p>
        <h2 className="text-2xl font-bold text-ink mt-1">Smart Control</h2>
        <p className="text-sm text-ink-dim mt-2 leading-relaxed">
          Dose nutrients, switch lights, run irrigation — from anywhere. Your greenhouse, on your
          terms.
        </p>
      </div>
    </div>
  );
}
