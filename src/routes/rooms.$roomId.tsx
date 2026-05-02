import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { rooms, history7d, devicesMock, solutions } from "@/lib/mockData";
import { Thermometer, Droplets, FlaskConical, Zap, Wind, Sparkles, AlertTriangle, Wifi, WifiOff, Battery } from "lucide-react";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomDetail,
  notFoundComponent: () => (
    <MobileShell>
      <AppHeader title="Room not found" showBack />
    </MobileShell>
  ),
  loader: ({ params }) => {
    const room = rooms.find((r) => r.id === params.roomId);
    if (!room) throw notFound();
    return { room };
  },
});

const tabs = ["Overview", "Solutions", "Set Values", "History", "Devices"] as const;

function RoomDetail() {
  const { room } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  return (
    <MobileShell>
      <AppHeader
        subtitle={`${room.stage} • Day ${room.day}/${room.totalDays}`}
        title={room.name}
        showBack
      />

      <div className="px-5 sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-smooth ${
                tab === t
                  ? "bg-gradient-primary text-primary-foreground shadow-card"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "Overview" && <OverviewTab room={room} />}
      {tab === "Solutions" && <SolutionsTab />}
      {tab === "Set Values" && <SetValuesTab room={room} />}
      {tab === "History" && <HistoryTab />}
      {tab === "Devices" && <DevicesTab roomName={room.name} />}
    </MobileShell>
  );
}

function Gauge({ icon: Icon, label, value, unit, min, max }: {
  icon: typeof Thermometer; label: string; value: number; unit: string; min: number; max: number;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const angle = (pct / 100) * 270 - 135;
  return (
    <div className="bg-card border border-border rounded-3xl p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
      </div>
      <div className="mt-3 relative h-24 flex items-end justify-center">
        <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
          <path d="M 10 55 A 40 40 0 1 1 90 55" fill="none" stroke="var(--muted)" strokeWidth="6" strokeLinecap="round" />
          <path
            d="M 10 55 A 40 40 0 1 1 90 55"
            fill="none"
            stroke="url(#g1)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 188} 188`}
          />
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.16 152)" />
              <stop offset="100%" stopColor="oklch(0.72 0.18 150)" />
            </linearGradient>
          </defs>
          <circle cx={50 + 38 * Math.cos((angle * Math.PI) / 180)} cy={55 + 38 * Math.sin((angle * Math.PI) / 180)} r="3.5" fill="oklch(0.55 0.16 152)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{unit}</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1">target {min}–{max}</p>
    </div>
  );
}

function OverviewTab({ room }: { room: typeof rooms[number] }) {
  const m = room.metrics;
  const t = room.targets;
  return (
    <section className="px-5 mt-2 grid grid-cols-2 gap-3">
      <Gauge icon={Thermometer} label="Temp" value={m.temp} unit="°C" min={t.temp[0]} max={t.temp[1]} />
      <Gauge icon={Droplets} label="Humidity" value={m.humidity} unit="%" min={t.humidity[0]} max={t.humidity[1]} />
      <Gauge icon={FlaskConical} label="pH" value={m.ph} unit="pH" min={t.ph[0]} max={t.ph[1]} />
      <Gauge icon={Zap} label="EC" value={m.ec} unit="mS" min={t.ec[0]} max={t.ec[1]} />
      <div className="col-span-2">
        <Gauge icon={Wind} label="CO₂" value={m.co2} unit="ppm" min={t.co2[0]} max={t.co2[1]} />
      </div>
    </section>
  );
}

function SolutionsTab() {
  return (
    <section className="px-5 mt-2 space-y-3">
      <div className="bg-gradient-hero text-primary-foreground rounded-3xl p-4 shadow-card flex items-center gap-3">
        <Sparkles className="w-5 h-5" />
        <div>
          <p className="text-sm font-bold">AI Recommendations</p>
          <p className="text-[11px] opacity-80">Generated from live sensor data</p>
        </div>
      </div>
      {solutions.map((s) => (
        <div key={s.id} className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{s.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            <div className="flex gap-2 mt-3">
              <button className="text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-primary text-primary-foreground">Apply</button>
              <button className="text-xs font-bold px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">Dismiss</button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function RangeSlider({ label, unit, min, max, value, hardMin, hardMax }: {
  label: string; unit: string; min: number; max: number; value: [number, number]; hardMin: number; hardMax: number;
}) {
  const [v, setV] = useState(value);
  const lowPct = ((v[0] - hardMin) / (hardMax - hardMin)) * 100;
  const highPct = ((v[1] - hardMin) / (hardMax - hardMin)) * 100;
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs font-mono text-primary font-bold">{v[0]}–{v[1]} {unit}</p>
      </div>
      <div className="relative h-2 bg-muted rounded-full">
        <div className="absolute h-full bg-gradient-primary rounded-full" style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{hardMin}</span><span>{hardMax} {unit}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setV([Math.max(hardMin, v[0] - 0.5), v[1]])} className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-secondary">Min −</button>
        <button onClick={() => setV([Math.min(v[1] - 0.1, v[0] + 0.5), v[1]])} className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-secondary">Min +</button>
        <button onClick={() => setV([v[0], Math.max(v[0] + 0.1, v[1] - 0.5)])} className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-secondary">Max −</button>
        <button onClick={() => setV([v[0], Math.min(hardMax, v[1] + 0.5)])} className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-secondary">Max +</button>
      </div>
    </div>
  );
}

function SetValuesTab({ room }: { room: typeof rooms[number] }) {
  const t = room.targets;
  return (
    <section className="px-5 mt-2 space-y-3">
      <RangeSlider label="Temperature" unit="°C" min={t.temp[0]} max={t.temp[1]} value={t.temp} hardMin={15} hardMax={35} />
      <RangeSlider label="Humidity" unit="%" min={t.humidity[0]} max={t.humidity[1]} value={t.humidity} hardMin={30} hardMax={90} />
      <RangeSlider label="pH" unit="" min={t.ph[0]} max={t.ph[1]} value={t.ph} hardMin={4} hardMax={8} />
      <RangeSlider label="EC" unit="mS" min={t.ec[0]} max={t.ec[1]} value={t.ec} hardMin={0} hardMax={4} />
      <RangeSlider label="CO₂" unit="ppm" min={t.co2[0]} max={t.co2[1]} value={t.co2} hardMin={400} hardMax={1500} />
    </section>
  );
}

function MiniChart({ data, color = "oklch(0.55 0.16 152)" }: { data: number[]; color?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-24">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <polyline points={`0,100 ${points} 100,100`} fill={color} fillOpacity="0.12" />
    </svg>
  );
}

function HistoryTab() {
  const charts = [
    { label: "Temperature", unit: "°C", data: history7d.temp },
    { label: "Humidity", unit: "%", data: history7d.humidity },
    { label: "pH", unit: "", data: history7d.ph },
    { label: "EC", unit: "mS", data: history7d.ec },
  ];
  return (
    <section className="px-5 mt-2 space-y-3">
      <p className="text-xs text-muted-foreground">Past 7 days</p>
      {charts.map((c) => (
        <div key={c.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.data[c.data.length - 1]} {c.unit}</p>
          </div>
          <MiniChart data={c.data} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>
      ))}
    </section>
  );
}

function DevicesTab({ roomName }: { roomName: string }) {
  return (
    <section className="px-5 mt-2 space-y-2.5">
      <p className="text-xs text-muted-foreground">{devicesMock.length} sensors connected to {roomName}</p>
      {devicesMock.map((d) => (
        <div key={d.id} className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.online ? "bg-success/15" : "bg-muted"}`}>
            {d.online ? <Wifi className="w-5 h-5 text-success" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{d.name}</p>
            <p className="text-xs text-muted-foreground">{d.type} • {d.online ? "Online" : "Offline"}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold">
            <Battery className={`w-4 h-4 ${d.battery < 20 ? "text-destructive" : "text-muted-foreground"}`} />
            {d.battery}%
          </div>
        </div>
      ))}
    </section>
  );
}
