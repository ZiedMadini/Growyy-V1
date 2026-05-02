// src/components/welcome/FeatureCard.tsx
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong rounded-3xl p-5 max-w-[340px] mx-auto"
      style={{
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(95,212,126,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(46,168,74,0.18)",
            border: "1px solid rgba(95,212,126,0.35)",
          }}
        >
          <Icon className="w-5 h-5" style={{ color: "#5fd47e" }} strokeWidth={2.2} />
        </div>
        <h2 className="text-lg font-bold text-ink leading-tight">{title}</h2>
      </div>
      <p className="text-sm text-ink-dim mt-3 leading-relaxed">{description}</p>
    </motion.div>
  );
}
