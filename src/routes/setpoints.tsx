import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { lightingCurve } from "@/lib/mockData";
import { Sun, Thermometer, Droplets } from "lucide-react";

export const Route = createFileRoute("/setpoints")({
  component: SetpointsPage,
});

const tabs = ["Lighting", "Environment", "Irrigation"] as const;

function SetpointsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Lighting");
  return (
    <MobileShell>
      <AppHeader subtitle="Automation" title="Setpoints" />

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

      {tab === "Lighting" && <Lighting />}
      {tab === "Environment" && <Environment />}
      {tab === "Irrigation" && <Irrigation />}
    </MobileShell>
  );
}

function Lighting() {
  const points = lightingCurve.map((p) => `${(p.h / 24) * 100},${100 - p.v * 0.85}`).join(" ");
  return (
    <section className="px-5 space-y-3">
      <div className="bg-card border border-border rounded-3xl p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-warning" />
            <p className="text-sm font-bold">24h Light Schedule</p>
          </div>
          <span className="text-xs font-mono text-primary font-bold">Peak 100%</span>
        </div>
        <div className="mt-4 relative bg-secondary/40 rounded-2xl p-3">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-40">
            <defs>
              <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.16 75)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="oklch(0.78 0.16 75)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <polyline points={`0,100 ${points} 100,100`} fill="url(#lg)" />
            <polyline points={points} fill="none" stroke="oklch(0.78 0.16 75)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            {lightingCurve.map((p, i) => (
              <circle key={i} cx={(p.h / 24) * 100} cy={100 - p.v * 0.85} r="1.5" fill="oklch(0.55 0.16 152)" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <PhaseCard label="Sunrise" time="06:00–10:00" />
          <PhaseCard label="Peak" time="10:00–18:00" />
          <PhaseCard label="Sunset" time="18:00–22:00" />
        </div>
      </div>
    </section>
  );
}

function PhaseCard({ label, time }: { label: string; time: string }) {
  return (
    <div className="bg-secondary/60 rounded-xl p-2.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-bold mt-1">{time}</p>
    </div>
  );
}

function Environment() {
  const items = [
    { icon: Thermometer, label: "Temperature", day: "24°C", night: "20°C" },
    { icon: Droplets, label: "Humidity", day: "60%", night: "65%" },
    { icon: Sun, label: "CO₂", day: "1000 ppm", night: "400 ppm" },
    { icon: Droplets, label: "VPD", day: "1.2 kPa", night: "0.9 kPa" },
  ];
  return (
    <section className="px-5 space-y-3">
      {items.map((it) => (
        <div key={it.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center">
              <it.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-bold">{it.label}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-warning/10 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-warning-foreground">Day</p>
              <p className="text-lg font-bold mt-1">{it.day}</p>
            </div>
            <div className="bg-secondary/60 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Night</p>
              <p className="text-lg font-bold mt-1">{it.night}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function Irrigation() {
  const rooms = [
    { name: "Veg Room A", interval: "Every 4h", duration: "2 min" },
    { name: "Flower Room 1", interval: "Every 3h", duration: "3 min" },
    { name: "Clone Tent", interval: "Every 6h", duration: "1 min" },
    { name: "Flower Room 2", interval: "Every 3h", duration: "3 min" },
  ];
  return (
    <section className="px-5 space-y-3">
      {rooms.map((r) => (
        <div key={r.name} className="bg-card border border-border rounded-2xl p-4 shadow-card">
          <p className="text-sm font-bold">{r.name}</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-secondary/60 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Interval</p>
              <p className="text-base font-bold mt-1 text-primary">{r.interval}</p>
            </div>
            <div className="bg-secondary/60 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duration</p>
              <p className="text-base font-bold mt-1 text-primary">{r.duration}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
