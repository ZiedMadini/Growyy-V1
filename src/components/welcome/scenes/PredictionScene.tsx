import { motion } from "framer-motion";
import { ComposedChart, Area, Line, ResponsiveContainer, YAxis, ReferenceLine } from "recharts";
import { forecastData } from "@/lib/mockData";
import { AlertTriangle, TrendingUp } from "lucide-react";

// Merge history + forecast into one timeline
const combined = [
  ...forecastData.temp.history.map((v, i) => ({
    day: i - 6,
    real: v,
    forecast: i === forecastData.temp.history.length - 1 ? v : null, // connect at join
  })),
  ...forecastData.temp.forecast.map((v, i) => ({
    day: i + 1,
    real: null,
    forecast: v,
  })),
];

const ALERTS = forecastData.temp.alerts;

export function PredictionScene() {
  return (
    <div className="h-full flex flex-col px-5 pt-2">
      {/* Alert badge */}
      <motion.div
        className="flex gap-2 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {ALERTS.map((a) => (
          <div
            key={a.msg}
            className="flex items-start gap-2 glass rounded-2xl px-3 py-2 flex-1"
            style={{ borderColor: "rgba(255,107,107,0.25)" }}
          >
            <AlertTriangle
              className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
              style={{ color: "#FF6B6B" }}
            />
            <p className="text-[11px] text-ink leading-snug">{a.msg}</p>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div
        className="flex-1 glass rounded-3xl overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Legend */}
        <div className="absolute top-3 right-3 flex gap-3 z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded-full" style={{ background: "#5fd47e" }} />
            <span className="text-[9px] text-ink-dim uppercase tracking-widest">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 rounded-full"
              style={{ background: "#FFD166", opacity: 0.8, borderTop: "1px dashed #FFD166" }}
            />
            <span className="text-[9px] text-ink-dim uppercase tracking-widest">Forecast</span>
          </div>
        </div>

        {/* "Today" label */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-ink-dim">Today</p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combined} margin={{ top: 24, right: 20, left: 20, bottom: 28 }}>
            <defs>
              <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5fd47e" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#5fd47e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
            <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="real"
              stroke="#5fd47e"
              strokeWidth={2.5}
              fill="url(#realGrad)"
              dot={false}
              connectNulls={false}
              isAnimationActive
              animationBegin={200}
              animationDuration={1200}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#FFD166"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
              isAnimationActive
              animationBegin={800}
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Prediction insight pill */}
      <motion.div
        className="mt-3 flex items-center gap-2 glass rounded-2xl px-4 py-2.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-[11px] text-ink">
          Temperature may exceed <span className="font-num font-semibold text-ink">26°C</span> in{" "}
          <span className="font-semibold" style={{ color: "#FFD166" }}>
            4 days
          </span>{" "}
          — check ventilation
        </p>
      </motion.div>

      <div className="pt-4 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
          Feature 04
        </p>
        <h2 className="text-2xl font-bold text-ink mt-1">AI Prediction</h2>
        <p className="text-sm text-ink-dim mt-2 leading-relaxed">
          See tomorrow before it arrives. Catch drift early and grow with confidence.
        </p>
      </div>
    </div>
  );
}
