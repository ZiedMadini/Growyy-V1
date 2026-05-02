import { Link, useLocation } from "@tanstack/react-router";
import { Home, Sliders, FlaskConical, Activity, MessageCircle } from "lucide-react";
import { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/setpoints", label: "Setpoints", icon: Sliders },
  { to: "/nutrients", label: "Nutrients", icon: FlaskConical },
  { to: "/active-run", label: "Run", icon: Activity },
  { to: "/chat", label: "Chat", icon: MessageCircle },
] as const;

export function MobileShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen w-full flex justify-center">
      <div className="relative w-full max-w-[440px] min-h-screen bg-background flex flex-col shadow-elev">
        <div className="flex-1 pb-28">{children}</div>

        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[408px] z-40">
          <div className="bg-card/90 backdrop-blur-xl border border-border/60 rounded-3xl shadow-elev px-2 py-2 flex items-center justify-between">
            {tabs.map((t) => {
              const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`relative flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-smooth ${
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 bg-gradient-primary rounded-2xl shadow-glow" />
                  )}
                  <Icon className="relative w-5 h-5" strokeWidth={2.2} />
                  <span className="relative text-[10px] font-medium mt-0.5">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
