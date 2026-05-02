import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { rooms, type RoomStatus } from "@/lib/mockData";
import { Thermometer, Droplets, FlaskConical, Zap, ChevronRight, Sprout } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const statusStyles: Record<RoomStatus, { dot: string; ring: string; label: string; pill: string }> = {
  healthy: { dot: "bg-success", ring: "ring-success/30", label: "Healthy", pill: "bg-success/15 text-success" },
  warning: { dot: "bg-warning", ring: "ring-warning/30", label: "Attention", pill: "bg-warning/20 text-warning-foreground" },
  critical: { dot: "bg-destructive", ring: "ring-destructive/30", label: "Critical", pill: "bg-destructive/15 text-destructive" },
};

function HomePage() {
  const totalRooms = rooms.length;
  const healthy = rooms.filter((r) => r.status === "healthy").length;
  const issues = totalRooms - healthy;

  return (
    <MobileShell>
      <AppHeader subtitle="Welcome back" title="Your Grow" showNotifications showProfile />

      <section className="px-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-3 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rooms</p>
            <p className="text-xl font-bold mt-1">{totalRooms}</p>
          </div>
          <div className="bg-success/10 border border-success/20 rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-success">Healthy</p>
            <p className="text-xl font-bold mt-1 text-success">{healthy}</p>
          </div>
          <div className="bg-warning/15 border border-warning/30 rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-warning-foreground">Issues</p>
            <p className="text-xl font-bold mt-1 text-warning-foreground">{issues}</p>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Grow Rooms</h3>
          <span className="text-xs text-muted-foreground">Tap to open</span>
        </div>

        <div className="space-y-3">
          {rooms.map((r) => {
            const s = statusStyles[r.status];
            return (
              <Link
                key={r.id}
                to="/rooms/$roomId"
                params={{ roomId: r.id }}
                className="block bg-card border border-border rounded-3xl p-4 shadow-card hover:shadow-elev transition-smooth"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl bg-primary-soft flex items-center justify-center ring-4 ${s.ring}`}>
                      <Sprout className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.stage} • Day {r.day}/{r.totalDays}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${s.pill}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot} mr-1`} />
                      {s.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <Metric icon={Thermometer} v={r.metrics.temp} u="°C" />
                  <Metric icon={Droplets} v={r.metrics.humidity} u="%" />
                  <Metric icon={FlaskConical} v={r.metrics.ph} u="pH" />
                  <Metric icon={Zap} v={r.metrics.ec} u="EC" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/disease" className="bg-gradient-hero text-primary-foreground rounded-2xl p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">AI Tool</p>
            <p className="text-sm font-bold mt-1">Disease Detection</p>
            <p className="text-[11px] opacity-80 mt-1">Scan a leaf</p>
          </Link>
          <Link to="/chat" className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Copilot</p>
            <p className="text-sm font-bold mt-1">Ask Growy</p>
            <p className="text-[11px] text-muted-foreground mt-1">Get a diagnosis</p>
          </Link>
        </div>
      </section>
    </MobileShell>
  );
}

function Metric({ icon: Icon, v, u }: { icon: typeof Thermometer; v: number; u: string }) {
  return (
    <div className="bg-secondary/60 rounded-xl p-2 flex flex-col items-center">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <p className="text-sm font-bold mt-1 leading-none">{v}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{u}</p>
    </div>
  );
}
