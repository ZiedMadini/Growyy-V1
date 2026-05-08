import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { StatusDot } from "@/components/StatusDot";
import { useNotifications } from "@/hooks/useNotifications";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/firestore";
import { ChevronRight, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import type { RoomStatus } from "@/lib/mockData";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, loading, unreadCount } = useNotifications();

  async function handleMarkAll() {
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unread.length === 0) return;
    try {
      await markAllNotificationsRead(unread);
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to update notifications");
    }
  }

  async function handleMarkOne(id: string) {
    try {
      await markNotificationRead(id);
    } catch {
      // silent
    }
  }

  return (
    <MobileShell>
      <AppHeader subtitle="All alerts" title="Notifications" showBack />

      {unreadCount > 0 && (
        <div className="px-5 mb-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleMarkAll}
            className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-semibold text-ink-dim"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all {unreadCount} as read
          </motion.button>
        </div>
      )}

      <section className="px-5 space-y-2.5">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl h-16 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-12">
            <CheckCheck className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink">All clear</p>
            <p className="text-xs text-ink-dim mt-1">No alerts right now</p>
          </div>
        )}

        {notifications.map((n, i) => {
          const status: RoomStatus =
            n.severity === "critical"
              ? "critical"
              : n.severity === "warning"
                ? "warning"
                : "healthy";
          const timeStr = n.timestamp?.toDate
            ? (() => {
                const d = n.timestamp.toDate();
                const now = Date.now();
                const diff = now - d.getTime();
                if (diff < 60000) return "just now";
                if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
                if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
                return d.toLocaleDateString([], { month: "short", day: "numeric" });
              })()
            : "";

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
                onClick={() => !n.read && handleMarkOne(n.id)}
                className="block"
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="glass rounded-2xl p-4 flex items-center gap-3"
                  style={!n.read ? { border: "1px solid rgba(255,255,255,0.1)" } : undefined}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 glass-strong">
                    <StatusDot status={status} size={10} static />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${n.read ? "text-ink-dim" : "text-ink"} truncate`}
                    >
                      {n.title}
                    </p>
                    <p className="text-[11px] text-ink-soft mt-0.5 flex items-center gap-2">
                      <span>{timeStr}</span>
                      {!n.read && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ background: "#5fd47e" }}
                        />
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-soft flex-shrink-0" />
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </section>
    </MobileShell>
  );
}
