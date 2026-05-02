import { createFileRoute } from "@tanstack/react-router";
import { PlantWorld, PLANT_WORLD_HEIGHT, PLANT_WORLD_WIDTH } from "@/components/welcome/PlantWorld";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen w-full bg-breathe overflow-auto">
      <div style={{ width: PLANT_WORLD_WIDTH, height: PLANT_WORLD_HEIGHT, margin: "0 auto" }}>
        <PlantWorld sceneIndex={3} />
      </div>
    </div>
  );
}
