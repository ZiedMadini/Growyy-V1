import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/StatusDot";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { rooms, history7d, devicesMock, solutions } from "@/lib/mockData";
import { Thermometer, Droplets, FlaskConical, Zap, Wind, Sparkles, AlertTriangle, Wifi, WifiOff, Battery } from "lucide-react";

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

const tabs = ["Overview", "Solutions", "Set Values", "History", "Devices"] as const;

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

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === "Overview" && <OverviewTab room={room} />}
          {tab === "Solutions" && <SolutionsTab />}
          {tab === "Set Values" && <SetValuesTab room={room} />}
          {tab === "History" && <HistoryTab />}
          {tab === "Devices" && <DevicesTab roomName={room.name} />}
        </motion.div>
      </AnimatePresence>
    </MobileShell>
  );
}

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

function RangeSlider({ label, unit, value, hardMin, hardMax }: {
  label: string; unit: string; value: [number, number]; hardMin: number; hardMax: number;
}) {
  const [v, setV] = useState(value);
  const lowPct = ((v[0] - hardMin) / (hardMax - hardMin)) * 100;
  const highPct = ((v[1] - hardMin) / (hardMax - hardMin)) * 100;
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs font-num text-primary font-semibold">{v[0]}–{v[1]} {unit}</p>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${lowPct}%`,
            width: `${highPct - lowPct}%`,
            background: "linear-gradient(90deg, #2EA84A, #5fd47e)",
            boxShadow: "0 0 12px rgba(46,168,74,0.6)",
          }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-ink-soft font-num">
        <span>{hardMin}</span><span>{hardMax} {unit}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setV([Math.max(hardMin, v[0] - 0.5), v[1]])} className="flex-1 text-xs font-semibold py-1.5 rounded-lg glass text-ink-dim">Min −</button>
        <button onClick={() => setV([Math.min(v[1] - 0.1, v[0] + 0.5), v[1]])} className="flex-1 text-xs font-semibold py-1.5 rounded-lg glass text-ink-dim">Min +</button>
        <button onClick={() => setV([v[0], Math.max(v[0] + 0.1, v[1] - 0.5)])} className="flex-1 text-xs font-semibold py-1.5 rounded-lg glass text-ink-dim">Max −</button>
        <button onClick={() => setV([v[0], Math.min(hardMax, v[1] + 0.5)])} className="flex-1 text-xs font-semibold py-1.5 rounded-lg glass text-ink-dim">Max +</button>
      </div>
    </div>
  );
}

function SetValuesTab({ room }: { room: typeof rooms[number] }) {
  const t = room.targets;
  return (
    <section className="px-5 mt-2 space-y-3">
      <RangeSlider label="Temperature" unit="°C" value={t.temp} hardMin={15} hardMax={35} />
      <RangeSlider label="Humidity" unit="%" value={t.humidity} hardMin={30} hardMax={90} />
      <RangeSlider label="pH" unit="" value={t.ph} hardMin={4} hardMax={8} />
      <RangeSlider label="EC" unit="mS" value={t.ec} hardMin={0} hardMax={4} />
      <RangeSlider label="CO₂" unit="ppm" value={t.co2} hardMin={400} hardMax={1500} />
    </section>
  );
}

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
