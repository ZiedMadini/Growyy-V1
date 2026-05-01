import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { sensorData, aiInsights, crops } from "@/lib/mockData";
import {
  Thermometer, Droplets, Sun, Wind, Sprout, Brain,
  Zap, ArrowUpRight, Sparkles, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const statusColor = {
  optimal: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
} as const;

function HomePage() {
  const quickStats = [
    { icon: Thermometer, label: "Temp", v: sensorData.temperature.value, u: "°C", s: sensorData.temperature.status },
    { icon: Droplets, label: "Humidity", v: sensorData.humidity.value, u: "%", s: sensorData.humidity.status },
    { icon: Sprout, label: "Soil", v: sensorData.soilMoisture.value, u: "%", s: sensorData.soilMoisture.status },
    { icon: Sun, label: "Light", v: sensorData.light.value, u: "lx", s: sensorData.light.status },
  ];

  return (
    <MobileShell>
      <AppHeader subtitle="Good morning, Sami" title="Greenhouse #1" showSettings />

      {/* AI status hero */}
      <section className="px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elev">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
                <Sparkles className="w-3.5 h-3.5" /> Greeny AI
              </div>
              <h2 className="mt-2 text-2xl font-bold leading-tight">All systems optimal</h2>
              <p className="mt-1 text-sm opacity-90 max-w-[260px]">
                3 zones monitored • 12 sensors active • Last sync 12s ago
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Brain className="w-7 h-7" />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Link to="/insights" className="flex-1 bg-white/20 hover:bg-white/25 backdrop-blur rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between transition-smooth">
              View AI insights <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick sensor grid */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Live sensors</h3>
          <span className="text-xs text-muted-foreground">Updated now</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center">
                  <s.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className={`text-[10px] font-bold uppercase ${statusColor[s.s as keyof typeof statusColor]}`}>
                  {s.s}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{s.v}</span>
                  <span className="text-xs text-muted-foreground font-medium">{s.u}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-5 mt-6">
        <h3 className="text-sm font-bold text-foreground mb-3">Quick actions</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {[
            { icon: Droplets, label: "Water plants", tone: "primary" },
            { icon: Wind, label: "Adjust climate", tone: "soft" },
            { icon: Zap, label: "Boost lights", tone: "soft" },
            { icon: CheckCircle2, label: "Run diagnostics", tone: "soft" },
          ].map((a) => (
            <button
              key={a.label}
              className={`flex-shrink-0 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth ${
                a.tone === "primary"
                  ? "bg-gradient-primary text-primary-foreground shadow-card"
                  : "bg-card border border-border text-foreground hover:bg-accent"
              }`}
            >
              <a.icon className="w-4 h-4" /> {a.label}
            </button>
          ))}
        </div>
      </section>

      {/* Top AI recommendation */}
      <section className="px-5 mt-6">
        <h3 className="text-sm font-bold text-foreground mb-3">Top recommendation</h3>
        <Link to="/insights" className="block bg-card border border-border rounded-2xl p-4 shadow-card hover:shadow-elev transition-smooth">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{aiInsights[0].title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{aiInsights[0].desc}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-soft text-primary">
                  {aiInsights[0].zone}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Crops snapshot */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Active crops</h3>
          <Link to="/crops" className="text-xs font-semibold text-primary">See all</Link>
        </div>
        <div className="space-y-2.5">
          {crops.slice(0, 2).map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.zone} • {c.stage} • Day {c.days}</p>
                </div>
                <span className="text-xs font-bold text-primary">{c.progress}%</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${c.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
