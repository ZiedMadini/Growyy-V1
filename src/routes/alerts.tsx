import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { alerts } from "@/lib/mockData";
import { AlertTriangle, AlertCircle, Info, Bell } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

const sevMap = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", ring: "ring-destructive/20" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15", ring: "ring-warning/20" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary-soft", ring: "ring-primary/20" },
} as const;

function AlertsPage() {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  return (
    <MobileShell>
      <AppHeader subtitle="Notifications" title="Alerts" showBack />

      <section className="px-5 grid grid-cols-3 gap-3">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-destructive">{critical}</p>
          <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mt-0.5">Critical</p>
        </div>
        <div className="bg-warning/15 border border-warning/20 rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-warning">{warning}</p>
          <p className="text-[10px] text-warning font-bold uppercase tracking-wider mt-0.5">Warning</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center shadow-card">
          <p className="text-lg font-bold text-foreground">{alerts.length}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Total</p>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Recent events</h3>
          <button className="text-xs font-semibold text-primary">Mark all read</button>
        </div>
        <div className="space-y-2.5">
          {alerts.map((a) => {
            const cfg = sevMap[a.severity as keyof typeof sevMap];
            return (
              <div key={a.id} className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{a.title}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="bg-gradient-soft border border-border rounded-2xl p-4 flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Push notifications</p>
            <p className="text-xs text-muted-foreground">Get alerts even when the app is closed</p>
          </div>
          <span className="w-10 h-6 bg-gradient-primary rounded-full relative shadow-glow">
            <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white" />
          </span>
        </div>
      </section>
    </MobileShell>
  );
}
