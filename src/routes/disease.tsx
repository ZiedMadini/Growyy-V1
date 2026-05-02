import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { Camera, Upload, Leaf, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/disease")({
  component: DiseasePage,
});

function DiseasePage() {
  const [scanned, setScanned] = useState(false);

  return (
    <MobileShell>
      <AppHeader subtitle="AI Vision" title="Disease Detection" showBack />

      {!scanned ? (
        <section className="px-5 space-y-3">
          <div className="bg-card border-2 border-dashed border-border rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary-soft flex items-center justify-center mb-3">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-bold">Scan a leaf</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Take a clear photo of an affected leaf in good lighting
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setScanned(true)}
              className="bg-gradient-primary text-primary-foreground rounded-2xl p-4 flex flex-col items-center gap-2 shadow-card font-bold text-sm"
            >
              <Camera className="w-6 h-6" />
              Take Photo
            </button>
            <button
              onClick={() => setScanned(true)}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 shadow-card font-bold text-sm"
            >
              <Upload className="w-6 h-6 text-primary" />
              Upload
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Tips</p>
            <ul className="space-y-2 text-xs">
              <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" /> Use natural light if possible</li>
              <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" /> Fill the frame with the leaf</li>
              <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" /> Show clear symptoms</li>
            </ul>
          </div>
        </section>
      ) : (
        <section className="px-5 space-y-3">
          <div className="bg-secondary/60 rounded-3xl h-48 flex items-center justify-center border border-border">
            <Leaf className="w-16 h-16 text-primary opacity-40" />
          </div>

          <div className="bg-card border border-border rounded-3xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-base font-bold">Powdery Mildew</p>
                  <p className="text-xs text-muted-foreground">Fungal infection</p>
                </div>
              </div>
              <span className="text-xs font-bold text-warning">94%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-warning rounded-full" style={{ width: "94%" }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Confidence</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Recommended Action</p>
            <ul className="space-y-2 text-xs">
              <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Reduce humidity to below 55%</li>
              <li className="flex gap-2"><span className="text-primary font-bold">2.</span> Increase airflow with circulation fans</li>
              <li className="flex gap-2"><span className="text-primary font-bold">3.</span> Apply potassium bicarbonate spray</li>
              <li className="flex gap-2"><span className="text-primary font-bold">4.</span> Remove and dispose of affected leaves</li>
            </ul>
          </div>

          <button onClick={() => setScanned(false)} className="w-full bg-card border border-border rounded-2xl py-3 text-sm font-bold">
            Scan another leaf
          </button>
        </section>
      )}
    </MobileShell>
  );
}
