import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { WaterTank } from "@/components/WaterTank";
import { StatusDot } from "@/components/StatusDot";
import { tanks, recipes, dosingLog, rooms } from "@/lib/mockData";
import {
  FlaskConical,
  Clock,
  Plus,
  Beaker,
  ChevronRight,
  DropletIcon,
  CheckCircle2,
  Edit3,
} from "lucide-react";

export const Route = createFileRoute("/nutrients")({
  component: NutrientsPage,
});

const tabs = ["Formulas", "Dosing Log"] as const;

function NutrientsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Formulas");
  return (
    <MobileShell bgVariant="pipes">
      <AppHeader subtitle="Solution Management" title="Solutions" />

      <div className="px-5 mb-4">
        <div className="glass rounded-full p-1 flex relative">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-full text-xs font-semibold relative z-10 transition-colors"
                style={{ color: active ? "#06120a" : "#8ab894" }}
              >
                {active && (
                  <motion.span
                    layoutId="nut-tab"
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

      <div>
        {tab === "Formulas" && <FormulasView />}
        {tab === "Dosing Log" && <LogView />}
      </div>
    </MobileShell>
  );
}

/* ─── Stock strip ─── */
function StockStrip() {
  return (
    <div className="px-5 mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-2">
        Tank Stock
      </p>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
        {tanks.map((t) => {
          const status = t.level < 20 ? "critical" : t.level < 50 ? "warning" : "healthy";
          return (
            <div key={t.id} className="glass rounded-2xl p-2.5 flex-shrink-0 w-[88px]">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-semibold text-ink truncate flex-1 mr-1">{t.name}</p>
                <StatusDot status={status} size={6} />
              </div>
              <WaterTank level={t.level} height={70} showLabel={false} />
              <div className="mt-1.5 text-center">
                <p className="text-[11px] font-num font-semibold text-ink">{t.level}%</p>
                <p className="text-[9px] font-num text-ink-dim">
                  {t.volume}/{t.capacity}L
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Formulas tab ─── */
function FormulasView() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="px-5 space-y-3">
      <StockStrip />

      <motion.button
        whileTap={{ scale: 0.97 }}
        className="w-full glass rounded-2xl p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-primary"
      >
        <Plus className="w-4 h-4" /> New Formula
      </motion.button>

      {recipes.map((r, i) => {
        const isOpen = expanded === r.id;
        const totalMl = r.doses.reduce((s, d) => s + d.ml, 0);
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl overflow-hidden"
          >
            <button
              className="w-full p-4 flex items-center gap-3 text-left"
              onClick={() => setExpanded(isOpen ? null : r.id)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(46,168,74,0.12)" }}
              >
                <Beaker className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{r.name}</p>
                <p className="text-[11px] text-ink-dim mt-0.5">
                  {r.stage} · week {r.week} · <span className="font-num">{totalMl.toFixed(1)}</span>{" "}
                  ml/L total
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(46,168,74,0.12)", color: "#5fd47e" }}
                >
                  {r.room.split(" ")[0]}
                </span>
                <ChevronRight
                  className="w-4 h-4 text-ink-dim transition-transform"
                  style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                {r.doses.map((d, idx) => {
                  const tank = tanks.find((t) => t.name === d.nutrient);
                  const stock = tank?.level ?? 100;
                  const stockOk = stock >= 30;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      {tank ? (
                        <div className="w-9 flex-shrink-0">
                          <WaterTank level={stock} height={36} showLabel={false} />
                        </div>
                      ) : (
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <DropletIcon className="w-4 h-4 text-ink-dim" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink">{d.nutrient}</p>
                        {tank && (
                          <p
                            className={`text-[10px] font-num ${stockOk ? "text-ink-dim" : "text-destructive"}`}
                          >
                            {tank.volume}/{tank.capacity} L · {stock}% stock
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-num font-semibold text-primary">{d.ml}</span>
                        <span className="text-[10px] text-ink-dim">ml/L</span>
                        {stockOk ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-destructive/80 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-2 mt-3 pt-2 border-t border-white/5">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl text-[#06120a] flex items-center justify-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> Apply Now
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl glass text-ink-dim flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </section>
  );
}

/* ─── Dosing Log tab ─── */
function LogView() {
  const [filter, setFilter] = useState<string>("All");
  const roomNames = ["All", ...Array.from(new Set(dosingLog.map((d) => d.room)))];
  const filtered = filter === "All" ? dosingLog : dosingLog.filter((d) => d.room === filter);

  const grouped: Record<string, typeof dosingLog> = {};
  filtered.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  return (
    <section className="px-5 space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
        {roomNames.map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              color: filter === r ? "#06120a" : "#8ab894",
              background:
                filter === r
                  ? "linear-gradient(135deg, #2EA84A, #5fd47e)"
                  : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim mb-2">
            {date}
          </p>
          <div className="space-y-2">
            {entries.map((e, i) => {
              const room = rooms.find((r) => r.name === e.room);
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl p-3.5 flex items-start gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(46,168,74,0.10)" }}
                  >
                    <FlaskConical className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-ink">{e.recipe}</p>
                        <p className="text-[10px] text-ink-dim mt-0.5">{e.room}</p>
                      </div>
                      <span className="text-[10px] text-ink-dim font-num whitespace-nowrap flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {e.time}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {e.doses.split(" • ").map((d, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-num px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(46,168,74,0.10)", color: "#5fd47e" }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    {room && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div
                          className="h-1.5 flex-1 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((room.day / room.totalDays) * 100)}%`,
                              background: "linear-gradient(90deg, #2EA84A, #5fd47e)",
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-num text-ink-dim whitespace-nowrap">
                          day {room.day}/{room.totalDays}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
