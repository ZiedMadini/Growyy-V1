import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { User, Mail, Bell, Ruler, Crown, ChevronRight, LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [volUnit, setVolUnit] = useState<"ml" | "oz">("ml");
  const [notifs, setNotifs] = useState(true);

  return (
    <MobileShell>
      <AppHeader subtitle="Account" title="Profile" showBack />

      <section className="px-5">
        <div className="bg-gradient-hero text-primary-foreground rounded-3xl p-5 shadow-elev flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-bold">Sami Benali</p>
            <p className="text-xs opacity-80 flex items-center gap-1"><Mail className="w-3 h-3" /> sami@growy.app</p>
            <p className="text-[10px] opacity-80 mt-1 flex items-center gap-1"><Crown className="w-3 h-3" /> Pro Plan</p>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Preferences</p>
        <div className="bg-card border border-border rounded-2xl shadow-card divide-y divide-border">
          <Row icon={Bell} label="Notifications">
            <button
              onClick={() => setNotifs(!notifs)}
              className={`w-10 h-6 rounded-full relative transition-smooth ${notifs ? "bg-gradient-primary shadow-glow" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-smooth ${notifs ? "right-0.5" : "left-0.5"}`} />
            </button>
          </Row>
          <Row icon={Ruler} label="Temperature">
            <Toggle a="°C" b="°F" value={tempUnit === "C" ? "a" : "b"} onChange={(v) => setTempUnit(v === "a" ? "C" : "F")} />
          </Row>
          <Row icon={Ruler} label="Volume">
            <Toggle a="ml" b="oz" value={volUnit === "ml" ? "a" : "b"} onChange={(v) => setVolUnit(v === "a" ? "ml" : "oz")} />
          </Row>
        </div>
      </section>

      <section className="px-5 mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Subscription</p>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">Growy Pro</p>
            <p className="text-xs text-muted-foreground">Renews Dec 12, 2026</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </section>

      <section className="px-5 mt-6">
        <button className="w-full bg-card border border-border rounded-2xl p-4 shadow-card flex items-center justify-center gap-2 text-destructive font-bold text-sm">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </section>
    </MobileShell>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="flex-1 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}

function Toggle({ a, b, value, onChange }: { a: string; b: string; value: "a" | "b"; onChange: (v: "a" | "b") => void }) {
  return (
    <div className="bg-secondary rounded-full p-0.5 flex text-[11px] font-bold">
      <button onClick={() => onChange("a")} className={`px-3 py-1 rounded-full ${value === "a" ? "bg-card shadow-card text-foreground" : "text-muted-foreground"}`}>{a}</button>
      <button onClick={() => onChange("b")} className={`px-3 py-1 rounded-full ${value === "b" ? "bg-card shadow-card text-foreground" : "text-muted-foreground"}`}>{b}</button>
    </div>
  );
}
