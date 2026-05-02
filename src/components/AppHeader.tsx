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
    <header className="px-5 pt-12 pb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            onClick={() => router.history.back()}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-card hover:bg-accent transition-smooth flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          {subtitle && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {subtitle}
            </p>
          )}
          <h1 className="text-2xl font-bold text-foreground leading-tight truncate">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightAction}
        {showNotifications && (
          <Link
            to="/notifications"
            className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-card hover:bg-accent transition-smooth"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive ring-2 ring-card" />
          </Link>
        )}
        {showProfile && (
          <Link
            to="/profile"
            className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-card text-primary-foreground"
          >
            <User className="w-5 h-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
