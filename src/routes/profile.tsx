import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { User, Mail, Bell, Ruler, Crown, ChevronRight, LogOut, Sprout } from "lucide-react";

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
        <div className="glass rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div
            className="absolute -right-12 -top-12 w-40 h-40 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(95,212,126,0.2), transparent 70%)" }}
          />
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#06120a] relative"
            style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
          >
            <User className="w-8 h-8" />
          </div>
          <div className="relative">
            <p className="text-lg font-semibold text-ink">Sami Benali</p>
            <p className="text-[11px] text-ink-dim flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" /> sami@growy.app
            </p>
            <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Pro Plan
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-2">
          Preferences
        </p>
        <div
          className="glass rounded-2xl divide-y"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}
        >
          <Row icon={Bell} label="Notifications">
            <button
              onClick={() => setNotifs(!notifs)}
              className="w-11 h-6 rounded-full relative transition-colors"
              style={{
                background: notifs
                  ? "linear-gradient(135deg, #2EA84A, #5fd47e)"
                  : "rgba(255,255,255,0.1)",
                boxShadow: notifs ? "0 0 12px rgba(46,168,74,0.5)" : undefined,
              }}
            >
              <motion.span
                animate={{ x: notifs ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
              />
            </button>
          </Row>
          <Row icon={Ruler} label="Temperature">
            <Toggle
              a="°C"
              b="°F"
              value={tempUnit === "C" ? "a" : "b"}
              onChange={(v) => setTempUnit(v === "a" ? "C" : "F")}
            />
          </Row>
          <Row icon={Ruler} label="Volume">
            <Toggle
              a="ml"
              b="oz"
              value={volUnit === "ml" ? "a" : "b"}
              onChange={(v) => setVolUnit(v === "a" ? "ml" : "oz")}
            />
          </Row>
        </div>
      </section>

      <section className="px-5 mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-2">
          Subscription
        </p>
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Growy Pro</p>
            <p className="text-[11px] text-ink-dim font-num">Renews Dec 12, 2026</p>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-soft" />
        </div>
      </section>

      <section className="px-5 mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-2">
          About
        </p>
        <Link
          to="/welcome"
          className="glass rounded-2xl p-4 flex items-center gap-3 active:scale-[0.985] transition-transform"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(46,168,74,0.18)",
              border: "1px solid rgba(95,212,126,0.35)",
            }}
          >
            <Sprout className="w-4 h-4" style={{ color: "#5fd47e" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Replay product tour</p>
            <p className="text-[11px] text-ink-dim">Watch the welcome animation again</p>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-soft" />
        </Link>
      </section>

      <section className="px-5 mt-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full glass rounded-2xl p-4 flex items-center justify-center gap-2 text-destructive font-semibold text-sm"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </motion.button>
      </section>
    </MobileShell>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: "rgba(46,168,74,0.12)" }}
      >
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="flex-1 text-sm text-ink">{label}</p>
      {children}
    </div>
  );
}

function Toggle({
  a,
  b,
  value,
  onChange,
}: {
  a: string;
  b: string;
  value: "a" | "b";
  onChange: (v: "a" | "b") => void;
}) {
  return (
    <div
      className="rounded-full p-0.5 flex text-[11px] font-semibold relative"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      {(["a", "b"] as const).map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className="relative px-3 py-1 rounded-full"
          style={{ color: value === k ? "#06120a" : "#8ab894" }}
        >
          {value === k && (
            <motion.span
              layoutId={`toggle-${a}-${b}`}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
            />
          )}
          <span className="relative">{k === "a" ? a : b}</span>
        </button>
      ))}
    </div>
  );
}
