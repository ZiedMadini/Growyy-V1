import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { tanks, recipes, dosingLog } from "@/lib/mockData";
import { FlaskConical, Beaker, Clock, Plus } from "lucide-react";

export const Route = createFileRoute("/nutrients")({
  component: NutrientsPage,
});

const tabs = ["Tanks", "Recipes", "Log"] as const;

function NutrientsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Tanks");
  return (
    <MobileShell>
      <AppHeader subtitle="Hydroponic" title="Nutrient Delivery" />

      <div className="px-5 mb-3">
        <div className="bg-card border border-border rounded-2xl p-1 flex">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-smooth ${
                tab === t ? "bg-gradient-primary text-primary-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "Tanks" && <TanksView />}
      {tab === "Recipes" && <RecipesView />}
      {tab === "Log" && <LogView />}
    </MobileShell>
  );
}

function tankFill(level: number) {
  if (level < 25) return { fill: "oklch(0.6 0.22 25)", glow: "destructive" };
  if (level < 50) return { fill: "oklch(0.78 0.16 75)", glow: "warning" };
  return { fill: "oklch(0.55 0.16 152)", glow: "primary" };
}

function TanksView() {
  return (
    <section className="px-5">
      <div className="grid grid-cols-2 gap-3">
        {tanks.map((t) => {
          const c = tankFill(t.level);
          return (
            <div key={t.id} className="bg-card border border-border rounded-3xl p-3 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold truncate">{t.name}</p>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{t.type}</span>
              </div>
              <div className="relative bg-secondary/60 rounded-2xl h-32 overflow-hidden border border-border">
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all"
                  style={{ height: `${t.level}%`, background: `linear-gradient(180deg, ${c.fill}99, ${c.fill})` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/30" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold drop-shadow-sm">{t.level}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.volume}/{t.capacity} L</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecipesView() {
  return (
    <section className="px-5 space-y-3">
      <button className="w-full bg-gradient-primary text-primary-foreground rounded-2xl p-3 flex items-center justify-center gap-2 font-bold text-sm shadow-card">
        <Plus className="w-4 h-4" /> New Recipe
      </button>
      {recipes.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-2xl p-4 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.stage} • Week {r.week}</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary-soft text-primary">
              {r.room}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {r.doses.map((d, i) => (
              <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Beaker className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium">{d.nutrient}</span>
                </div>
                <span className="text-xs font-bold font-mono text-primary">{d.ml} ml/L</span>
              </div>
            ))}
          </div>
        </div>
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
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-smooth ${
              filter === r ? "bg-gradient-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {filtered.map((e) => (
          <div key={e.id} className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold truncate">{e.room}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {e.date} {e.time}
                </span>
              </div>
              <p className="text-xs text-primary font-semibold mt-0.5">{e.recipe}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{e.doses}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
