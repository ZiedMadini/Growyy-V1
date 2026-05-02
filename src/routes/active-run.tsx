import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { rooms, recentEvents } from "@/lib/mockData";
import { Thermometer, Droplets, FlaskConical, Zap, Wind, Droplet, FlaskRound, AlertCircle, Sun } from "lucide-react";

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
  const room = rooms[1]; // Flower Room 1
  const pct = (room.day / room.totalDays) * 100;

  return (
    <MobileShell>
      <AppHeader subtitle="Active Cycle" title={room.name} />

      <section className="px-5">
        <div className="bg-gradient-hero text-primary-foreground rounded-3xl p-5 shadow-elev">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">{room.stage}</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-4xl font-bold">Day {room.day}</p>
            <p className="text-sm opacity-80">of {room.totalDays}</p>
          </div>
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs opacity-80 mt-2">{room.totalDays - room.day} days until harvest</p>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h3 className="text-sm font-bold mb-3">Live readings</h3>
        <div className="grid grid-cols-3 gap-3">
          <Reading icon={Thermometer} label="Temp" v={room.metrics.temp} u="°C" />
          <Reading icon={Droplets} label="Humidity" v={room.metrics.humidity} u="%" />
          <Reading icon={FlaskConical} label="pH" v={room.metrics.ph} u="" />
          <Reading icon={Zap} label="EC" v={room.metrics.ec} u="mS" />
          <Reading icon={Wind} label="CO₂" v={room.metrics.co2} u="ppm" />
          <Reading icon={Droplets} label="VPD" v={room.metrics.vpd} u="kPa" />
        </div>
      </section>

      <section className="px-5 mt-6">
        <h3 className="text-sm font-bold mb-3">Recent events</h3>
        <div className="space-y-2">
          {recentEvents.map((e) => {
            const Icon = eventIcons[e.type as keyof typeof eventIcons];
            return (
              <div key={e.id} className="bg-card border border-border rounded-2xl p-3 shadow-card flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs flex-1">{e.text}</p>
                <span className="text-[10px] text-muted-foreground">{e.time}</span>
              </div>
            );
          })}
        </div>
      </section>
    </MobileShell>
  );
}

function Reading({ icon: Icon, label, v, u }: { icon: typeof Thermometer; label: string; v: number; u: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 shadow-card">
      <Icon className="w-4 h-4 text-primary" />
      <p className="text-lg font-bold mt-2 leading-none">{v}<span className="text-[10px] text-muted-foreground font-medium ml-0.5">{u}</span></p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
