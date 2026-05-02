import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useOnboarded } from "@/hooks/useOnboarded";
import { MonitoringScene } from "./scenes/MonitoringScene";
import { ControlScene } from "./scenes/ControlScene";
import { DataVizScene } from "./scenes/DataVizScene";
import { PredictionScene } from "./scenes/PredictionScene";
import { CelebrationScene } from "./scenes/CelebrationScene";

const SCENES = [
  MonitoringScene,
  ControlScene,
  DataVizScene,
  PredictionScene,
  CelebrationScene,
] as const;

const DOT_COUNT = SCENES.length - 1; // last scene is celebration, no dot for it

export function WelcomeScene() {
  const [index, setIndex] = useState(0);
  const [, setOnboarded] = useOnboarded();
  const navigate = useNavigate();

  const isLast = index === SCENES.length - 1;
  const Scene = SCENES[index];

  const advance = () => {
    if (isLast) {
      setOnboarded(true);
      navigate({ to: "/" });
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div
      className="relative w-full flex flex-col bg-breathe"
      style={{ height: "100dvh", minHeight: "100vh" }}
    >
      {/* Progress dots — hidden on celebration scene */}
      {!isLast && (
        <div className="flex justify-center gap-2 pt-10 pb-3 flex-shrink-0">
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <span
              key={i}
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === index ? 24 : 6,
                height: 6,
                background: i <= index ? "#5fd47e" : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>
      )}

      {/* Scene area */}
      <div className={`flex-1 relative overflow-hidden ${isLast ? "pt-10" : ""}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Scene />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="px-5 pb-8 pt-3 flex-shrink-0">
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.97 }}
          onClick={advance}
          className="w-full rounded-full py-4 font-semibold text-sm"
          style={{
            background: "linear-gradient(135deg, #2EA84A, #5fd47e)",
            color: "#06120a",
            boxShadow: "0 0 24px rgba(95,212,126,0.45), 0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          {isLast ? "Get Started" : "Continue"}
        </motion.button>
      </div>
    </div>
  );
}
