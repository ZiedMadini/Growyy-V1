import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { User, Leaf, Cpu, Brain, Bell, Shield, HelpCircle, ChevronRight, LogOut } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function Row({
  icon: Icon, label, hint, toggle,
}: { icon: any; label: string; hint?: string; toggle?: boolean }) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-smooth">
      <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {toggle ? (
        <span className="w-10 h-6 bg-gradient-primary rounded-full relative shadow-glow">
          <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white" />
        </span>
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}

function SettingsPage() {
  return (
    <MobileShell>
      <AppHeader subtitle="Profile" title="Settings" showBack />

      <section className="px-5">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-card flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-card">
            SJ
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">Sami Jouini</p>
            <p className="text-xs text-muted-foreground">Greenhouse #1 • Tunis</p>
          </div>
          <button className="text-xs font-semibold text-primary bg-primary-soft px-3 py-1.5 rounded-full">Edit</button>
        </div>
      </section>

      <section className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Farm</p>
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden divide-y divide-border">
          <Row icon={Leaf} label="Farm configuration" hint="3 zones, 4 crops" />
          <Row icon={Cpu} label="Sensor management" hint="12 connected" />
          <Row icon={Brain} label="AI automation" hint="Smart mode enabled" toggle />
        </div>
      </section>

      <section className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Preferences</p>
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden divide-y divide-border">
          <Row icon={Bell} label="Notifications" hint="Push, email, critical only" />
          <Row icon={Shield} label="Privacy & security" />
          <Row icon={User} label="Account" />
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden divide-y divide-border">
          <Row icon={HelpCircle} label="Help & support" />
          <Row icon={LogOut} label="Sign out" />
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-6">Greeny Solutions • v1.0.0</p>
      </section>
    </MobileShell>
  );
}
