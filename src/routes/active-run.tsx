import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/StatusDot";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useRooms } from "@/hooks/useRooms";
import { useRoomEvents } from "@/hooks/useRoomEvents";
import {
  Thermometer,
  Droplets,
  FlaskConical,
  Zap,
  Wind,
  Droplet,
  FlaskRound,
  AlertCircle,
  Sun,
} from "lucide-react";

export const Route = createFileRoute("/active-run")({
  component: ActiveRun,
});

const eventIcons = {
  dose: FlaskRound,
  irrigation: Droplet,
  alert: AlertCircle,
  light: Sun,
} as const;

function ActiveRun() {
  const { rooms, loading } = useRooms();
  // use the room with the highest day count as "active"
  const room = rooms.reduce<(typeof rooms)[number] | null>(
    (best, r) => (!best || r.day > best.day ? r : best),
    null,
  );
  const events = useRoomEvents(room?.id, 8);

  if (loading || !room) {
    return (
      <MobileShell>
        <AppHeader subtitle="Active cycle" title="Loading…" />
        <div className="px-5 mt-5 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-3xl h-32 animate-pulse" />
          ))}
        </div>
      </MobileShell>
    );
  }

  const pct = (room.day / room.totalDays) * 100;

  return (
    <MobileShell>
      <AppHeader subtitle="Active cycle" title={room.name} />

      <section className="px-5">
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div
            className="absolute -right-16 -top-16 w-48 h-48 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(95,212,126,0.18), transparent 70%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2">
              <StatusDot status={room.status} size={8} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
                {room.stage}
              </p>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-5xl font-num font-semibold text-ink leading-none">{room.day}</p>
              <p className="text-sm text-ink-dim mb-1">/ {room.totalDays} days</p>
            </div>
            <div
              className="mt-4 h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #2EA84A, #5fd47e)",
                  boxShadow: "0 0 12px rgba(95,212,126,0.6)",
                }}
              />
            </div>
            <p className="text-[11px] text-ink-dim mt-2 font-num">
              {room.totalDays - room.day} days until harvest
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-3">
          Live readings
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Reading icon={Thermometer} label="Temp" v={room.metrics?.temp ?? 0} d={1} u="°C" />
          <Reading icon={Droplets} label="Humidity" v={room.metrics?.humidity ?? 0} u="%" />
          <Reading icon={FlaskConical} label="pH" v={room.metrics?.ph ?? 0} d={1} u="" />
          <Reading icon={Zap} label="EC" v={room.metrics?.ec ?? 0} d={2} u="mS" />
          <Reading icon={Wind} label="CO₂" v={room.metrics?.co2 ?? 0} u="ppm" />
          <Reading icon={Droplets} label="VPD" v={room.metrics?.vpd ?? 0} d={2} u="kPa" />
        </div>
      </section>

      {events.length > 0 && (
        <section className="px-5 mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-3">
            Recent events
          </h3>
          <div className="space-y-2">
            {events.map((e, i) => {
              const Icon = eventIcons[e.type as keyof typeof eventIcons] ?? Sun;
              const timeStr = e.timestamp?.toDate
                ? e.timestamp
                    .toDate()
                    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-3 flex items-center gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(46,168,74,0.12)" }}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-ink flex-1">{e.text}</p>
                  <span className="text-[10px] font-num text-ink-dim">{timeStr}</span>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </MobileShell>
  );
}

function Reading({
  icon: Icon,
  label,
  v,
  u,
  d = 0,
}: {
  icon: typeof Thermometer;
  label: string;
  v: number;
  u: string;
  d?: number;
}) {
  return (
    <div className="glass rounded-2xl p-3">
      <Icon className="w-4 h-4 text-primary" />
      <p className="text-lg font-num font-semibold text-ink mt-2 leading-none">
        <AnimatedNumber value={v} decimals={d} />
        <span className="text-[10px] text-ink-dim ml-0.5">{u}</span>
      </p>
      <p className="text-[10px] text-ink-dim mt-1">{label}</p>
    </div>
  );
}
