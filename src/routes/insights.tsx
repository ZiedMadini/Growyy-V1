import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { aiInsights } from "@/lib/mockData";
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});

const typeMap = {
  action: { icon: Lightbulb, color: "text-primary", bg: "bg-primary-soft" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15" },
  info: { icon: TrendingUp, color: "text-success", bg: "bg-success/15" },
} as const;

function InsightsPage() {
  return (
    <MobileShell>
      <AppHeader subtitle="Powered by Greeny AI" title="Smart Insights" showBack />

      <section className="px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground p-5 shadow-elev">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Today's outlook
          </div>
          <p className="mt-3 text-lg font-semibold leading-snug">
            Yields projected <span className="font-bold">+8.4%</span> this cycle vs last with current automation.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { l: "Water saved", v: "12%" },
              { l: "Energy", v: "−14%" },
              { l: "Risk score", v: "Low" },
            ].map((x) => (
              <div key={x.l} className="bg-white/15 backdrop-blur rounded-2xl p-3">
                <p className="text-[10px] uppercase tracking-wider opacity-80">{x.l}</p>
                <p className="text-lg font-bold mt-0.5">{x.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h3 className="text-sm font-bold mb-3">Recommendations</h3>
        <div className="space-y-3">
          {aiInsights.map((i) => {
            const cfg = typeMap[i.type as keyof typeof typeMap];
            return (
              <div key={i.id} className="bg-card border border-border rounded-2xl p-4 shadow-card hover:shadow-elev transition-smooth">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-foreground">{i.title}</p>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        i.priority === "high" ? "bg-destructive/10 text-destructive" :
                        i.priority === "medium" ? "bg-warning/15 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>{i.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-soft text-primary">
                        {i.zone}
                      </span>
                      <button className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        Apply <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h3 className="text-sm font-bold mb-3">Growth prediction</h3>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Cherry tomatoes • Zone A</p>
              <p className="text-base font-bold mt-0.5">Harvest in 4 days</p>
            </div>
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {[28, 38, 45, 52, 58, 64, 72, 78, 84, 88, 92, 96].map((h, idx) => (
              <div key={idx} className="flex-1 rounded-t-md bg-gradient-primary opacity-90" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
            <span>W1</span><span>W4</span><span>W8</span><span>W12</span>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
