import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Settings } from "lucide-react";

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  showSettings = false,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSettings?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="px-5 pt-12 pb-4 flex items-start justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.history.back()}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-card hover:bg-accent transition-smooth"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          {subtitle && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {subtitle}
            </p>
          )}
          <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
        </div>
      </div>
      {showSettings && (
        <Link
          to="/settings"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-card hover:bg-accent transition-smooth"
        >
          <Settings className="w-5 h-5" />
        </Link>
      )}
    </header>
  );
}
