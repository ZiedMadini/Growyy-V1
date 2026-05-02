import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/StatusDot";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { rooms, history7d, devicesMock, solutions, recentEvents, lightingCurve } from "@/lib/mockData";
import {
  Thermometer, Droplets, FlaskConical, Zap, Wind, Sparkles, AlertTriangle,
  Wifi, WifiOff, Battery, Sun, Flower2, Clock, Droplet, Leaf,
} from "lucide-react";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomDetail,
  notFoundComponent: () => (
    <MobileShell>
      <AppHeader title="Room not found" showBack />
    </MobileShell>
  ),
  loader: ({ params }) => {
    const room = rooms.find((r) => r.id === params.roomId);
    if (!room) throw notFound();
    return { room };
  },
});

const tabs = ["Overview", "Flowering", "Solutions", "Setpoints", "History", "Devices"] as const;

function RoomDetail() {
  const { room } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  return (
    <MobileShell>
      <AppHeader
        subtitle={`${room.stage} · day ${room.day}/${room.totalDays}`}
        title={room.name}
        showBack
        rightAction={
          <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <StatusDot status={room.status} size={10} />
          </div>
        }
      />

      <div className="px-5 sticky top-0 z-10 pb-3" style={{ background: "linear-gradient(180deg, rgba(10,26,15,0.92) 70%, transparent)" }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {tabs.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                style={{ color: active ? "#06120a" : "#8ab894" }}
              >
                {active && (
                  <motion.span
                    layoutId="room-tab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
                  />
                )}
                <span className="relative">{t}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {tab === "Overview"   && <OverviewTab room={room} />}
        {tab === "Flowering"  && <FloweringTab room={room} />}
        {tab === "Solutions"  && <SolutionsTab />}
        {tab === "Setpoints"  && <SetpointsTab room={room} />}
        {tab === "History"    && <HistoryTab />}
        {tab === "Devices"    && <DevicesTab roomName={room.name} />}
      </div>
    </MobileShell>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Gauge                                                     */
/* ────────────────────────────────────────────────────────── */
function Gauge({ icon: Icon, value, unit, decimals = 0, min, max, color = "#5fd47e" }: {
  icon: typeof Thermometer; value: number; unit: string; decimals?: number; min: number; max: number; color?: string;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const circ = 188;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(46,168,74,0.12)" }}>
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
      <div className="mt-3 relative h-24 flex items-end justify-center">
        <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
          <path d="M 10 55 A 40 40 0 1 1 90 55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
          <motion.path
            d="M 10 55 A 40 40 0 1 1 90 55"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${color}90)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-[28px] font-num font-semibold leading-none text-ink">
            <AnimatedNumber value={value} decimals={decimals} />
          </p>
          <p className="text-[10px] text-ink-dim mt-1">{unit}</p>
        </div>
      </div>
      <p className="text-[10px] text-ink-soft text-center mt-1 font-num">{min}–{max}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Overview Tab                                              */
/* ────────────────────────────────────────────────────────── */
function OverviewTab({ room }: { room: typeof rooms[number] }) {
  const m = room.metrics;
  const t = room.targets;
  return (
    <section className="px-5 mt-2 grid grid-cols-2 gap-3">
      <Gauge icon={Thermometer} value={m.temp} decimals={1} unit="°C" min={t.temp[0]} max={t.temp[1]} />
      <Gauge icon={Droplets} value={m.humidity} unit="%" min={t.humidity[0]} max={t.humidity[1]} />
      <Gauge icon={FlaskConical} value={m.ph} decimals={1} unit="pH" min={t.ph[0]} max={t.ph[1]} color="#FFD166" />
      <Gauge icon={Zap} value={m.ec} decimals={1} unit="mS" min={t.ec[0]} max={t.ec[1]} />
      <div className="col-span-2">
        <Gauge icon={Wind} value={m.co2} unit="ppm" min={t.co2[0]} max={t.co2[1]} />
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Flowering Tab                                             */
/* ────────────────────────────────────────────────────────── */
const eventIconMap: Record<string, typeof Sun> = {
  dose: FlaskConical,
  irrigation: Droplet,
  alert: AlertTriangle,
  light: Sun,
};
const eventColorMap: Record<string, string> = {
  dose: "rgba(46,168,74,0.14)",
  irrigation: "rgba(95,212,126,0.10)",
  alert: "rgba(255,209,102,0.14)",
  light: "rgba(255,209,102,0.10)",
};
const eventTextMap: Record<string, string> = {
  dose: "#2EA84A",
  irrigation: "#5fd47e",
  alert: "#FFD166",
  light: "#FFD166",
};

function FloweringTab({ room }: { room: typeof rooms[number] }) {
  const progress = Math.round((room.day / room.totalDays) * 100);
  const weeksLeft = Math.ceil((room.totalDays - room.day) / 7);

  const stageColor =
    room.stage === "Flowering" ? "#FFD166" :
    room.stage === "Vegetative" ? "#5fd47e" :
    "#8ab894";

  return (
    <section className="px-5 mt-2 space-y-3">
      {/* Cycle progress card */}
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(46,168,74,0.14)" }}>
              <Flower2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{room.stage}</p>
              <p className="text-[10px] text-ink-dim">Current stage</p>
            </div>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${stageColor}22`, color: stageColor }}
          >
            {weeksLeft}w left
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #2EA84A, #5fd47e)", boxShadow: "0 0 12px rgba(46,168,74,0.6)" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="flex justify-between mt-2">
          <p className="text-[11px] font-num text-ink-dim">Day <span className="text-ink font-semibold">{room.day}</span></p>
          <p className="text-[11px] font-num text-ink-dim"><span className="text-ink font-semibold">{progress}%</span> complete</p>
          <p className="text-[11px] font-num text-ink-dim">Day <span className="text-ink font-semibold">{room.totalDays}</span></p>
        </div>
      </div>

      {/* Live metrics strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Temp", value: `${room.metrics.temp}°C`, ok: room.metrics.temp >= room.targets.temp[0] && room.metrics.temp <= room.targets.temp[1] },
          { label: "VPD", value: `${room.metrics.vpd} kPa`, ok: room.metrics.vpd < 1.6 },
          { label: "EC", value: `${room.metrics.ec} mS`, ok: room.metrics.ec >= room.targets.ec[0] && room.metrics.ec <= room.targets.ec[1] },
        ].map((m) => (
          <div key={m.label} className="glass rounded-2xl p-3 text-center">
            <p className="text-[10px] text-ink-dim uppercase tracking-wide">{m.label}</p>
            <p className={`text-sm font-num font-semibold mt-1 ${m.ok ? "text-primary" : "text-warning"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Next milestone */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,209,102,0.12)" }}>
          <Leaf className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink-dim">Next milestone</p>
          <p className="text-sm font-semibold text-ink mt-0.5">
            {room.stage === "Flowering" ? "Flush week" :
             room.stage === "Vegetative" ? "Switch to Flowering" :
             "Transplant ready"}
          </p>
          <p className="text-[11px] text-ink-dim font-num mt-0.5">~{weeksLeft - 1} week{weeksLeft - 1 !== 1 ? "s" : ""} away</p>
        </div>
      </div>

      {/* Activity log */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim pt-1">Today's Activity</p>
      <div className="space-y-2">
        {recentEvents.map((e, i) => {
          const Icon = eventIconMap[e.type] ?? Clock;
          const bg = eventColorMap[e.type] ?? "rgba(255,255,255,0.05)";
          const tc = eventTextMap[e.type] ?? "#8ab894";
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-2xl p-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color: tc }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink truncate">{e.text}</p>
              </div>
              <span className="text-[10px] font-num text-ink-dim whitespace-nowrap">{e.time}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Solutions Tab                                             */
/* ────────────────────────────────────────────────────────── */
function SolutionsTab() {
  return (
    <section className="px-5 mt-2 space-y-3">
      <div className="glass rounded-3xl p-4 flex items-center gap-3 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(95,212,126,0.25), transparent 70%)" }} />
        <Sparkles className="w-5 h-5 text-primary relative" />
        <div className="relative">
          <p className="text-sm font-semibold text-ink">AI Recommendations</p>
          <p className="text-[11px] text-ink-dim">Generated from live sensor data</p>
        </div>
      </div>
      {solutions.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="glass rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,209,102,0.12)" }}>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{s.title}</p>
            <p className="text-xs text-ink-dim mt-1">{s.desc}</p>
            <div className="flex gap-2 mt-3">
              <motion.button whileTap={{ scale: 0.95 }} className="text-xs font-semibold px-3 py-1.5 rounded-full text-[#06120a]" style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}>Apply</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} className="text-xs font-semibold px-3 py-1.5 rounded-full text-ink-dim glass">Dismiss</motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Shared RangeSlider                                        */
/* ────────────────────────────────────────────────────────── */
function RangeSlider({ label, unit, value, hardMin, hardMax, step = 0.5 }: {
  label: string; unit: string; value: [number, number]; hardMin: number; hardMax: number; step?: number;
}) {
  const [v, setV] = useState(value);
  const lowPct = ((v[0] - hardMin) / (hardMax - hardMin)) * 100;
  const highPct = ((v[1] - hardMin) / (hardMax - hardMin)) * 100;
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <p className="text-xs font-num text-primary font-semibold">{v[0]}–{v[1]}{unit}</p>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute h-full rounded-full"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%`, background: "linear-gradient(90deg, #2EA84A, #5fd47e)", boxShadow: "0 0 10px rgba(46,168,74,0.5)" }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-ink-soft font-num">
        <span>{hardMin}</span><span>{hardMax}{unit}</span>
      </div>
      <div className="flex gap-1.5 mt-2">
        <button onClick={() => setV([Math.max(hardMin, v[0] - step), v[1]])} className="flex-1 text-[10px] font-semibold py-1 rounded-lg glass text-ink-dim">min −</button>
        <button onClick={() => setV([Math.min(v[1] - step, v[0] + step), v[1]])} className="flex-1 text-[10px] font-semibold py-1 rounded-lg glass text-ink-dim">min +</button>
        <button onClick={() => setV([v[0], Math.max(v[0] + step, v[1] - step)])} className="flex-1 text-[10px] font-semibold py-1 rounded-lg glass text-ink-dim">max −</button>
        <button onClick={() => setV([v[0], Math.min(hardMax, v[1] + step)])} className="flex-1 text-[10px] font-semibold py-1 rounded-lg glass text-ink-dim">max +</button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Setpoints Tab (full per-room management + AI)             */
/* ────────────────────────────────────────────────────────── */
function SetpointsTab({ room }: { room: typeof rooms[number] }) {
  const t = room.targets;
  const [lightOn, setLightOn] = useState(6);
  const [lightOff, setLightOff] = useState(22);
  const [irrigInterval, setIrrigInterval] = useState(4);
  const [irrigDuration, setIrrigDuration] = useState(3);
  const [aiApplied, setAiApplied] = useState(false);

  const lightHours = lightOff - lightOn;
  const peakStart = lightOn + 2;
  const peakEnd = lightOff - 2;

  return (
    <section className="px-5 mt-2 space-y-4">
      {/* AI apply-all banner */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setAiApplied(true)}
        className="w-full glass rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden text-left"
        style={{ border: aiApplied ? "1px solid rgba(46,168,74,0.35)" : undefined }}
      >
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full" style={{ background: "radial-gradient(circle, rgba(95,212,126,0.22), transparent 70%)" }} />
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(46,168,74,0.14)" }}>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 relative">
          <p className="text-sm font-semibold text-ink">
            {aiApplied ? "AI Recommendations Applied" : "Apply AI Recommendations"}
          </p>
          <p className="text-[11px] text-ink-dim mt-0.5">
            {aiApplied ? "All setpoints optimised for this room" : `Optimised for ${room.stage} stage · ${room.name}`}
          </p>
        </div>
        {!aiApplied && (
          <span className="relative text-xs font-semibold px-3 py-1.5 rounded-full text-[#06120a]" style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}>
            Apply
          </span>
        )}
      </motion.button>

      {/* Lighting */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-4 h-4 text-warning" />
          <p className="text-sm font-semibold text-ink">Lighting</p>
          <span className="ml-auto text-xs font-num text-primary font-semibold">{lightHours}h / day</span>
        </div>

        {/* Light curve mini preview */}
        <svg viewBox="0 0 240 60" className="w-full h-12" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lc-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFD166" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={lightingCurve.map((p) => `${(p.h / 24) * 240},${60 - (p.v / 100) * 50}`).join(" ")}
            fill="none"
            stroke="#FFD166"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 4px rgba(255,209,102,0.6))" }}
          />
          <polygon
            points={[
              "0,60",
              ...lightingCurve.map((p) => `${(p.h / 24) * 240},${60 - (p.v / 100) * 50}`),
              "240,60",
            ].join(" ")}
            fill="url(#lc-grad)"
          />
        </svg>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Sunrise", value: `${String(lightOn).padStart(2, "0")}:00` },
            { label: "Peak", value: `${String(peakStart).padStart(2, "0")}–${String(peakEnd).padStart(2, "0")}` },
            { label: "Sunset", value: `${String(lightOff).padStart(2, "0")}:00` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[9px] uppercase tracking-wider text-ink-dim">{s.label}</p>
              <p className="text-xs font-num font-semibold text-ink mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-dim">Lights on</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setLightOn(Math.max(0, lightOn - 1))} className="w-6 h-6 rounded-full glass text-xs text-ink-dim">−</button>
              <span className="text-xs font-num font-semibold text-ink w-10 text-center">{String(lightOn).padStart(2, "0")}:00</span>
              <button onClick={() => setLightOn(Math.min(lightOff - 1, lightOn + 1))} className="w-6 h-6 rounded-full glass text-xs text-ink-dim">+</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-dim">Lights off</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setLightOff(Math.max(lightOn + 1, lightOff - 1))} className="w-6 h-6 rounded-full glass text-xs text-ink-dim">−</button>
              <span className="text-xs font-num font-semibold text-ink w-10 text-center">{String(lightOff).padStart(2, "0")}:00</span>
              <button onClick={() => setLightOff(Math.min(24, lightOff + 1))} className="w-6 h-6 rounded-full glass text-xs text-ink-dim">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Thermometer className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-ink">Environment</p>
        </div>
        <RangeSlider label="Temperature" unit="°C" value={t.temp} hardMin={15} hardMax={35} step={0.5} />
        <RangeSlider label="Humidity" unit="%" value={t.humidity} hardMin={30} hardMax={90} step={1} />
        <RangeSlider label="CO₂" unit=" ppm" value={t.co2} hardMin={400} hardMax={1500} step={50} />
      </div>

      {/* Irrigation */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Droplet className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-ink">Irrigation</p>
        </div>
        <div className="flex items-center justify-between rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-xs text-ink">Cycle interval</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setIrrigInterval(Math.max(1, irrigInterval - 1))} className="w-6 h-6 rounded-full glass text-xs text-ink-dim">−</button>
            <span className="text-xs font-num font-semibold text-ink w-12 text-center">every {irrigInterval}h</span>
            <button onClick={() => setIrrigInterval(Math.min(12, irrigInterval + 1))} className="w-6 h-6 rounded-full glass text-xs text-ink-dim">+</button>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-xs text-ink">Duration</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setIrrigDuration(Math.max(1, irrigDuration - 1))} className="w-6 h-6 rounded-full glass text-xs text-ink-dim">−</button>
            <span className="text-xs font-num font-semibold text-ink w-12 text-center">{irrigDuration} min</span>
            <button onClick={() => setIrrigDuration(Math.min(15, irrigDuration + 1))} className="w-6 h-6 rounded-full glass text-xs text-ink-dim">+</button>
          </div>
        </div>
      </div>

      {/* Nutrients / pH / EC */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-ink">Nutrients & Solution</p>
        </div>
        <RangeSlider label="pH target" unit="" value={t.ph} hardMin={4} hardMax={8} step={0.1} />
        <RangeSlider label="EC target" unit=" mS" value={t.ec} hardMin={0} hardMax={4} step={0.1} />
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  History Tab                                               */
/* ────────────────────────────────────────────────────────── */
function MiniChart({ data, color = "#5fd47e" }: { data: number[]; color?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-24">
      <defs>
        <linearGradient id={`fg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,100 ${points} 100,100`} fill={`url(#fg-${color})`} className="fill-up" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="draw-line"
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
    </svg>
  );
}

function HistoryTab() {
  const charts = [
    { label: "Temperature", unit: "°C", data: history7d.temp, color: "#5fd47e" },
    { label: "Humidity", unit: "%", data: history7d.humidity, color: "#5fd47e" },
    { label: "pH", unit: "", data: history7d.ph, color: "#FFD166" },
    { label: "EC", unit: "mS", data: history7d.ec, color: "#5fd47e" },
  ];
  return (
    <section className="px-5 mt-2 space-y-3">
      <p className="text-[11px] text-ink-dim font-semibold uppercase tracking-[0.16em]">Past 7 days</p>
      {charts.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-ink">{c.label}</p>
            <p className="text-xs font-num text-ink-dim">{c.data[c.data.length - 1]} {c.unit}</p>
          </div>
          <MiniChart data={c.data} color={c.color} />
          <div className="flex justify-between text-[10px] text-ink-soft font-num mt-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
          </div>
        </motion.div>
      ))}
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Devices Tab                                               */
/* ────────────────────────────────────────────────────────── */
function DevicesTab({ roomName }: { roomName: string }) {
  return (
    <section className="px-5 mt-2 space-y-2.5">
      <p className="text-[11px] text-ink-dim font-num">{devicesMock.length} sensors connected to {roomName}</p>
      {devicesMock.map((d, i) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="glass rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: d.online ? "rgba(46,168,74,0.12)" : "rgba(255,255,255,0.04)" }}>
            {d.online ? <Wifi className="w-5 h-5 text-primary" /> : <WifiOff className="w-5 h-5 text-ink-soft" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{d.name}</p>
            <p className="text-[11px] text-ink-dim">{d.type}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={d.online ? "healthy" : "critical"} size={6} />
            <span className="font-num text-xs text-ink-dim flex items-center gap-1">
              <Battery className={`w-3.5 h-3.5 ${d.battery < 20 ? "text-destructive" : "text-ink-soft"}`} />
              {d.battery}%
            </span>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
