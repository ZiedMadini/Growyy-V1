import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Bell, User } from "lucide-react";
import { ReactNode } from "react";

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  rightAction,
  showNotifications = false,
  showProfile = false,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  showNotifications?: boolean;
  showProfile?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="px-5 pt-12 pb-5 flex items-start justify-between gap-3 relative">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            onClick={() => router.history.back()}
            className="w-10 h-10 rounded-full glass flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-ink" />
          </button>
        )}
        <div className="min-w-0">
          {subtitle && (
            <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-[0.18em] truncate">
              {subtitle}
            </p>
          )}
          <h1 className="text-[26px] font-bold text-ink leading-tight truncate">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightAction}
        {showNotifications && (
          <Link
            to="/notifications"
            className="relative w-10 h-10 rounded-full glass flex items-center justify-center active:scale-95 transition-transform"
          >
            <Bell className="w-[18px] h-[18px] text-ink" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF6B6B]" />
          </Link>
        )}
        {showProfile && (
          <Link
            to="/profile"
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, #2EA84A, #5fd47e)",
              boxShadow: "0 4px 16px rgba(46,168,74,0.4)",
            }}
          >
            <User className="w-5 h-5 text-[#06120a]" />
          </Link>
        )}
      </div>
    </header>
  );
}
