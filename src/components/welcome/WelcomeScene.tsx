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
import { PlantWorld, PLANT_WORLD_HEIGHT, PLANT_WORLD_WIDTH, SCENE_ANCHORS } from "./PlantWorld";
import { FarmerScene } from "./FarmerScene";
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
    description: "Watch trends unfold. Beautiful charts that make sense of every leaf, every drop.",
  },
  {
    icon: Sparkles,
    title: "AI Prediction",
    description: "See tomorrow before it arrives. Catch problems early and grow with confidence.",
  },
];

const VIEWPORT_HEIGHT = 844;
const TOP_VEGETABLE_Y_IN_WORLD = 205;

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefers;
}

const SCENE_TO_CAMERA_Y = (sceneIndex: number) => {
  const anchor = SCENE_ANCHORS[Math.min(sceneIndex, SCENE_ANCHORS.length - 1)];
  return anchor - VIEWPORT_HEIGHT / 2;
};

type Phase = "feature" | "harvesting" | "celebrating";

export function WelcomeScene() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("feature");
  const [, setOnboarded] = useOnboarded();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const cameraY = useMotionValue(SCENE_TO_CAMERA_Y(0));
  const vegY = useMotionValue(TOP_VEGETABLE_Y_IN_WORLD);
  const farmerOpacity = useMotionValue(0);
  const plantOpacity = useMotionValue(1);
  const celebration = useMotionValue(0);

  useEffect(() => {
    if (phase !== "feature") return;
    const target = SCENE_TO_CAMERA_Y(sceneIndex);
    if (reduced) {
      cameraY.set(target);
      return;
    }
    const controls = animate(cameraY, target, {
      duration: 1.0,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [sceneIndex, phase, cameraY, reduced]);

  const isLastFeatureScene = sceneIndex === SCENES.length - 1;

  const startHarvest = async () => {
    setPhase("harvesting");
    const fallTarget = PLANT_WORLD_HEIGHT - 80;
    const cameraFollowTarget = fallTarget - VIEWPORT_HEIGHT / 2;
    const duration = reduced ? 0.4 : 2.7;
    const ease = reduced ? ("linear" as const) : ([0.4, 0, 0.6, 1] as const);

    const vegAnim = animate(vegY, fallTarget, { duration, ease });
    const camAnim = animate(cameraY, cameraFollowTarget, { duration, ease });

    await Promise.all([vegAnim.then(), camAnim.then()]);

    setPhase("celebrating");
    animate(plantOpacity, 0, { duration: 0.6 });
    animate(farmerOpacity, 1, { duration: 0.8 });

    setTimeout(() => {
      animate(celebration, 1, { duration: 0.6 });
    }, 700);
  };

  const finish = () => {
    setOnboarded(true);
    navigate({ to: "/" });
  };

  const onPrimaryButton = () => {
    if (phase === "celebrating") return finish();
    if (isLastFeatureScene) return startHarvest();
    setSceneIndex((i) => i + 1);
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-breathe"
      style={{ height: "100vh", maxHeight: VIEWPORT_HEIGHT }}
    >
      {/* PLANT WORLD layer */}
      <motion.div style={{ opacity: plantOpacity, position: "absolute", inset: 0 }}>
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ width: PLANT_WORLD_WIDTH, height: VIEWPORT_HEIGHT, top: 0 }}
        >
          <CameraPanLayer cameraY={cameraY}>
            <PlantWorld
              sceneIndex={sceneIndex}
              activeScene={phase === "feature" ? sceneIndex : -1}
              vegY={phase === "harvesting" ? vegY : undefined}
              hideTopVegetable={phase === "celebrating"}
            />
          </CameraPanLayer>
        </div>
      </motion.div>

      {/* FARMER layer */}
      <motion.div
        style={{
          opacity: farmerOpacity,
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <CelebrationFarmer celebration={celebration} />
      </motion.div>

      {/* FEATURE CARD + CAPTION overlay */}
      <AnimatePresence mode="wait">
        {phase === "feature" && (
          <motion.div
            key={`card-${sceneIndex}`}
            className="absolute inset-x-0 bottom-28 px-5 z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FeatureCard {...SCENES[sceneIndex]} />
          </motion.div>
        )}

        {phase === "celebrating" && (
          <motion.p
            key="welcome-caption"
            className="absolute inset-x-0 bottom-32 z-10 text-center text-ink text-2xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            Welcome to Growyy
          </motion.p>
        )}
      </AnimatePresence>

      {/* PRIMARY BUTTON */}
      {phase !== "harvesting" && (
        <div className="absolute inset-x-0 bottom-8 px-5 z-20 flex justify-center">
          <motion.button
            key={phase + "-" + sceneIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: phase === "celebrating" ? 1.5 : 1.0, duration: 0.5 }}
            whileTap={{ scale: 0.96 }}
            onClick={onPrimaryButton}
            className="rounded-full px-8 py-3 font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #2EA84A, #5fd47e)",
              color: "#06120a",
              boxShadow: "0 0 24px rgba(95,212,126,0.5), 0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {phase === "celebrating"
              ? "Get Started"
              : isLastFeatureScene
                ? "See the harvest"
                : "Continue"}
          </motion.button>
        </div>
      )}

      {/* PROGRESS DOTS */}
      {phase === "feature" && (
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
      )}
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
      style={{ y: negY, position: "absolute", left: 0, top: 0, width: PLANT_WORLD_WIDTH }}
    >
      {children}
    </motion.div>
  );
}

function CelebrationFarmer({ celebration }: { celebration: MotionValue<number> }) {
  const [c, setC] = useState(0);
  useEffect(() => celebration.on("change", setC), [celebration]);
  return (
    <div style={{ marginBottom: 0 }}>
      <FarmerScene celebration={c} />
    </div>
  );
}
