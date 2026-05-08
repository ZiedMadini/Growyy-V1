import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Leaf } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate({ to: "/", replace: true });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 bg-breathe"
      style={{ background: "var(--background)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[380px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
          >
            <Leaf className="w-8 h-8 text-[#06120a]" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-ink-dim mt-1">Sign in to your Growy account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div
            className="glass rounded-2xl flex items-center gap-3 px-4 py-3.5"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Mail className="w-4 h-4 text-ink-dim flex-shrink-0" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-soft outline-none"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div
            className="glass rounded-2xl flex items-center gap-3 px-4 py-3.5"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Lock className="w-4 h-4 text-ink-dim flex-shrink-0" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-soft outline-none"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-destructive px-1"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-sm font-semibold text-[#06120a] mt-2"
            style={{
              background: loading
                ? "rgba(46,168,74,0.4)"
                : "linear-gradient(135deg, #2EA84A, #5fd47e)",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
