import { Link, useLocation } from "@tanstack/react-router";
import { Home, FlaskConical, Camera, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { GreenhouseBg } from "./GreenhouseBg";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/nutrients", label: "Nutrients", icon: FlaskConical },
  { to: "/disease", label: "Scan", icon: Camera },
  { to: "/chat", label: "Chat", icon: MessageCircle },
] as const;

export function MobileShell({
  children,
  bgVariant = "leaves",
}: {
  children: ReactNode;
  bgVariant?: "leaves" | "pipes" | "none";
}) {
  const { pathname } = useLocation();
  const activeIndex = tabs.findIndex(
    (t) => pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to)),
  );

  return (
    <div className="min-h-screen w-full flex justify-center bg-breathe">
      <div className="relative w-full max-w-[440px] min-h-screen flex flex-col overflow-hidden">
        {bgVariant !== "none" && <GreenhouseBg variant={bgVariant} />}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[40vh]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(46,168,74,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative flex-1 pb-32">{children}</div>

        <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[80%] max-w-[360px] z-40">
          <div className="glass-strong rounded-full px-2 py-2 flex items-center justify-between relative">
            {tabs.map((t, i) => {
              const active = i === activeIndex;
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="relative flex items-center justify-center flex-1 h-10 rounded-full"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "radial-gradient(ellipse at center, rgba(46,168,74,0.35) 0%, rgba(46,168,74,0.10) 70%, transparent 100%)",
                        boxShadow: "0 0 18px rgba(46,168,74,0.45)",
                      }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5 px-2">
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={2}
                      style={{ color: active ? "#5fd47e" : "#6a9778" }}
                    />
                    {active && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        transition={{ duration: 0.25 }}
                        className="text-[11px] font-semibold whitespace-nowrap overflow-hidden"
                        style={{ color: "#5fd47e" }}
                      >
                        {t.label}
                      </motion.span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
