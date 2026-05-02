// src/routes/welcome.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-breathe text-ink">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.18em] text-ink-dim">Welcome scene</p>
        <p className="text-2xl font-semibold mt-2">Coming up next…</p>
      </div>
    </div>
  );
}
