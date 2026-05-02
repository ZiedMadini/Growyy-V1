import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { lightingCurve } from "@/lib/mockData";
import { Sun, Thermometer, Droplets, Wind } from "lucide-react";

export const Route = createFileRoute("/setpoints")({
  component: SetpointsPage,
});

const tabs = ["Lighting", "Environment", "Irrigation"] as const;

function SetpointsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Lighting");
  return (
    <MobileShell>
      <AppHeader subtitle="Automation" title="Setpoints" />

      <div className="px-5 mb-4">
        <div className="glass rounded-full p-1 flex relative">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-full text-xs font-semibold relative z-10"
                style={{ color: active ? "#06120a" : "#8ab894" }}
              >
                {active && (
                  <motion.span
                    layoutId="sp-tab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
                  />
                )}
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === "Lighting" && <Lighting />}
          {tab === "Environment" && <Environment />}
          {tab === "Irrigation" && <Irrigation />}
        </motion.div>
      </AnimatePresence>
    </MobileShell>
  );
}

function Lighting() {
  const points = lightingCurve.map((p) => `${(p.h / 24) * 100},${100 - p.v * 0.85}`).join(" ");
  return (
    <section className="px-5 space-y-3">
      <div className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-warning" />
            <p className="text-sm font-semibold text-ink">24h light schedule</p>
          </div>
          <span className="text-[11px] font-num text-warning">peak 100%</span>
        </div>
        <div
          className="mt-4 relative rounded-2xl p-3 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,209,102,0.04) 0%, transparent 100%)",
          }}
        >
          {/* peak glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: "80%",
              background: "radial-gradient(ellipse at center, rgba(255,209,102,0.18) 0%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-44 relative">
            <defs>
              <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#FFD166" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FFD166" stopOpacity="0.02" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <polyline points={`0,100 ${points} 100,100`} fill="url(#lg)" className="fill-up" />
            <polyline
              points={points}
              fill="none"
              stroke="#FFD166"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="draw-line"
              pathLength={1000}
            />
            {lightingCurve.map((p, i) => (
              <circle
                key={i}
                cx={(p.h / 24) * 100}
                cy={100 - p.v * 0.85}
                r="1.6"
                fill="#5fd47e"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="flex justify-between text-[10px] font-num text-ink-soft mt-1">
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <PhaseCard label="Sunrise" time="06–10" />
          <PhaseCard label="Peak" time="10–18" />
          <PhaseCard label="Sunset" time="18–22" />
        </div>
      </div>
    </section>
  );
}

function PhaseCard({ label, time }: { label: string; time: string }) {
  return (
    <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="text-xs font-num text-ink mt-1">{time}</p>
    </div>
  );
}

function Environment() {
  const items = [
    { icon: Thermometer, label: "Temperature", day: "24°C", night: "20°C" },
    { icon: Droplets, label: "Humidity", day: "60%", night: "65%" },
    { icon: Wind, label: "CO₂", day: "1000 ppm", night: "400 ppm" },
    { icon: Droplets, label: "VPD", day: "1.2 kPa", night: "0.9 kPa" },
  ];
  return (
    <section className="px-5 space-y-3">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(46,168,74,0.12)" }}>
              <it.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-ink">{it.label}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: "rgba(255,209,102,0.08)" }}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-warning">Day</p>
              <p className="text-lg font-num font-semibold text-ink mt-1">{it.day}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Night</p>
              <p className="text-lg font-num font-semibold text-ink mt-1">{it.night}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

function Irrigation() {
  const rooms = [
    { name: "Veg Room A", interval: "Every 4h", duration: "2 min" },
    { name: "Flower Room 1", interval: "Every 3h", duration: "3 min" },
    { name: "Clone Tent", interval: "Every 6h", duration: "1 min" },
    { name: "Flower Room 2", interval: "Every 3h", duration: "3 min" },
  ];
  return (
    <section className="px-5 space-y-3">
      {rooms.map((r, i) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-2xl p-4"
        >
          <p className="text-sm font-semibold text-ink">{r.name}</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Interval</p>
              <p className="text-base font-num font-semibold text-primary mt-1">{r.interval}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Duration</p>
              <p className="text-base font-num font-semibold text-primary mt-1">{r.duration}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
