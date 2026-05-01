import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { devices } from "@/lib/mockData";
import { useState } from "react";
import { Droplets, Thermometer, Lightbulb, Wind, Cpu, Power } from "lucide-react";

export const Route = createFileRoute("/devices")({
  component: DevicesPage,
});

const iconMap = {
  irrigation: Droplets,
  climate: Thermometer,
  light: Lightbulb,
  fan: Wind,
  sensor: Cpu,
} as const;

function DevicesPage() {
  const [list, setList] = useState(devices);

  const toggle = (id: string) =>
    setList((l) => l.map((d) => (d.id === id ? { ...d, on: !d.on } : d)));
  const toggleAuto = (id: string) =>
    setList((l) => l.map((d) => (d.id === id ? { ...d, auto: !d.auto } : d)));
  const setLevel = (id: string, level: number) =>
    setList((l) => l.map((d) => (d.id === id ? { ...d, level } : d)));

  const onCount = list.filter((d) => d.on).length;

  return (
    <MobileShell>
      <AppHeader subtitle="IoT Control" title="Devices" showBack />

      <section className="px-5">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active devices</p>
            <p className="text-2xl font-bold mt-0.5">{onCount} <span className="text-sm font-medium text-muted-foreground">/ {list.length}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">Automation</span>
            <span className="w-10 h-6 bg-gradient-primary rounded-full relative shadow-glow">
              <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white" />
            </span>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6 space-y-3">
        {list.map((d) => {
          const Icon = iconMap[d.type as keyof typeof iconMap];
          return (
            <div key={d.id} className="bg-card border border-border rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-smooth ${
                  d.on ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.zone}</p>
                </div>
                <button
                  onClick={() => toggle(d.id)}
                  className={`relative w-12 h-7 rounded-full transition-smooth ${
                    d.on ? "bg-gradient-primary shadow-glow" : "bg-muted"
                  }`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-card transition-smooth ${
                    d.on ? "left-[22px]" : "left-0.5"
                  }`} />
                </button>
              </div>

              {d.on && d.type !== "sensor" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {d.type === "light" ? "Brightness" : d.type === "irrigation" ? "Flow" : "Intensity"}
                    </span>
                    <span className="text-xs font-bold text-primary">{d.level}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={d.level}
                    onChange={(e) => setLevel(d.id, Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                </div>
              )}

              <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
                <button
                  onClick={() => toggleAuto(d.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-smooth ${
                    d.auto ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {d.auto ? "Auto" : "Manual"}
                </button>
                <span className="text-[10px] text-muted-foreground">Last sync 30s ago</span>
              </div>
            </div>
          );
        })}
      </section>
    </MobileShell>
  );
}
