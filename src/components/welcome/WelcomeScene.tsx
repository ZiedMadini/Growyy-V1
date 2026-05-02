// src/components/welcome/WelcomeScene.tsx
import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  type MotionValue,
} from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Activity, SlidersHorizontal, BarChart3, Sparkles } from "lucide-react";
import { PlantWorld, PLANT_WORLD_WIDTH, SCENE_ANCHORS } from "./PlantWorld";
import { FeatureCard } from "./FeatureCard";
import { useOnboarded } from "@/hooks/useOnboarded";

const SCENES = [
  {
    icon: Activity,
    title: "Live Monitoring",
    description:
      "Every sensor in your greenhouse, breathing live. Temperature, pH, EC, humidity — always in your pocket.",
  },
  {
    icon: SlidersHorizontal,
    title: "Smart Control",
    description:
      "Dose nutrients, switch lights, run irrigation — from anywhere. Your greenhouse, on your terms.",
  },
  {
    icon: BarChart3,
    title: "Data Visualization",
    description:
      "Watch trends unfold. Beautiful charts that make sense of every leaf, every drop.",
  },
  {
    icon: Sparkles,
    title: "AI Prediction",
    description:
      "See tomorrow before it arrives. Catch problems early and grow with confidence.",
  },
];

const VIEWPORT_HEIGHT = 844;
const SCENE_TO_CAMERA_Y = (sceneIndex: number) => {
  const anchor = SCENE_ANCHORS[Math.min(sceneIndex, SCENE_ANCHORS.length - 1)];
  return anchor - VIEWPORT_HEIGHT / 2;
};

export function WelcomeScene() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [, setOnboarded] = useOnboarded();
  const navigate = useNavigate();

  const cameraY = useMotionValue(SCENE_TO_CAMERA_Y(0));

  useEffect(() => {
    const target = SCENE_TO_CAMERA_Y(sceneIndex);
    const controls = animate(cameraY, target, {
      duration: 1.0,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [sceneIndex, cameraY]);

  const isLastFeatureScene = sceneIndex === SCENES.length - 1;
  const finish = () => {
    setOnboarded(true);
    navigate({ to: "/" });
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-breathe"
      style={{ height: "100vh", maxHeight: VIEWPORT_HEIGHT }}
    >
      {/* CAMERA window over the tall PlantWorld */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ width: PLANT_WORLD_WIDTH, height: VIEWPORT_HEIGHT, top: 0 }}
      >
        <CameraPanLayer cameraY={cameraY}>
          <PlantWorld sceneIndex={sceneIndex} activeScene={sceneIndex} />
        </CameraPanLayer>
      </div>

      {/* FEATURE CARD overlay */}
      <div className="absolute inset-x-0 bottom-28 px-5 z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          <FeatureCard key={sceneIndex} {...SCENES[sceneIndex]} />
        </AnimatePresence>
      </div>

      {/* CONTINUE button */}
      <div className="absolute inset-x-0 bottom-8 px-5 z-20 flex justify-center">
        <motion.button
          key={isLastFeatureScene ? "next-to-harvest" : "continue"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (isLastFeatureScene) {
              // Task 8 will replace this with the harvest sequence.
              finish();
            } else {
              setSceneIndex((i) => i + 1);
            }
          }}
          className="rounded-full px-8 py-3 font-semibold text-sm"
          style={{
            background: "linear-gradient(135deg, #2EA84A, #5fd47e)",
            color: "#06120a",
            boxShadow: "0 0 24px rgba(95,212,126,0.5), 0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {isLastFeatureScene ? "See the harvest" : "Continue"}
        </motion.button>
      </div>

      {/* PROGRESS DOTS */}
      <div className="absolute top-6 inset-x-0 z-10 flex justify-center gap-2">
        {SCENES.map((_, i) => (
          <span
            key={i}
            className="block rounded-full transition-all"
            style={{
              width: i === sceneIndex ? 24 : 6,
              height: 6,
              background: i <= sceneIndex ? "#5fd47e" : "rgba(255,255,255,0.18)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CameraPanLayer({
  cameraY,
  children,
}: {
  cameraY: MotionValue<number>;
  children: React.ReactNode;
}) {
  const negY = useTransform(cameraY, (v) => -v);
  return (
    <motion.div
      style={{
        y: negY,
        width: PLANT_WORLD_WIDTH,
        position: "absolute",
        left: 0,
        top: 0,
      }}
    >
      {children}
    </motion.div>
  );
}
