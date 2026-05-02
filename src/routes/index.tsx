import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/StatusDot";
import { WaterTank } from "@/components/WaterTank";
import { GrowyBot } from "@/components/GrowyBot";
import { rooms, tanks } from "@/lib/mockData";
import { Camera, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

// pair each room with a tank for the visual centerpiece
const roomTankLevel: Record<string, number> = {
  r1: 78,
  r2: 56,
  r3: 88,
  r4: 18,
};

function HomePage() {
  return (
    <MobileShell>
      <AppHeader subtitle="Welcome back" title="Your Grow" showNotifications showProfile />

      {/* Hero summary strip */}
      <section className="px-5">
        <div className="glass rounded-3xl p-4 flex items-center gap-4">
          <GrowyBot size={56} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
              Greenhouse status
            </p>
            <p className="text-sm text-ink mt-0.5">
              <span className="font-num text-ink">{rooms.filter((r) => r.status === "healthy").length}</span>
              <span className="text-ink-dim"> of </span>
              <span className="font-num text-ink">{rooms.length}</span>
              <span className="text-ink-dim"> rooms breathing well</span>
            </p>
          </div>
        </div>
      </section>

      {/* Room cards */}
      <section className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
            Rooms
          </h3>
        </div>

        <div className="space-y-4">
          {rooms.map((r, i) => {
            const lvl = roomTankLevel[r.id] ?? 60;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to="/rooms/$roomId"
                  params={{ roomId: r.id }}
                  className="block"
                >
                  <motion.div
                    whileTap={{ scale: 0.985 }}
                    className="glass rounded-3xl overflow-hidden relative"
                  >
                    {/* status dot */}
                    <div className="absolute top-3 right-3 z-10">
                      <StatusDot status={r.status} size={10} />
                    </div>

                    {/* water animation header */}
                    <div className="p-3 pb-0">
                      <WaterTank level={lvl} height={96} />
                    </div>

                    <div className="p-4 pt-3">
                      <p className="text-base font-semibold text-ink leading-tight">{r.name}</p>
                      <p className="text-[11px] text-ink-dim mt-0.5">
                        {r.stage} · day <span className="font-num">{r.day}</span>/<span className="font-num">{r.totalDays}</span>
                      </p>

                      {/* metric chips */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Chip>{r.metrics.temp.toFixed(1)}°C</Chip>
                        <Chip>{r.metrics.humidity}%</Chip>
                        <Chip>{r.metrics.ph} pH</Chip>
                        <Chip>{(r.metrics.ec * 1000).toFixed(0)} ppm</Chip>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* AI tools strip */}
      <section className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/disease" className="block">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="glass rounded-2xl p-4 relative overflow-hidden"
            >
              <div
                className="absolute -right-6 -top-6 w-24 h-24 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(95,212,126,0.2), transparent 70%)" }}
              />
              <Camera className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-ink mt-2">Scan a leaf</p>
              <p className="text-[10px] text-ink-dim mt-0.5">Disease detection</p>
            </motion.div>
          </Link>
          <Link to="/chat" className="block">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="glass rounded-2xl p-4 relative overflow-hidden"
            >
              <div
                className="absolute -right-6 -top-6 w-24 h-24 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(95,212,126,0.2), transparent 70%)" }}
              />
              <MessageCircle className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-ink mt-2">Ask Growy</p>
              <p className="text-[10px] text-ink-dim mt-0.5">AI copilot</p>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Tank shortcuts */}
      <section className="px-5 mt-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-3">
          Reservoirs
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {tanks.slice(0, 6).map((t) => (
            <div key={t.id} className="glass rounded-2xl p-2">
              <WaterTank level={t.level} height={80} />
              <p className="text-[10px] text-ink mt-2 text-center truncate">{t.name}</p>
            </div>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-num text-[12px] text-ink/90 px-2.5 py-1 rounded-full"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </span>
  );
}
