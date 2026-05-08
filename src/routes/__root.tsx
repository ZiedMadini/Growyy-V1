import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useOnboarded } from "@/hooks/useOnboarded";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useFCMToken } from "@/hooks/useFCMToken";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass rounded-3xl p-8">
        <h1 className="text-7xl font-num font-semibold text-ink">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-ink">Page not found</h2>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-[#06120a]"
          style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Growy — Smart Indoor Farming" },
      {
        name: "description",
        content: "Monitor, control & predict your hydroponic grow rooms from your phone.",
      },
      { name: "theme-color", content: "#0a1a0f" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}

function AuthGuard() {
  const [onboarded] = useOnboarded();
  const { user, loading } = useAuth();
  useFCMToken();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = location.pathname === "/login";
    const isWelcome = location.pathname === "/welcome";

    if (!user && !isAuthRoute && !isWelcome) {
      // Not logged in → go to login (skip onboarding check)
      navigate({ to: "/login", replace: true });
      return;
    }

    if (user && isAuthRoute) {
      navigate({ to: "/", replace: true });
      return;
    }

    // Onboarding redirect (only for logged-in users)
    if (user && !onboarded && location.pathname === "/") {
      navigate({ to: "/welcome", replace: true });
    }
  }, [loading, user, onboarded, location.pathname, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div
          className="w-10 h-10 rounded-2xl animate-pulse"
          style={{ background: "rgba(46,168,74,0.3)" }}
        />
      </div>
    );
  }

  return <Outlet />;
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(14,28,18,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e8f5ec",
              borderRadius: "16px",
              fontSize: "13px",
              backdropFilter: "blur(12px)",
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
