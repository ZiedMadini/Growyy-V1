import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { WaterTank } from "@/components/WaterTank";
import { Sheet, Field, Input, Select, SheetButton } from "@/components/Sheet";
import { useRoom } from "@/hooks/useRooms";
import { useTanks } from "@/hooks/useTanks";
import { useDevices } from "@/hooks/useDevices";
import { useRoomEvents } from "@/hooks/useRoomEvents";
import { useDosingLog } from "@/hooks/useDosingLog";
import { useRoomForecast } from "@/hooks/useRoomForecast";
import { useAuth } from "@/contexts/AuthContext";
import type { Room } from "@/lib/mockData";
import { lightingCurve } from "@/lib/mockData";
import {
  addDevice,
  updateDevice,
  deleteDevice,
  saveSetpoints,
  logDosing,
  type DeviceFormData,
} from "@/lib/firestore";
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
  Brain,
  Camera,
  Video,
  CheckCircle2,
  Bot,
  Plus,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomDetail,
});

const tabs = ["Overview", "Flowering", "Dosing", "Setpoints", "Trends", "Devices"] as const;

const ROOM_TANK_LEVELS: Record<string, number> = { r1: 78, r2: 56, r3: 88, r4: 18 };

const ROOM_LIGHTING: Record<string, { on: number; off: number; intensity: number }> = {
  r1: { on: 6, off: 22, intensity: 100 },
  r2: { on: 6, off: 20, intensity: 95 },
  r3: { on: 8, off: 20, intensity: 80 },
  r4: { on: 6, off: 20, intensity: 90 },
};

const ROOM_HARVESTS: Record<string, { last: string | null; count: number }> = {
  r1: { last: null, count: 0 },
  r2: { last: "Mar 15, 2026", count: 2 },
  r3: { last: null, count: 0 },
  r4: { last: "Jan 8, 2026", count: 3 },
};

function RoomDetail() {
  const { roomId } = Route.useParams();
  const { room, loading } = useRoom(roomId);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  if (loading) {
    return (
      <MobileShell>
        <AppHeader title="Loading…" showBack />
        <div className="px-5 mt-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-3xl h-32 animate-pulse" />
          ))}
        </div>
      </MobileShell>
    );
  }

  if (!room) {
    return (
      <MobileShell>
        <AppHeader title="Room not found" showBack />
        <p className="px-5 mt-5 text-sm text-ink-dim">This room doesn't exist or was removed.</p>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <AppHeader
        subtitle={`${room.stage} · Day ${room.day} of ${room.totalDays}`}
        title={room.name}
        showBack
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
        {tab === "Dosing" && <DosingTab room={room} />}
        {tab === "Setpoints" && <SetpointsTab room={room} />}
        {tab === "Trends" && <TrendsTab room={room} />}
        {tab === "Devices" && <DevicesTab roomId={roomId} roomName={room.name} />}
      </div>
    </MobileShell>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Gauge                                                     */
/* ────────────────────────────────────────────────────────── */
function Gauge({
  icon: Icon,
  label,
  value,
  unit,
  decimals = 0,
  min,
  max,
  color = "#5fd47e",
}: {
  icon: typeof Thermometer;
  label: string;
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          {label}
        </p>
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
      {(() => {
        const rawPct = ((value - min) / (max - min)) * 100;
        const ok = rawPct >= 0 && rawPct <= 100;
        const label = rawPct < 0 ? "↓ Low" : rawPct > 100 ? "↑ High" : "✓ Normal";
        return (
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[10px] font-num text-ink-soft">
              {min}–{max}
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{ color: ok ? "#5fd47e" : "#FFD166" }}
            >
              {label}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Overview Tab                                              */
/* ────────────────────────────────────────────────────────── */
function OverviewTab({ room }: { room: Room }) {
  const m = room.metrics;
  const t = room.targets;
  const now = new Date().getHours();
  const fallbackLighting = ROOM_LIGHTING[room.id];
  const lightOnHour = room.lightSchedule?.onHour ?? fallbackLighting?.on ?? 6;
  const lightOffHour = room.lightSchedule?.offHour ?? fallbackLighting?.off ?? 22;
  const light = {
    on: lightOnHour,
    off: lightOffHour,
    intensity: fallbackLighting?.intensity ?? 100,
  };
  const lightOn = now >= light.on && now < light.off;
  const lightHours = light.off - light.on;
  const tankLevel = ROOM_TANK_LEVELS[room.id] ?? 60;

  const metricsInRange = [
    m.temp >= t.temp[0] && m.temp <= t.temp[1],
    m.humidity >= t.humidity[0] && m.humidity <= t.humidity[1],
    m.ph >= t.ph[0] && m.ph <= t.ph[1],
    m.ec >= t.ec[0] && m.ec <= t.ec[1],
    m.co2 >= t.co2[0] && m.co2 <= t.co2[1],
  ].filter(Boolean).length;
  const healthScore = Math.round(40 + (metricsInRange / 5) * 60);
  const healthLabel =
    healthScore >= 90
      ? "Excellent"
      : healthScore >= 70
        ? "Good"
        : healthScore >= 50
          ? "Fair"
          : "Needs attention";
  const healthColor = healthScore >= 90 ? "#5fd47e" : healthScore >= 70 ? "#5fd47e" : "#FFD166";

  return (
    <section className="px-5 mt-2 space-y-3">
      {/* Health score */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-ink">Plant Health</p>
          </div>
          <span className="text-2xl font-num font-bold" style={{ color: healthColor }}>
            {healthScore}
            <span className="text-sm font-normal text-ink-dim">/100</span>
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #2ea84a, ${healthColor})` }}
            initial={{ width: 0 }}
            animate={{ width: `${healthScore}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] font-semibold" style={{ color: healthColor }}>
            {healthLabel}
          </p>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full glass text-ink-dim">
              <Camera className="w-3 h-3" /> Scan
            </button>
            <button className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full glass text-ink-dim">
              <Video className="w-3 h-3" /> Live
            </button>
          </div>
        </div>
      </div>

      {/* Gauges grid */}
      <div className="grid grid-cols-2 gap-3">
        <Gauge
          icon={Thermometer}
          label="Temperature"
          value={m.temp}
          decimals={1}
          unit="°C"
          min={t.temp[0]}
          max={t.temp[1]}
        />
        <Gauge
          icon={Droplets}
          label="Humidity"
          value={m.humidity}
          unit="%"
          min={t.humidity[0]}
          max={t.humidity[1]}
        />
        <Gauge
          icon={FlaskConical}
          label="pH Level"
          value={m.ph}
          decimals={1}
          unit="pH"
          min={t.ph[0]}
          max={t.ph[1]}
          color="#FFD166"
        />
        <Gauge
          icon={Zap}
          label="Conductivity"
          value={m.ec}
          decimals={1}
          unit="mS"
          min={t.ec[0]}
          max={t.ec[1]}
        />
        <div className="col-span-2">
          <Gauge icon={Wind} label="CO₂" value={m.co2} unit="ppm" min={t.co2[0]} max={t.co2[1]} />
        </div>
      </div>

      {/* Water level */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-ink">Reservoir</p>
          </div>
          <span
            className="text-[11px] font-num font-semibold"
            style={{ color: tankLevel < 20 ? "#FF6B6B" : tankLevel < 50 ? "#FFD166" : "#5fd47e" }}
          >
            {tankLevel}%
          </span>
        </div>
        <WaterTank level={tankLevel} height={56} />
      </div>

      {/* Lighting */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-warning" />
            <p className="text-sm font-semibold text-ink">Lighting</p>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: lightOn ? "rgba(255,209,102,0.15)" : "rgba(255,255,255,0.05)",
              color: lightOn ? "#FFD166" : "#6a9778",
            }}
          >
            {lightOn ? "On" : "Off"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Sunrise", value: `${String(light.on).padStart(2, "0")}:00` },
            { label: "Hours", value: `${lightHours}h / day` },
            { label: "Intensity", value: `${light.intensity}%` },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center rounded-xl py-2"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <p className="text-[9px] uppercase tracking-wider text-ink-dim">{s.label}</p>
              <p className="text-xs font-num font-semibold text-ink mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's activity */}
      <RoomActivityFeed roomId={room.id} />
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Activity Feed (real Firestore events)                    */
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

function RoomActivityFeed({ roomId }: { roomId: string }) {
  const events = useRoomEvents(roomId, 8);
  if (events.length === 0) return null;
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim pt-1">
        Recent Activity
      </p>
      <div className="space-y-2 pb-2">
        {events.map((e, i) => {
          const Icon = eventIconMap[e.type] ?? Clock;
          const bg = eventColorMap[e.type] ?? "rgba(255,255,255,0.05)";
          const tc = eventTextMap[e.type] ?? "#8ab894";
          const timeStr = e.timestamp?.toDate
            ? e.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";
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
              <span className="text-[10px] font-num text-ink-dim whitespace-nowrap">{timeStr}</span>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Flowering Tab                                             */
/* ────────────────────────────────────────────────────────── */
function FloweringTab({ room }: { room: Room }) {
  const progress = Math.round((room.day / room.totalDays) * 100);
  const daysLeft = room.totalDays - room.day;
  const weeksLeft = Math.ceil(daysLeft / 7);
  const color =
    room.stage === "Flowering" ? "#FFD166" : room.stage === "Vegetative" ? "#5fd47e" : "#8ab894";
  const harvest = ROOM_HARVESTS[room.id] ?? { last: null, count: 0 };
  const [declared, setDeclared] = useState(false);

  const nextMilestone =
    room.stage === "Flowering"
      ? "Flush week"
      : room.stage === "Vegetative"
        ? "Switch to Flowering"
        : "Transplant ready";

  const estimatedHarvestDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + daysLeft);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  })();

  return (
    <section className="px-5 mt-2 space-y-3 pb-4">
      {/* Stage progress */}
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${color}20` }}
            >
              <Flower2 className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{room.stage}</p>
              <p className="text-[10px] text-ink-dim">Current stage</p>
            </div>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${color}18`, color }}
          >
            {weeksLeft}w left
          </span>
        </div>
        <div
          className="relative h-2.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, #2EA84A, ${color})`,
              boxShadow: `0 0 12px ${color}60`,
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

      {/* Key metrics */}
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
        ].map((metric) => (
          <div key={metric.label} className="glass rounded-2xl p-3 text-center">
            <p className="text-[10px] text-ink-dim uppercase tracking-wide">{metric.label}</p>
            <p
              className={`text-sm font-num font-semibold mt-1 ${metric.ok ? "text-primary" : "text-warning"}`}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Next milestone */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,209,102,0.12)" }}
        >
          <Leaf className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wide text-ink-dim">Next milestone</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{nextMilestone}</p>
          <p className="text-[11px] text-ink-dim font-num mt-0.5">
            ~{weeksLeft - 1 > 0 ? `${weeksLeft - 1}w` : "this week"}
          </p>
        </div>
      </div>

      {/* Harvest tracking */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Flower2 className="w-4 h-4 text-warning" />
          <p className="text-sm font-semibold text-ink">Harvest</p>
          {harvest.count > 0 && (
            <span
              className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,209,102,0.12)", color: "#FFD166" }}
            >
              {harvest.count}× collected
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-[9px] uppercase tracking-wider text-ink-dim">Est. Harvest</p>
            <p className="text-xs font-semibold text-ink mt-0.5">{estimatedHarvestDate}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-[9px] uppercase tracking-wider text-ink-dim">Last Collected</p>
            <p className="text-xs font-semibold text-ink mt-0.5">{harvest.last ?? "—"}</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setDeclared(true)}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: declared
              ? "rgba(46,168,74,0.2)"
              : "linear-gradient(135deg, #2EA84A, #5fd47e)",
            color: declared ? "#5fd47e" : "#06120a",
            border: declared ? "1px solid rgba(46,168,74,0.35)" : undefined,
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          {declared ? "Harvest Declared ✓" : "Declare Harvest"}
        </motion.button>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Dosing Tab                                                */
/* ────────────────────────────────────────────────────────── */
const ROOM_DOSES: Record<string, { nutrient: string; tankId: string; aiMl: number }[]> = {
  r1: [
    { nutrient: "Solution A", tankId: "t1", aiMl: 20 },
    { nutrient: "Solution B", tankId: "t2", aiMl: 20 },
    { nutrient: "Cal-Mag", tankId: "t5", aiMl: 10 },
  ],
  r2: [
    { nutrient: "Solution A", tankId: "t1", aiMl: 35 },
    { nutrient: "Solution B", tankId: "t2", aiMl: 35 },
    { nutrient: "Bloom Boost", tankId: "t6", aiMl: 20 },
    { nutrient: "Cal-Mag", tankId: "t5", aiMl: 5 },
  ],
  r3: [
    { nutrient: "Solution A", tankId: "t1", aiMl: 8 },
    { nutrient: "Cal-Mag", tankId: "t5", aiMl: 4 },
  ],
  r4: [
    { nutrient: "Solution A", tankId: "t1", aiMl: 35 },
    { nutrient: "Solution B", tankId: "t2", aiMl: 35 },
    { nutrient: "Bloom Boost", tankId: "t6", aiMl: 20 },
  ],
};

function DosingTab({ room }: { room: Room }) {
  const { user } = useAuth();
  const { tanks } = useTanks();
  const allLog = useDosingLog(20);
  const roomLog = allLog.filter((e) => e.roomId === room.id || e.roomName === room.name);
  const doses = ROOM_DOSES[room.id] ?? [];
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(doses.map((d) => [d.nutrient, d.aiMl])),
  );
  const [aiActive, setAiActive] = useState(true);
  const [applied, setApplied] = useState(false);
  const [autopilot, setAutopilot] = useState(false);

  const phOk = room.metrics.ph >= room.targets.ph[0] && room.metrics.ph <= room.targets.ph[1];
  const ecOk = room.metrics.ec >= room.targets.ec[0] && room.metrics.ec <= room.targets.ec[1];

  function setVal(nutrient: string, v: number) {
    setAiActive(false);
    setValues((prev) => ({ ...prev, [nutrient]: v }));
  }

  return (
    <section className="px-5 mt-2 space-y-3 pb-4">
      {/* Autopilot / Manual toggle */}
      <div className="glass rounded-2xl p-1 flex relative">
        {(["Manual", "Autopilot"] as const).map((mode) => {
          const active = autopilot === (mode === "Autopilot");
          return (
            <button
              key={mode}
              onClick={() => setAutopilot(mode === "Autopilot")}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold relative z-10 transition-colors flex items-center justify-center gap-1.5"
              style={{ color: active ? "#06120a" : "#8ab894" }}
            >
              {active && (
                <motion.span
                  layoutId="dose-mode"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{
                    background:
                      mode === "Autopilot"
                        ? "linear-gradient(135deg,#2EA84A,#5fd47e)"
                        : "linear-gradient(135deg,#2EA84A,#5fd47e)",
                  }}
                />
              )}
              {mode === "Autopilot" ? <Bot className="w-3.5 h-3.5" /> : null}
              {mode}
            </button>
          );
        })}
      </div>

      {/* Autopilot status card */}
      {autopilot && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 flex items-start gap-3"
          style={{ border: "1px solid rgba(46,168,74,0.3)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(46,168,74,0.14)" }}
          >
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Autopilot Active</p>
            <p className="text-[11px] text-ink-dim mt-0.5">
              AI is managing all dosing for {room.name}. Solutions are dosed automatically based on
              real-time EC, pH, and stage data.
            </p>
            <p className="text-[10px] text-primary mt-2">Next scheduled dose: 14:00 today</p>
          </div>
        </motion.div>
      )}

      {!autopilot && (
        <>
          {/* AI banner */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setValues(Object.fromEntries(doses.map((d) => [d.nutrient, d.aiMl])));
              setAiActive(true);
              setApplied(false);
            }}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden text-left"
            style={{ border: aiActive ? "1px solid rgba(46,168,74,0.35)" : undefined }}
          >
            <div
              className="absolute -right-6 -top-6 w-28 h-28 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(95,212,126,0.2), transparent 70%)",
              }}
            />
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(46,168,74,0.14)" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="relative flex-1">
              <p className="text-sm font-semibold text-ink">AI Recommendation</p>
              <p className="text-[11px] text-ink-dim mt-0.5">
                Day {room.day} · {room.stage} · EC {room.metrics.ec} mS
              </p>
            </div>
            {!aiActive && (
              <span
                className="relative text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(46,168,74,0.15)", color: "#5fd47e" }}
              >
                Restore
              </span>
            )}
          </motion.button>

          {/* Per-solution rows */}
          <div className="glass rounded-2xl overflow-hidden">
            {doses.map((d, i) => {
              const tank = tanks.find((t) => t.id === d.tankId);
              const val = values[d.nutrient] ?? d.aiMl;
              const isAi = val === d.aiMl;
              return (
                <div
                  key={d.nutrient}
                  className="px-4 py-3.5 flex items-center gap-3"
                  style={{
                    borderBottom:
                      i < doses.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  }}
                >
                  {/* Tank fill indicator */}
                  <div className="flex flex-col items-center gap-0.5 w-5 flex-shrink-0">
                    <div
                      className="w-2 rounded-full flex-shrink-0"
                      style={{
                        height: 32,
                        background: "rgba(255,255,255,0.07)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: `${tank?.level ?? 100}%`,
                          background:
                            (tank?.level ?? 100) < 20
                              ? "#FF6B6B"
                              : (tank?.level ?? 100) < 50
                                ? "#FFD166"
                                : "#5fd47e",
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                    <span
                      className="text-[8px] font-num"
                      style={{
                        color:
                          (tank?.level ?? 100) < 20
                            ? "#FF6B6B"
                            : (tank?.level ?? 100) < 50
                              ? "#FFD166"
                              : "#8ab894",
                      }}
                    >
                      {tank?.level ?? 100}%
                    </span>
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink">{d.nutrient}</p>
                    {isAi && (
                      <p className="text-[10px] text-primary mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </p>
                    )}
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setVal(d.nutrient, Math.max(0, val - 5))}
                      className="w-7 h-7 rounded-full glass text-ink-dim flex items-center justify-center text-base font-semibold active:scale-90 transition-transform"
                    >
                      −
                    </button>
                    <span className="text-sm font-num font-semibold text-ink w-12 text-center">
                      {val} ml
                    </span>
                    <button
                      onClick={() => setVal(d.nutrient, Math.min(100, val + 5))}
                      className="w-7 h-7 rounded-full glass text-ink-dim flex items-center justify-center text-base font-semibold active:scale-90 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* pH / EC status */}
          <div className="glass rounded-2xl p-4 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
              Water Status
            </p>
            {[
              {
                label: "pH",
                value: room.metrics.ph,
                unit: "",
                range: room.targets.ph,
                ok: phOk,
                note: phOk ? "No correction needed" : "Add pH Down to lower",
              },
              {
                label: "EC",
                value: room.metrics.ec,
                unit: " mS",
                range: room.targets.ec,
                ok: ecOk,
                note: ecOk ? "Within target range" : "Increase nutrient dose",
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-ink-dim">{s.label}</span>
                    <span
                      className="text-[11px] font-num font-semibold"
                      style={{ color: s.ok ? "#5fd47e" : "#FFD166" }}
                    >
                      {s.value}
                      {s.unit}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ((s.value - s.range[0]) / (s.range[1] - s.range[0])) * 100)}%`,
                        background: s.ok ? "linear-gradient(90deg,#2ea84a,#5fd47e)" : "#FFD166",
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-ink-soft mt-0.5">{s.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Apply button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              if (applied) return;
              try {
                const doseDocs = doses.map((d) => {
                  const tank = tanks.find((t) => t.name === d.nutrient);
                  return {
                    tankId: tank?.id ?? d.nutrient,
                    tankName: d.nutrient,
                    ml: values[d.nutrient] ?? d.aiMl,
                  };
                });
                await logDosing(user?.uid ?? "", room.id, room.name, doseDocs);
                setApplied(true);
                toast.success("Dosing logged");
              } catch {
                toast.error("Failed to log dosing");
              }
            }}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{
              background: applied
                ? "rgba(46,168,74,0.2)"
                : "linear-gradient(135deg, #2EA84A, #5fd47e)",
              color: applied ? "#5fd47e" : "#06120a",
              border: applied ? "1px solid rgba(46,168,74,0.35)" : undefined,
            }}
          >
            <FlaskConical className="w-4 h-4" />
            {applied ? "Dosing Applied ✓" : "Apply Dosing Now"}
          </motion.button>

          {/* Dosing log */}
          {roomLog.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim mb-2">
                Recent Doses
              </p>
              <div className="space-y-2">
                {roomLog.map((e, i) => {
                  const timeStr = e.timestamp?.toDate
                    ? e.timestamp
                        .toDate()
                        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-2xl px-4 py-3 flex items-start gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(46,168,74,0.10)" }}
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-ink">{e.recipeName}</p>
                          {timeStr && (
                            <span className="text-[10px] font-num text-ink-dim whitespace-nowrap flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeStr}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(Array.isArray(e.doses) ? e.doses : []).map((d, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-num px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(46,168,74,0.10)", color: "#5fd47e" }}
                            >
                              {d.tankName} {d.ml}ml
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
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
const API_URL_SETPOINTS = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type RecommendResult = {
  immediate: { metric: string; action: string; severity: string }[];
  optimizations: {
    setpoint: string;
    current: number[];
    suggested: number[];
    confidence: number;
    reason: string;
  }[];
  model_active: boolean;
};

function SetpointsTab({ room }: { room: Room }) {
  const t = room.targets;
  const ls = room.lightSchedule ?? { onHour: 6, offHour: 20 };
  const irr = room.irrigation ?? { intervalHours: 4, durationMin: 2 };
  const [lightOn, setLightOn] = useState(ls.onHour ?? 6);
  const [lightOff, setLightOff] = useState(ls.offHour ?? 20);
  const [irrigInterval, setIrrigInterval] = useState(irr.intervalHours ?? 4);
  const [irrigDuration, setIrrigDuration] = useState(irr.durationMin ?? 2);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<RecommendResult | null>(null);
  const [saving, setSaving] = useState(false);
  const lightHours = lightOff - lightOn;
  const peakStart = lightOn + 2;
  const peakEnd = lightOff - 2;

  async function fetchRecommendations() {
    setAiLoading(true);
    try {
      const res = await fetch(`${API_URL_SETPOINTS}/recommend/${room.id}`, { method: "POST" });
      if (!res.ok) throw new Error(`${res.status}`);
      setAiResult(await res.json());
    } catch {
      toast.error("Could not fetch AI recommendations — is the backend running?");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <section className="px-5 mt-2 space-y-4">
      {/* AI Recommendations banner */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={fetchRecommendations}
        disabled={aiLoading}
        className="w-full glass rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden text-left"
        style={{ border: aiResult ? "1px solid rgba(46,168,74,0.35)" : undefined }}
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
            {aiLoading ? "Analysing…" : aiResult ? "AI Analysis Ready" : "Get AI Recommendations"}
          </p>
          <p className="text-[11px] text-ink-dim mt-0.5">
            {aiResult
              ? `${aiResult.immediate.length} actions · ${aiResult.optimizations.length} optimisations${aiResult.model_active ? " · LightGBM active" : ""}`
              : `Rule engine + LightGBM for ${room.stage} · ${room.name}`}
          </p>
        </div>
        {!aiResult && !aiLoading && (
          <span
            className="relative text-xs font-semibold px-3 py-1.5 rounded-full text-[#06120a]"
            style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
          >
            Analyse
          </span>
        )}
      </motion.button>

      {/* Immediate actions */}
      {aiResult && aiResult.immediate.length > 0 && (
        <div className="space-y-2">
          {aiResult.immediate.map((a, i) => (
            <div
              key={i}
              className="rounded-xl px-3.5 py-3 flex items-start gap-3"
              style={{
                background:
                  a.severity === "critical" ? "rgba(255,107,107,0.10)" : "rgba(255,209,102,0.10)",
                border: `1px solid ${a.severity === "critical" ? "rgba(255,107,107,0.25)" : "rgba(255,209,102,0.2)"}`,
              }}
            >
              <AlertTriangle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: a.severity === "critical" ? "#FF6B6B" : "#FFD166" }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: a.severity === "critical" ? "#FF6B6B" : "#FFD166" }}
                >
                  {a.metric}
                </p>
                <p className="text-xs text-ink mt-0.5">{a.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setpoint optimisations */}
      {aiResult && aiResult.optimizations.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Setpoint Optimisations
          </p>
          {aiResult.optimizations.map((o, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink capitalize">{o.setpoint}</p>
                <p className="text-[10px] text-ink-dim mt-0.5">{o.reason}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-ink-dim line-through">
                  {o.current[0]}–{o.current[1]}
                </p>
                <p className="text-xs font-num font-semibold text-primary">
                  {o.suggested[0]}–{o.suggested[1]}
                </p>
                <p className="text-[9px] text-ink-soft">{Math.round(o.confidence * 100)}% conf</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {aiResult && aiResult.immediate.length === 0 && aiResult.optimizations.length === 0 && (
        <div className="glass rounded-xl px-4 py-3 text-xs text-primary flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> All metrics are within target — no action needed.
        </div>
      )}

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

      {/* Save all setpoints */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await saveSetpoints(room.id, {
              lightSchedule: { onHour: lightOn, offHour: lightOff },
              irrigation: { intervalHours: irrigInterval, durationMin: irrigDuration },
            });
            toast.success("Setpoints saved");
          } catch {
            toast.error("Failed to save");
          } finally {
            setSaving(false);
          }
        }}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{
          background: saving
            ? "rgba(255,255,255,0.06)"
            : "linear-gradient(135deg, #2EA84A, #5fd47e)",
          color: saving ? "#6a9778" : "#06120a",
        }}
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : "Save Setpoints"}
      </motion.button>
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

/* ────────────────────────────────────────────────────────── */
/*  Trends Tab  (live AI forecast from backend)              */
/* ────────────────────────────────────────────────────────── */
const METRIC_META = [
  { key: "temp" as const, label: "Temperature", icon: Thermometer, color: "#5fd47e", unit: "°C" },
  { key: "humidity" as const, label: "Humidity", icon: Droplets, color: "#5fd47e", unit: "%" },
  { key: "ph" as const, label: "pH", icon: FlaskConical, color: "#FFD166", unit: "" },
  { key: "ec" as const, label: "EC", icon: Zap, color: "#5fd47e", unit: " mS" },
  { key: "co2" as const, label: "CO₂", icon: Wind, color: "#8ab894", unit: " ppm" },
] as const;

function TrendsTab({ room }: { room: Room }) {
  const { data, loading, error, isDemo } = useRoomForecast(room.id);

  // Derive forecast alerts from real data: any day where forecast leaves target range
  const alerts: { metric: string; color: string; day: number; msg: string }[] = [];
  if (data) {
    for (const meta of METRIC_META) {
      const fd = data[meta.key];
      if (!fd) continue;
      const target = room.targets[meta.key as keyof typeof room.targets] as
        | [number, number]
        | undefined;
      if (!target) continue;
      fd.forecast.forEach((v, idx) => {
        if (v < target[0] || v > target[1]) {
          const dir = v < target[0] ? "below minimum" : "above maximum";
          alerts.push({
            metric: meta.label,
            color: meta.color,
            day: idx + 1,
            msg: `${meta.label} forecast ${v}${meta.unit.trim()} is ${dir} (target ${target[0]}–${target[1]}${meta.unit.trim()})`,
          });
        }
      });
    }
  }

  if (loading) {
    return (
      <section className="px-5 mt-2 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-2xl h-40 animate-pulse" />
        ))}
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="px-5 mt-8 flex flex-col items-center gap-3 text-center">
        <Brain className="w-10 h-10 text-ink-dim" />
        <p className="text-sm font-semibold text-ink">Not enough data yet</p>
        <p className="text-[11px] text-ink-dim max-w-[260px]">
          {error ?? "Forecast will appear once a few days of sensor readings have accumulated."}
        </p>
      </section>
    );
  }

  return (
    <section className="px-5 mt-2 space-y-3 pb-4">
      {/* Legend */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 rounded-full" style={{ background: "#5fd47e" }} />
          <span className="text-[10px] text-ink-dim uppercase tracking-widest">7d history</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-0.5 rounded-full border-t border-dashed"
            style={{ borderColor: "#8ab894", background: "transparent" }}
          />
          <span className="text-[10px] text-ink-dim uppercase tracking-widest">5d forecast</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] text-ink-dim">AI model</span>
        </div>
      </div>
      {isDemo && (
        <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2" style={{ background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.2)" }}>
          <span className="text-[10px]">⚡</span>
          <p className="text-[11px] text-warning">Demo forecast — no sensor history yet. Values are typical baselines; accuracy improves as readings accumulate.</p>
        </div>
      )}

      {/* Alerts derived from real forecast */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 4).map((a, i) => (
            <div
              key={i}
              className="rounded-xl px-3.5 py-3 flex items-center gap-3"
              style={{
                background: "rgba(255,209,102,0.10)",
                border: "1px solid rgba(255,209,102,0.2)",
              }}
            >
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-warning">
                  {a.metric} · +{a.day}d
                </p>
                <p className="text-[10px] text-ink-dim mt-0.5 truncate">{a.msg}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-metric chart cards */}
      {METRIC_META.map((m, i) => {
        const fd = data[m.key];
        if (!fd || fd.history.length === 0) return null;
        const target = room.targets[m.key as keyof typeof room.targets] as
          | [number, number]
          | undefined;
        const current = fd.history[fd.history.length - 1];
        const next = fd.forecast[0];
        const trending = next > current + 0.05 ? "↑" : next < current - 0.05 ? "↓" : "→";
        const outOfRange = target
          ? fd.forecast.filter((v) => v < target[0] || v > target[1]).length
          : 0;

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
                {outOfRange > 0 && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,107,107,0.15)", color: "#FF6B6B" }}
                  >
                    {outOfRange}d off target
                  </span>
                )}
                <span className="text-sm font-num font-semibold" style={{ color: m.color }}>
                  {trending} {current}
                  {m.unit}
                </span>
              </div>
            </div>

            <ForecastChart
              history={fd.history}
              forecast={fd.forecast}
              target={target ?? [0, 100]}
              color={m.color}
              unit={m.unit}
            />

            <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide">
              {fd.forecast.map((v, idx) => {
                const bad = target ? v < target[0] || v > target[1] : false;
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
                      {m.unit}
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
/*  Devices Tab — full CRUD                                   */
/* ────────────────────────────────────────────────────────── */
const deviceTypeOptions = [
  { value: "pump", label: "Pump" },
  { value: "light", label: "Light" },
  { value: "fan", label: "Fan" },
  { value: "heater", label: "Heater" },
  { value: "cooler", label: "Cooler" },
  { value: "camera", label: "Camera" },
];

function DevicesTab({ roomId, roomName }: { roomId: string; roomName: string }) {
  const { devices, loading } = useDevices(roomId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<DeviceFormData>({
    name: "",
    type: "fan",
    online: true,
    status: "off",
    battery: null,
  });
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditId(null);
    setForm({ name: "", type: "fan", online: true, status: "off", battery: null });
    setSheetOpen(true);
  }

  function openEdit(d: (typeof devices)[number]) {
    setEditId(d.id);
    setForm({
      name: d.name,
      type: d.type as DeviceFormData["type"],
      online: d.online,
      status: d.status,
      battery: d.battery,
    });
    setSheetOpen(true);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}"?`)) return;
    try {
      await deleteDevice(roomId, id);
      toast.success(`"${name}" removed`);
    } catch {
      toast.error("Failed to remove device");
    }
  }

  async function handleToggleOnline(d: (typeof devices)[number]) {
    try {
      await updateDevice(roomId, d.id, { online: !d.online });
    } catch {
      toast.error("Failed to update device");
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Device name required");
    setSaving(true);
    try {
      if (editId) {
        await updateDevice(roomId, editId, form);
        toast.success("Device updated");
      } else {
        await addDevice(roomId, form);
        toast.success(`"${form.name}" added`);
      }
      setSheetOpen(false);
    } catch {
      toast.error("Failed to save device");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="px-5 mt-2 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-ink-dim font-num">
          {devices.length} device{devices.length !== 1 ? "s" : ""} in {roomName}
        </p>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={openAdd}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-primary"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </motion.button>
      </div>

      {loading && <div className="glass rounded-2xl h-16 animate-pulse" />}

      {!loading && devices.length === 0 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openAdd}
          className="w-full glass rounded-2xl p-5 flex flex-col items-center gap-2 text-center"
          style={{ border: "1px dashed rgba(255,255,255,0.1)" }}
        >
          <Plus className="w-5 h-5 text-primary" />
          <p className="text-xs font-semibold text-ink">Add a device</p>
        </motion.button>
      )}

      {devices.map((d, i) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="glass rounded-2xl p-4 flex items-center gap-3"
        >
          <button
            onClick={() => handleToggleOnline(d)}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: d.online ? "rgba(46,168,74,0.12)" : "rgba(255,255,255,0.04)" }}
          >
            {d.online ? (
              <Wifi className="w-5 h-5 text-primary" />
            ) : (
              <WifiOff className="w-5 h-5 text-ink-soft" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{d.name}</p>
            <p className="text-[11px] text-ink-dim capitalize">{d.type}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: d.online ? "rgba(46,168,74,0.15)" : "rgba(255,107,107,0.15)",
                color: d.online ? "#5fd47e" : "#FF6B6B",
              }}
            >
              {d.online ? "Online" : "Offline"}
            </span>
            {d.battery !== null && (
              <span className="font-num text-[10px] text-ink-dim flex items-center gap-1">
                <Battery
                  className={`w-3 h-3 ${(d.battery ?? 100) < 20 ? "text-destructive" : "text-ink-soft"}`}
                />
                {d.battery}%
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 ml-1">
            <button
              onClick={() => openEdit(d)}
              className="w-6 h-6 rounded-full glass flex items-center justify-center"
            >
              <Pencil className="w-3 h-3 text-ink-dim" />
            </button>
            <button
              onClick={() => handleDelete(d.id, d.name)}
              className="w-6 h-6 rounded-full glass flex items-center justify-center"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </div>
        </motion.div>
      ))}

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editId ? "Edit Device" : "Add Device"}
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="e.g. Circulation Fan"
            />
          </Field>
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v as DeviceFormData["type"] })}
              options={deviceTypeOptions}
            />
          </Field>
          <Field label="Battery %">
            <Input
              type="number"
              value={form.battery ?? ""}
              onChange={(v) => setForm({ ...form, battery: v === "" ? null : Number(v) })}
              placeholder="Leave blank if wired"
            />
          </Field>
          <SheetButton onClick={handleSave} loading={saving}>
            {editId ? "Save Changes" : "Add Device"}
          </SheetButton>
          {editId && (
            <SheetButton
              onClick={async () => {
                await handleDelete(editId, form.name);
                setSheetOpen(false);
              }}
              destructive
            >
              Remove Device
            </SheetButton>
          )}
        </div>
      </Sheet>
    </section>
  );
}
