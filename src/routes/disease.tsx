import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { LeafLoader } from "@/components/LeafLoader";
import { Camera, Upload, Leaf, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/disease")({
  component: DiseasePage,
});

function DiseasePage() {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 1400);
  };

  return (
    <MobileShell>
      <AppHeader subtitle="AI Vision" title="Disease Detection" showBack />

      {!scanned ? (
        <section className="px-5 space-y-3">
          <div
            className="glass rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
            style={{ borderStyle: "dashed" }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(46,168,74,0.12), transparent 70%)",
              }}
            />
            <div className="relative">
              {scanning ? (
                <LeafLoader size={56} />
              ) : (
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mb-3 mx-auto"
                  style={{ background: "rgba(46,168,74,0.14)" }}
                >
                  <Leaf className="w-8 h-8 text-primary" />
                </div>
              )}
              <p className="text-sm font-semibold text-ink mt-2">
                {scanning ? "Analyzing..." : "Scan a leaf"}
              </p>
              <p className="text-[11px] text-ink-dim mt-1 max-w-[240px]">
                {scanning
                  ? "Looking for visual signs of disease"
                  : "Take a clear photo in good lighting"}
              </p>
            </div>
          </div>

          {!scanning && (
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={startScan}
                className="rounded-2xl p-4 flex flex-col items-center gap-2 text-sm font-semibold text-[#06120a]"
                style={{
                  background: "linear-gradient(135deg, #2EA84A, #5fd47e)",
                  boxShadow: "0 8px 24px rgba(46,168,74,0.35)",
                }}
              >
                <Camera className="w-6 h-6" />
                Take Photo
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={startScan}
                className="glass rounded-2xl p-4 flex flex-col items-center gap-2 text-sm font-semibold text-ink"
              >
                <Upload className="w-6 h-6 text-primary" />
                Upload
              </motion.button>
            </div>
          )}

          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-3">
              Tips
            </p>
            <ul className="space-y-2 text-xs text-ink">
              <li className="flex gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Use
                natural light if possible
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Fill the
                frame with the leaf
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Show
                clear symptoms
              </li>
            </ul>
          </div>
        </section>
      ) : (
        <section className="px-5 space-y-3">
          <div className="glass rounded-3xl h-48 flex items-center justify-center relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(46,168,74,0.18), transparent 70%)",
              }}
            />
            <Leaf className="w-20 h-20 text-primary/40 relative" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,209,102,0.14)" }}
                >
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-base font-semibold text-ink">Powdery Mildew</p>
                  <p className="text-[11px] text-ink-dim">Fungal infection</p>
                </div>
              </div>
              <span className="text-sm font-num font-semibold text-warning">94%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "94%" }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: "#FFD166", boxShadow: "0 0 10px rgba(255,209,102,0.6)" }}
              />
            </div>
            <p className="text-[10px] text-ink-soft mt-1 font-semibold uppercase tracking-[0.16em]">
              Confidence
            </p>
          </motion.div>

          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
              Recommended Action
            </p>
            <ul className="space-y-2 text-xs text-ink">
              <li className="flex gap-2">
                <span className="text-primary font-num font-semibold">1.</span> Reduce humidity to
                below 55%
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-num font-semibold">2.</span> Increase airflow
                with circulation fans
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-num font-semibold">3.</span> Apply potassium
                bicarbonate spray
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-num font-semibold">4.</span> Remove and dispose
                of affected leaves
              </li>
            </ul>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setScanned(false)}
            className="w-full glass rounded-2xl py-3 text-sm font-semibold text-ink"
          >
            Scan another leaf
          </motion.button>
        </section>
      )}
    </MobileShell>
  );
}
