import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { FeatureCard } from "@/components/welcome/FeatureCard";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-breathe p-5">
      <FeatureCard
        icon={Activity}
        title="Live Monitoring"
        description="Every sensor in your greenhouse, breathing live. Temperature, pH, EC, humidity — always in your pocket."
      />
    </div>
  );
}
