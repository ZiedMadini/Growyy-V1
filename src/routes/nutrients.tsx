import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { WaterTank } from "@/components/WaterTank";
import { StatusDot } from "@/components/StatusDot";
import { tanks, recipes, dosingLog } from "@/lib/mockData";
import { FlaskConical, Clock, Plus } from "lucide-react";

export const Route = createFileRoute("/nutrients")({
  component: NutrientsPage,
});

const tabs = ["Tanks", "Recipes", "Log"] as const;

function NutrientsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Tanks");
  return (
    <MobileShell bgVariant="pipes">
      <AppHeader subtitle="Hydroponic" title="Nutrients" />

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
        {tab === "Tanks" && <TanksView />}
        {tab === "Recipes" && <RecipesView />}
        {tab === "Log" && <LogView />}
      </div>
    </MobileShell>
  );
}

function TanksView() {
  return (
    <section className="px-5">
      <div className="grid grid-cols-2 gap-3">
        {tanks.map((t, i) => {
          const status = t.level < 20 ? "critical" : t.level < 50 ? "warning" : "healthy";
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="glass rounded-3xl p-3 relative"
            >
              <div className="absolute top-3 right-3 z-10">
                <StatusDot status={status} size={8} />
              </div>
              <WaterTank level={t.level} height={150} />
              <div className="mt-2.5">
                <p className="text-xs font-semibold text-ink truncate">{t.name}</p>
                <p className="text-[10px] text-ink-dim font-num mt-0.5">
                  {t.volume}/{t.capacity} L
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function RecipesView() {
  return (
    <section className="px-5 space-y-3">
      <motion.button
        whileTap={{ scale: 0.97 }}
        className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-sm font-semibold text-primary"
      >
        <Plus className="w-4 h-4" /> New Recipe
      </motion.button>
      {recipes.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{r.name}</p>
              <p className="text-[11px] text-ink-dim mt-0.5">
                {r.stage} · week <span className="font-num">{r.week}</span>
              </p>
            </div>
            <span className="text-[10px] font-semibold text-primary px-2 py-1 rounded-full" style={{ background: "rgba(46,168,74,0.12)" }}>
              {r.room}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {r.doses.map((d, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <span className="text-xs text-ink">{d.nutrient}</span>
                <span className="text-xs font-num text-primary font-semibold">{d.ml} ml/L</span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </section>
  );
}

function LogView() {
  const [filter, setFilter] = useState<string>("All");
  const roomNames = ["All", ...Array.from(new Set(dosingLog.map((d) => d.room)))];
  const filtered = filter === "All" ? dosingLog : dosingLog.filter((d) => d.room === filter);

  return (
    <section className="px-5">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-3">
        {roomNames.map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors glass"
            style={{
              color: filter === r ? "#06120a" : "#8ab894",
              background: filter === r ? "linear-gradient(135deg, #2EA84A, #5fd47e)" : undefined,
            }}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {filtered.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl p-4 flex items-start gap-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(46,168,74,0.12)" }}
            >
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink truncate">{e.room}</p>
                <span className="text-[10px] text-ink-dim font-num whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {e.date} {e.time}
                </span>
              </div>
              <p className="text-[11px] text-primary font-semibold mt-0.5">{e.recipe}</p>
              <p className="text-[11px] text-ink-dim mt-1 font-num">{e.doses}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
