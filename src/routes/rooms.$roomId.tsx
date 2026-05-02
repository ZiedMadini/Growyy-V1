import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/StatusDot";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  rooms,
  history7d,
  devicesMock,
  solutions,
  recentEvents,
  lightingCurve,
  forecastData,
} from "@/lib/mockData";
import {
  Thermometer,
  Droplets,
  FlaskConical,
  Zap,
  Wind,
  Sparkles,
  AlertTriangle,
  Wifi,
  WifiOff,
  Battery,
  Sun,
  Flower2,
  Clock,
  Droplet,
  Leaf,
  TrendingUp,
  Brain,
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

const tabs = [
  "Overview",
  "Flowering",
  "Solutions",
  "Setpoints",
  "Forecast",
  "History",
  "Devices",
] as const;

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

      <div
        className="px-5 sticky top-0 z-10 pb-3"
        style={{ background: "linear-gradient(180deg, rgba(10,26,15,0.92) 70%, transparent)" }}
      >
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
        {tab === "Overview" && <OverviewTab room={room} />}
        {tab === "Flowering" && <FloweringTab room={room} />}
        {tab === "Solutions" && <SolutionsTab />}
        {tab === "Setpoints" && <SetpointsTab room={room} />}
        {tab === "Forecast" && <ForecastTab room={room} />}
        {tab === "History" && <HistoryTab />}
        {tab === "Devices" && <DevicesTab roomName={room.name} />}
      </div>
    </MobileShell>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Gauge                                                     */
/* ────────────────────────────────────────────────────────── */
function Gauge({
  icon: Icon,
  value,
  unit,
  decimals = 0,
  min,
  max,
  color = "#5fd47e",
}: {
  icon: typeof Thermometer;
  value: number;
  unit: string;
  decimals?: number;
  min: number;
  max: number;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const circ = 188;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(46,168,74,0.12)" }}
        >
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
      <div className="mt-3 relative h-24 flex items-end justify-center">
        <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
          <path
            d="M 10 55 A 40 40 0 1 1 90 55"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
            strokeLinecap="round"
          />
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
      <p className="text-[10px] text-ink-soft text-center mt-1 font-num">
        {min}–{max}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Overview Tab                                              */
/* ────────────────────────────────────────────────────────── */
function OverviewTab({ room }: { room: (typeof rooms)[number] }) {
  const m = room.metrics;
  const t = room.targets;
  return (
    <section className="px-5 mt-2 grid grid-cols-2 gap-3">
      <Gauge
        icon={Thermometer}
        value={m.temp}
        decimals={1}
        unit="°C"
        min={t.temp[0]}
        max={t.temp[1]}
      />
      <Gauge icon={Droplets} value={m.humidity} unit="%" min={t.humidity[0]} max={t.humidity[1]} />
      <Gauge
        icon={FlaskConical}
        value={m.ph}
        decimals={1}
        unit="pH"
        min={t.ph[0]}
        max={t.ph[1]}
        color="#FFD166"
      />
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

function FloweringTab({ room }: { room: (typeof rooms)[number] }) {
  const progress = Math.round((room.day / room.totalDays) * 100);
  const weeksLeft = Math.ceil((room.totalDays - room.day) / 7);
  const stageColor =
    room.stage === "Flowering" ? "#FFD166" : room.stage === "Vegetative" ? "#5fd47e" : "#8ab894";

  return (
    <section className="px-5 mt-2 space-y-3">
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(46,168,74,0.14)" }}
            >
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
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, #2EA84A, #5fd47e)",
              boxShadow: "0 0 12px rgba(46,168,74,0.6)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-[11px] font-num text-ink-dim">
            Day <span className="text-ink font-semibold">{room.day}</span>
          </p>
          <p className="text-[11px] font-num text-ink-dim">
            <span className="text-ink font-semibold">{progress}%</span> complete
          </p>
          <p className="text-[11px] font-num text-ink-dim">
            Day <span className="text-ink font-semibold">{room.totalDays}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Temp",
            value: `${room.metrics.temp}°C`,
            ok:
              room.metrics.temp >= room.targets.temp[0] &&
              room.metrics.temp <= room.targets.temp[1],
          },
          { label: "VPD", value: `${room.metrics.vpd} kPa`, ok: room.metrics.vpd < 1.6 },
          {
            label: "EC",
            value: `${room.metrics.ec} mS`,
            ok: room.metrics.ec >= room.targets.ec[0] && room.metrics.ec <= room.targets.ec[1],
          },
        ].map((m) => (
          <div key={m.label} className="glass rounded-2xl p-3 text-center">
            <p className="text-[10px] text-ink-dim uppercase tracking-wide">{m.label}</p>
            <p
              className={`text-sm font-num font-semibold mt-1 ${m.ok ? "text-primary" : "text-warning"}`}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,209,102,0.12)" }}
        >
          <Leaf className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink-dim">Next milestone</p>
          <p className="text-sm font-semibold text-ink mt-0.5">
            {room.stage === "Flowering"
              ? "Flush week"
              : room.stage === "Vegetative"
                ? "Switch to Flowering"
                : "Transplant ready"}
          </p>
          <p className="text-[11px] text-ink-dim font-num mt-0.5">
            ~{weeksLeft - 1} week{weeksLeft - 1 !== 1 ? "s" : ""} away
          </p>
        </div>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim pt-1">
        Today's Activity
      </p>
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
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: bg }}
              >
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
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(95,212,126,0.25), transparent 70%)" }}
        />
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
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,209,102,0.12)" }}
          >
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{s.title}</p>
            <p className="text-xs text-ink-dim mt-1">{s.desc}</p>
            <div className="flex gap-2 mt-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full text-[#06120a]"
                style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
              >
                Apply
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full text-ink-dim glass"
              >
                Dismiss
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Stepper — clean +/- control used in Setpoints            */
/* ────────────────────────────────────────────────────────── */
function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const fmt = format ?? ((v: number) => String(v));
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <p className="text-xs text-ink-dim">{label}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(10))))}
          className="w-7 h-7 rounded-full glass text-sm font-semibold text-ink-dim flex items-center justify-center active:scale-90 transition-transform"
        >
          −
        </button>
        <span className="text-sm font-num font-semibold text-ink w-14 text-center">
          {fmt(value)}
        </span>
        <button
          onClick={() => onChange(Math.min(max, parseFloat((value + step).toFixed(10))))}
          className="w-7 h-7 rounded-full glass text-sm font-semibold text-ink-dim flex items-center justify-center active:scale-90 transition-transform"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* Range field: shows min–max with individual steppers */
function RangeField({
  label,
  unit,
  value,
  hardMin,
  hardMax,
  step = 0.5,
}: {
  label: string;
  unit: string;
  value: [number, number];
  hardMin: number;
  hardMax: number;
  step?: number;
}) {
  const [v, setV] = useState(value);
  const lowPct = ((v[0] - hardMin) / (hardMax - hardMin)) * 100;
  const highPct = ((v[1] - hardMin) / (hardMax - hardMin)) * 100;
  const fmt = (n: number) => `${n}${unit}`;

  return (
    <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <p className="text-xs font-num text-primary font-semibold">
          {v[0]}–{v[1]}
          {unit}
        </p>
      </div>
      {/* track */}
      <div
        className="relative h-1.5 rounded-full mb-3"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${lowPct}%`,
            width: `${highPct - lowPct}%`,
            background: "linear-gradient(90deg, #2EA84A, #5fd47e)",
            boxShadow: "0 0 10px rgba(46,168,74,0.45)",
          }}
        />
      </div>
      <Stepper
        label="Min"
        value={v[0]}
        min={hardMin}
        max={v[1] - step}
        step={step}
        format={fmt}
        onChange={(n) => setV([n, v[1]])}
      />
      <Stepper
        label="Max"
        value={v[1]}
        min={v[0] + step}
        max={hardMax}
        step={step}
        format={fmt}
        onChange={(n) => setV([v[0], n])}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Setpoints Tab                                             */
/* ────────────────────────────────────────────────────────── */
function SetpointsTab({ room }: { room: (typeof rooms)[number] }) {
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
      {/* AI banner */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setAiApplied(true)}
        className="w-full glass rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden text-left"
        style={{ border: aiApplied ? "1px solid rgba(46,168,74,0.35)" : undefined }}
      >
        <div
          className="absolute -right-6 -top-6 w-28 h-28 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(95,212,126,0.22), transparent 70%)" }}
        />
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(46,168,74,0.14)" }}
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 relative">
          <p className="text-sm font-semibold text-ink">
            {aiApplied ? "AI Recommendations Applied" : "Apply AI Recommendations"}
          </p>
          <p className="text-[11px] text-ink-dim mt-0.5">
            {aiApplied
              ? "All setpoints optimised for this room"
              : `Optimised for ${room.stage} · ${room.name}`}
          </p>
        </div>
        {!aiApplied && (
          <span
            className="relative text-xs font-semibold px-3 py-1.5 rounded-full text-[#06120a]"
            style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
          >
            Apply
          </span>
        )}
      </motion.button>

      {/* Lighting */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-4 h-4 text-warning" />
          <p className="text-sm font-semibold text-ink">Lighting</p>
          <span className="ml-auto text-xs font-num text-primary font-semibold">
            {lightHours}h / day
          </span>
        </div>
        <svg viewBox="0 0 240 60" className="w-full h-12" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lc-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFD166" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={lightingCurve
              .map((p) => `${(p.h / 24) * 240},${60 - (p.v / 100) * 50}`)
              .join(" ")}
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
            {
              label: "Peak",
              value: `${String(peakStart).padStart(2, "0")}–${String(peakEnd).padStart(2, "0")}`,
            },
            { label: "Sunset", value: `${String(lightOff).padStart(2, "0")}:00` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl py-2"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <p className="text-[9px] uppercase tracking-wider text-ink-dim">{s.label}</p>
              <p className="text-xs font-num font-semibold text-ink mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <Stepper
            label="Lights on"
            value={lightOn}
            min={0}
            max={lightOff - 1}
            step={1}
            format={(v) => `${String(v).padStart(2, "0")}:00`}
            onChange={setLightOn}
          />
          <Stepper
            label="Lights off"
            value={lightOff}
            min={lightOn + 1}
            max={24}
            step={1}
            format={(v) => `${String(v).padStart(2, "0")}:00`}
            onChange={setLightOff}
          />
        </div>
      </div>

      {/* Environment */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Thermometer className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-ink">Environment</p>
        </div>
        <RangeField
          label="Temperature"
          unit="°C"
          value={t.temp}
          hardMin={15}
          hardMax={35}
          step={0.5}
        />
        <RangeField
          label="Humidity"
          unit="%"
          value={t.humidity}
          hardMin={30}
          hardMax={90}
          step={1}
        />
        <RangeField label="CO₂" unit=" ppm" value={t.co2} hardMin={400} hardMax={1500} step={50} />
      </div>

      {/* Irrigation */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Droplet className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-ink">Irrigation</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <Stepper
            label="Cycle interval"
            value={irrigInterval}
            min={1}
            max={12}
            step={1}
            format={(v) => `every ${v}h`}
            onChange={setIrrigInterval}
          />
          <Stepper
            label="Duration"
            value={irrigDuration}
            min={1}
            max={15}
            step={1}
            format={(v) => `${v} min`}
            onChange={setIrrigDuration}
          />
        </div>
      </div>

      {/* Nutrients / pH / EC */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-ink">Nutrients & Solution</p>
        </div>
        <RangeField label="pH target" unit="" value={t.ph} hardMin={4} hardMax={8} step={0.1} />
        <RangeField label="EC target" unit=" mS" value={t.ec} hardMin={0} hardMax={4} step={0.1} />
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Forecast Tab  (LSTM-style predictions)                   */
/* ────────────────────────────────────────────────────────── */
function ForecastChart({
  history,
  forecast,
  target,
  color,
  unit,
}: {
  history: number[];
  forecast: number[];
  target: [number, number];
  color: string;
  unit: string;
}) {
  const all = [...history, ...forecast];
  const minV = Math.min(...all, target[0]);
  const maxV = Math.max(...all, target[1]);
  const range = maxV - minV || 1;
  const W = 280;
  const H = 90;
  const totalPts = history.length + forecast.length;

  const px = (i: number) => (i / (totalPts - 1)) * W;
  const py = (v: number) => H - ((v - minV) / range) * (H - 8) - 4;

  const histPts = history.map((v, i) => `${px(i)},${py(v)}`).join(" ");
  const joinX = px(history.length - 1);
  const joinY = py(history[history.length - 1]);
  const forecastPts = forecast.map((v, i) => `${px(history.length - 1 + i + 1)},${py(v)}`);
  const forecastPolyline = [`${joinX},${joinY}`, ...forecastPts].join(" ");

  const targetY1 = py(target[1]);
  const targetY0 = py(target[0]);

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 100 }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`hg-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`fg-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Target band */}
        <rect x="0" y={targetY1} width={W} height={targetY0 - targetY1} fill={`${color}14`} />
        <line
          x1="0"
          y1={targetY1}
          x2={W}
          y2={targetY1}
          stroke={color}
          strokeWidth="0.5"
          strokeDasharray="3 3"
          opacity="0.4"
        />
        <line
          x1="0"
          y1={targetY0}
          x2={W}
          y2={targetY0}
          stroke={color}
          strokeWidth="0.5"
          strokeDasharray="3 3"
          opacity="0.4"
        />

        {/* Divider history/forecast */}
        <line
          x1={joinX}
          y1="0"
          x2={joinX}
          y2={H}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* History fill */}
        <polygon points={`0,${H} ${histPts} ${joinX},${H}`} fill={`url(#hg-${color})`} />
        {/* History line */}
        <polyline
          points={histPts}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
        />

        {/* Forecast fill */}
        <polygon
          points={`${joinX},${H} ${forecastPolyline} ${px(totalPts - 1)},${H}`}
          fill={`url(#fg-${color})`}
        />
        {/* Forecast dashed line */}
        <polyline
          points={forecastPolyline}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 3"
          opacity="0.8"
        />

        {/* Forecast dots */}
        {forecast.map((v, i) => {
          const cx = px(history.length + i);
          const cy = py(v);
          const outOfRange = v < target[0] || v > target[1];
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              fill={outOfRange ? "#FF6B6B" : color}
              stroke="rgba(10,26,15,0.8)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Current value dot */}
        <circle
          cx={joinX}
          cy={joinY}
          r="3.5"
          fill={color}
          stroke="rgba(10,26,15,0.8)"
          strokeWidth="1.5"
        />
      </svg>

      {/* x-axis labels */}
      <div className="flex justify-between text-[9px] font-num text-ink-dim mt-1 px-0.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "+1", "+2", "+3", "+4", "+5"]
          .slice(0, totalPts)
          .map((d, i) => (
            <span key={i} className={i >= history.length ? "text-ink-soft/60" : ""}>
              {d}
            </span>
          ))}
      </div>
    </div>
  );
}

function ForecastTab({ room }: { room: (typeof rooms)[number] }) {
  const metrics = [
    { key: "temp" as const, label: "Temperature", icon: Thermometer, color: "#5fd47e" },
    { key: "humidity" as const, label: "Humidity", icon: Droplets, color: "#5fd47e" },
    { key: "ph" as const, label: "pH", icon: FlaskConical, color: "#FFD166" },
    { key: "ec" as const, label: "EC", icon: Zap, color: "#5fd47e" },
  ];

  const allAlerts = metrics.flatMap((m) =>
    forecastData[m.key].alerts.map((a) => ({ ...a, metric: m.label, color: m.color })),
  );

  return (
    <section className="px-5 mt-2 space-y-4">
      {/* Header card */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
        <div
          className="absolute -right-6 -top-6 w-28 h-28 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(95,212,126,0.18), transparent 70%)" }}
        />
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(46,168,74,0.12)" }}
        >
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="relative">
          <p className="text-sm font-semibold text-ink">AI Forecast · LSTM Model</p>
          <p className="text-[11px] text-ink-dim">
            7-day history + 5-day prediction for {room.name}
          </p>
        </div>
      </div>

      {/* Alert strip */}
      {allAlerts.length > 0 && (
        <div className="space-y-2">
          {allAlerts.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl px-3.5 py-3 flex items-center gap-3"
              style={{
                background: "rgba(255,209,102,0.10)",
                border: "1px solid rgba(255,209,102,0.2)",
              }}
            >
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-warning">
                  {a.metric} alert in +{a.day}d
                </p>
                <p className="text-[10px] text-ink-dim mt-0.5">{a.msg}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Per-metric charts */}
      {metrics.map((m, i) => {
        const fd = forecastData[m.key];
        const current = fd.history[fd.history.length - 1];
        const next = fd.forecast[0];
        const trend = next > current ? "up" : next < current ? "down" : "stable";
        const outOfRangeDays = fd.forecast.filter(
          (v) => v < fd.target[0] || v > fd.target[1],
        ).length;

        return (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
                <p className="text-sm font-semibold text-ink">{m.label}</p>
              </div>
              <div className="flex items-center gap-2">
                {outOfRangeDays > 0 && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,107,107,0.15)", color: "#FF6B6B" }}
                  >
                    {outOfRangeDays}d out of range
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <TrendingUp
                    className="w-3.5 h-3.5"
                    style={{
                      color: trend === "up" ? "#FF6B6B" : trend === "down" ? "#5fd47e" : "#8ab894",
                      transform:
                        trend === "down"
                          ? "scaleY(-1)"
                          : trend === "stable"
                            ? "rotate(0deg)"
                            : undefined,
                    }}
                  />
                  <span className="text-[11px] font-num font-semibold" style={{ color: m.color }}>
                    {current}
                    {fd.unit}
                  </span>
                </div>
              </div>
            </div>

            <ForecastChart
              history={fd.history}
              forecast={fd.forecast}
              target={fd.target as [number, number]}
              color={m.color}
              unit={fd.unit}
            />

            {/* Forecast summary row */}
            <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide">
              {fd.forecast.map((v, idx) => {
                const bad = v < fd.target[0] || v > fd.target[1];
                return (
                  <div
                    key={idx}
                    className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-center"
                    style={{
                      background: bad ? "rgba(255,107,107,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${bad ? "rgba(255,107,107,0.3)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <p className="text-[9px] text-ink-dim">+{idx + 1}d</p>
                    <p
                      className="text-[11px] font-num font-semibold mt-0.5"
                      style={{ color: bad ? "#FF6B6B" : m.color }}
                    >
                      {v}
                      {fd.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
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
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`)
    .join(" ");
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
      <p className="text-[11px] text-ink-dim font-semibold uppercase tracking-[0.16em]">
        Past 7 days
      </p>
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
            <p className="text-xs font-num text-ink-dim">
              {c.data[c.data.length - 1]} {c.unit}
            </p>
          </div>
          <MiniChart data={c.data} color={c.color} />
          <div className="flex justify-between text-[10px] text-ink-soft font-num mt-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d}>{d}</span>
            ))}
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
      <p className="text-[11px] text-ink-dim font-num">
        {devicesMock.length} sensors connected to {roomName}
      </p>
      {devicesMock.map((d, i) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="glass rounded-2xl p-4 flex items-center gap-3"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: d.online ? "rgba(46,168,74,0.12)" : "rgba(255,255,255,0.04)" }}
          >
            {d.online ? (
              <Wifi className="w-5 h-5 text-primary" />
            ) : (
              <WifiOff className="w-5 h-5 text-ink-soft" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{d.name}</p>
            <p className="text-[11px] text-ink-dim">{d.type}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={d.online ? "healthy" : "critical"} size={6} />
            <span className="font-num text-xs text-ink-dim flex items-center gap-1">
              <Battery
                className={`w-3.5 h-3.5 ${d.battery < 20 ? "text-destructive" : "text-ink-soft"}`}
              />
              {d.battery}%
            </span>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
