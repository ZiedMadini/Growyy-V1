import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { crops } from "@/lib/mockData";
import { Sprout, Calendar, Heart, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/crops")({
  component: CropsPage,
});

const healthMap = {
  excellent: { label: "Excellent", color: "text-success", bg: "bg-success/15" },
  good: { label: "Good", color: "text-primary", bg: "bg-primary-soft" },
  warning: { label: "Needs attention", color: "text-warning", bg: "bg-warning/15" },
} as const;

function CropsPage() {
  return (
    <MobileShell>
      <AppHeader subtitle="Crop Monitoring" title="My Crops" showBack />

      <section className="px-5 grid grid-cols-3 gap-3">
        {[
          { l: "Zones", v: "3" },
          { l: "Crops", v: "4" },
          { l: "Avg health", v: "92%" },
        ].map((s) => (
          <div key={s.l} className="bg-card border border-border rounded-2xl p-3 shadow-card text-center">
            <p className="text-lg font-bold text-foreground">{s.v}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{s.l}</p>
          </div>
        ))}
      </section>

      <section className="px-5 mt-6 space-y-3">
        {crops.map((c) => {
          const h = healthMap[c.health as keyof typeof healthMap];
          return (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-4 shadow-card hover:shadow-elev transition-smooth">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-card">
                  <Sprout className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-bold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.zone}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${h.bg} ${h.color}`}>
                      {h.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" /> Day {c.days}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="w-3 h-3" /> {c.stage}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Growth</span>
                      <span className="text-xs font-bold text-primary">{c.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary rounded-full transition-smooth" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="px-5 mt-6">
        <button className="w-full bg-gradient-primary text-primary-foreground rounded-2xl py-3.5 font-semibold shadow-card flex items-center justify-center gap-2">
          <Heart className="w-4 h-4" /> Add new crop
        </button>
      </section>
    </MobileShell>
  );
}
