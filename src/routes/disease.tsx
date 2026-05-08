import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { LeafLoader } from "@/components/LeafLoader";
import { Camera, Upload, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/disease")({
  component: DiseasePage,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Prediction = {
  disease: string;
  confidence: number;
  treatments: string[];
};

function DiseasePage() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ top: Prediction; others: Prediction[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function analyzeFile(file: File) {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${API_URL}/disease/analyze`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setResult({ top: data.topPrediction, others: data.alternatives ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setScanning(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) analyzeFile(file);
    e.target.value = "";
  }

  const isHealthy = result?.top.disease.toLowerCase().includes("healthy");

  return (
    <MobileShell>
      <AppHeader subtitle="AI Vision" title="Disease Detection" showBack />

      {!result && !scanning && (
        <section className="px-5 space-y-4">
          {/* Hero scan button */}
          <div className="flex flex-col items-center pt-4 pb-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => cameraRef.current?.click()}
              className="relative flex flex-col items-center justify-center rounded-full"
              style={{
                width: 160,
                height: 160,
                background: "linear-gradient(135deg, #2EA84A, #5fd47e)",
                boxShadow: "0 0 0 16px rgba(46,168,74,0.10), 0 0 0 32px rgba(46,168,74,0.05), 0 12px 40px rgba(46,168,74,0.45)",
              }}
            >
              <Camera className="w-14 h-14 text-[#06120a]" strokeWidth={1.5} />
            </motion.button>
            <p className="text-base font-semibold text-ink mt-5">Tap to scan a leaf</p>
            <p className="text-[11px] text-ink-dim mt-1">Point your camera at the affected area</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-ink-dim active:text-ink transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              or upload from gallery
            </button>
          </div>

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-xs text-destructive"
              style={{
                background: "rgba(255,107,107,0.12)",
                border: "1px solid rgba(255,107,107,0.25)",
              }}
            >
              {error}
            </div>
          )}

          {/* hidden file inputs */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-3">
              Tips
            </p>
            <ul className="space-y-2 text-xs text-ink">
              <li className="flex gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Use natural light if possible
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Fill the frame with the leaf
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Show clear symptoms
              </li>
            </ul>
          </div>
        </section>
      )}

      {scanning && (
        <section className="px-5 space-y-3">
          <div className="glass rounded-3xl p-12 flex flex-col items-center gap-4">
            <LeafLoader size={56} />
            <p className="text-sm font-semibold text-ink">Analyzing…</p>
            <p className="text-[11px] text-ink-dim text-center">
              Running EfficientNet-B0 on your image
            </p>
          </div>
        </section>
      )}

      {result && (
        <section className="px-5 space-y-3">
          {/* Top prediction */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: isHealthy ? "rgba(46,168,74,0.14)" : "rgba(255,209,102,0.14)",
                  }}
                >
                  {isHealthy ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-ink">{result.top.disease}</p>
                  <p className="text-[11px] text-ink-dim">
                    {isHealthy ? "No disease detected" : "Disease detected"}
                  </p>
                </div>
              </div>
              <span
                className="text-sm font-num font-semibold"
                style={{ color: isHealthy ? "#5fd47e" : "#FFD166" }}
              >
                {Math.round(result.top.confidence * 100)}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.top.confidence * 100}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{
                  background: isHealthy ? "#5fd47e" : "#FFD166",
                  boxShadow: `0 0 10px ${isHealthy ? "rgba(95,212,126,0.6)" : "rgba(255,209,102,0.6)"}`,
                }}
              />
            </div>
          </motion.div>

          {/* Treatments */}
          {result.top.treatments.length > 0 && !isHealthy && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                Recommended Actions
              </p>
              <ul className="space-y-2 text-xs text-ink">
                {result.top.treatments.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary font-num font-semibold">{i + 1}.</span> {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Alternatives */}
          {result.others.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-4 space-y-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
                Other possibilities
              </p>
              {result.others.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-ink">{r.disease}</span>
                      <span className="text-xs font-num text-ink-dim">
                        {Math.round(r.confidence * 100)}%
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full bg-ink-soft/40"
                        style={{ width: `${r.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setResult(null)}
            className="w-full glass rounded-2xl py-3 text-sm font-semibold text-ink flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Scan another leaf
          </motion.button>
        </section>
      )}
    </MobileShell>
  );
}
