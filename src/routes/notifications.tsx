import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/StatusDot";
import { notifications } from "@/lib/mockData";
import { ChevronRight } from "lucide-react";
import type { RoomStatus } from "@/lib/mockData";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <MobileShell>
      <AppHeader subtitle="All alerts" title="Notifications" showBack />

      <section className="px-5 space-y-2.5">
        {notifications.map((n, i) => {
          const status: RoomStatus =
            n.severity === "critical" ? "critical" : n.severity === "warning" ? "warning" : "healthy";
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to="/rooms/$roomId"
                params={{ roomId: n.roomId }}
                className="block"
              >
                <motion.div whileTap={{ scale: 0.98 }} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 glass-strong">
                    <StatusDot status={status} size={10} static />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <span className="text-[10px] font-num text-ink-dim whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-ink-dim mt-0.5">{n.room}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-soft" />
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </section>
    </MobileShell>
  );
}
