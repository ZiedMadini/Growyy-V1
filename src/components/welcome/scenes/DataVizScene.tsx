import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { history7d } from "@/lib/mockData";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const chartData = history7d.temp.map((temp, i) => ({
  day: DAY_LABELS[i],
  temp,
  humidity: history7d.humidity[i],
}));

const STAT_PILLS = [
  { label: "Avg Temp", value: "24.2°C", color: "#5fd47e" },
  { label: "Avg Humidity", value: "65%", color: "#5fd47e" },
  { label: "7-Day Trend", value: "+0.4°C", color: "#FFD166" },
];

export function DataVizScene() {
  return (
    <div className="h-full flex flex-col px-5 pt-2">
      {/* Stat pills */}
      <motion.div
        className="flex gap-2 flex-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {STAT_PILLS.map(({ label, value, color }) => (
          <div key={label} className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}` }}
            />
            <span className="text-[11px] text-ink-dim">{label}</span>
            <span className="text-[11px] font-num font-semibold text-ink">{value}</span>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div
        className="flex-1 mt-3 glass rounded-3xl overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Day labels along the bottom */}
        <div className="absolute bottom-3 inset-x-4 flex justify-between z-10">
          {DAY_LABELS.map((d) => (
            <span
              key={d}
              className="text-[9px] font-semibold text-ink-dim uppercase tracking-widest"
            >
              {d}
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 16, left: 16, bottom: 28 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5fd47e" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#5fd47e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD166" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#FFD166" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#5fd47e"
              strokeWidth={2.5}
              fill="url(#tempGrad)"
              dot={false}
              isAnimationActive
              animationBegin={200}
              animationDuration={1400}
            />
            <Area
              type="monotone"
              dataKey="humidity"
              stroke="#FFD166"
              strokeWidth={1.5}
              fill="url(#humGrad)"
              dot={false}
              isAnimationActive
              animationBegin={400}
              animationDuration={1400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="pt-4 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
          Feature 03
        </p>
        <h2 className="text-2xl font-bold text-ink mt-1">Data Visualization</h2>
        <p className="text-sm text-ink-dim mt-2 leading-relaxed">
          Watch trends unfold. Beautiful charts that make sense of every leaf, every drop.
        </p>
      </div>
    </div>
  );
}
