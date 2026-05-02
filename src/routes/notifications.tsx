import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { notifications } from "@/lib/mockData";
import { AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

const sevMap = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary-soft" },
} as const;

function NotificationsPage() {
  return (
    <MobileShell>
      <AppHeader subtitle="All alerts" title="Notifications" showBack />

      <section className="px-5 space-y-2.5">
        {notifications.map((n) => {
          const cfg = sevMap[n.severity as keyof typeof sevMap];
          return (
            <Link
              key={n.id}
              to="/rooms/$roomId"
              params={{ roomId: n.roomId }}
              className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-start gap-3 hover:shadow-elev transition-smooth"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.room}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
            </Link>
          );
        })}
      </section>
    </MobileShell>
  );
}
