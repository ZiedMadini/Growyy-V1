import { createFileRoute } from "@tanstack/react-router";
import { WelcomeScene } from "@/components/welcome/WelcomeScene";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return <WelcomeScene />;
}
