import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Thermometer,
  Droplets,
  FlaskConical,
  Zap,
  Sun,
  Flower2,
  Sprout,
  Leaf,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { WaterTank } from "@/components/WaterTank";
import { GrowyBot } from "@/components/GrowyBot";
import { GrowBar } from "@/components/GrowBar";
import { Sheet, Field, Input, Select, RangeRow, SheetButton } from "@/components/Sheet";
import { useRooms } from "@/hooks/useRooms";
import { useAuth } from "@/contexts/AuthContext";
import { addRoom, updateRoom, deleteRoom, type RoomFormData } from "@/lib/firestore";
import type { Room } from "@/lib/mockData";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const stageIcon: Record<string, typeof Flower2> = {
  Flowering: Flower2,
  Vegetative: Sprout,
  Propagation: Leaf,
  Flushing: Droplets,
};
const stageColor: Record<string, string> = {
  Flowering: "#FFD166",
  Vegetative: "#5fd47e",
  Propagation: "#8ab894",
  Flushing: "#5fd47e",
};
const stageOptions = [
  { value: "Vegetative", label: "Vegetative" },
  { value: "Flowering", label: "Flowering" },
  { value: "Propagation", label: "Propagation" },
  { value: "Flushing", label: "Flushing" },
];

const defaultTargets: RoomFormData["targets"] = {
  temp: [22, 26],
  humidity: [60, 70],
  ph: [5.8, 6.2],
  ec: [1.4, 1.8],
  co2: [800, 1000],
};

function emptyForm(): RoomFormData {
  return {
    name: "",
    stage: "Vegetative",
    day: 1,
    totalDays: 28,
    targets: { ...defaultTargets },
    lightSchedule: { onHour: 6, offHour: 20 },
    irrigation: { intervalHours: 4, durationMin: 2 },
  };
}

function HomePage() {
  const now = new Date().getHours();
  const { rooms, loading } = useRooms();
  const { user } = useAuth();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomFormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditRoom(null);
    setForm(emptyForm());
    setSheetOpen(true);
  }

  function openEdit(room: Room, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditRoom(room);
    setForm({
      name: room.name,
      stage: room.stage,
      day: room.day,
      totalDays: room.totalDays,
      targets: room.targets,
      lightSchedule: room.lightSchedule ?? { onHour: 6, offHour: 20 },
      irrigation: room.irrigation ?? { intervalHours: 4, durationMin: 2 },
    });
    setSheetOpen(true);
  }

  async function handleDelete(room: Room, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${room.name}"? The simulation will stop.`)) return;
    try {
      await deleteRoom(room.id);
      toast.success(`"${room.name}" deleted`);
    } catch {
      toast.error("Failed to delete room");
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Room name is required");
    if (!user) return;
    setSaving(true);
    try {
      if (editRoom) {
        await updateRoom(editRoom.id, form);
        toast.success("Room updated");
      } else {
        await addRoom(user.uid, form);
        toast.success(`"${form.name}" created — simulation will start shortly`);
      }
      setSheetOpen(false);
    } catch {
      toast.error("Failed to save room");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileShell>
      <AppHeader subtitle="Welcome back" title="Your Grow" showNotifications />

      <section className="px-5">
        <div className="glass rounded-3xl p-4 flex items-center gap-4">
          <GrowyBot size={56} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
              Greenhouse status
            </p>
            {loading ? (
              <p className="text-sm text-ink-dim mt-0.5 animate-pulse">Loading…</p>
            ) : (
              <p className="text-sm text-ink mt-0.5">
                <span className="font-num text-ink">
                  {rooms.filter((r) => r.status === "healthy").length}
                </span>
                <span className="text-ink-dim"> of </span>
                <span className="font-num text-ink">{rooms.length}</span>
                <span className="text-ink-dim"> rooms healthy</span>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
            Rooms
          </h3>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={openAdd}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
          >
            <Plus className="w-3.5 h-3.5 text-[#06120a]" />
          </motion.button>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass rounded-3xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            className="w-full glass rounded-3xl p-8 flex flex-col items-center gap-3 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.12)" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(46,168,74,0.14)" }}
            >
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Add your first room</p>
              <p className="text-xs text-ink-dim mt-1">
                Set it up and the simulation starts automatically
              </p>
            </div>
          </motion.button>
        )}

        <div className="space-y-4">
          {rooms.map((r, i) => {
            const light = r.lightSchedule ?? { onHour: 6, offHour: 22 };
            const lightOn = now >= (light.onHour ?? 6) && now < (light.offHour ?? 22);
            const lightHours = (light.offHour ?? 22) - (light.onHour ?? 6);
            const StageIcon = stageIcon[r.stage] ?? Sprout;
            const color = stageColor[r.stage] ?? "#5fd47e";

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to="/rooms/$roomId" params={{ roomId: r.id }} className="block">
                  <motion.div
                    whileTap={{ scale: 0.985 }}
                    className="glass rounded-3xl overflow-hidden"
                  >
                    <div className="p-3 pb-0">
                      <WaterTank
                        level={r.metrics?.ec ? Math.min(100, r.metrics.ec * 40) : 60}
                        height={90}
                      />
                    </div>
                    <div className="p-4 pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold text-ink leading-tight">{r.name}</p>
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          <span
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${color}18`, color }}
                          >
                            <StageIcon className="w-2.5 h-2.5" />
                            {r.stage}
                          </span>
                          <button
                            onClick={(e) => openEdit(r, e)}
                            className="w-6 h-6 rounded-full glass flex items-center justify-center ml-1"
                          >
                            <Pencil className="w-3 h-3 text-ink-dim" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(r, e)}
                            className="w-6 h-6 rounded-full glass flex items-center justify-center"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>

                      <GrowBar
                        pct={Math.round((r.day / r.totalDays) * 100)}
                        stage={r.stage}
                        day={r.day}
                        totalDays={r.totalDays}
                      />

                      <div className="grid grid-cols-2 gap-1.5 mt-3">
                        <MetricChip
                          icon={Thermometer}
                          label="Temp"
                          value={`${r.metrics?.temp?.toFixed(1) ?? "—"}°C`}
                          inRange={r.metrics?.temp != null && r.metrics.temp >= r.targets.temp[0] && r.metrics.temp <= r.targets.temp[1]}
                        />
                        <MetricChip
                          icon={Droplets}
                          label="Humidity"
                          value={`${r.metrics?.humidity ?? "—"}%`}
                          inRange={r.metrics?.humidity != null && r.metrics.humidity >= r.targets.humidity[0] && r.metrics.humidity <= r.targets.humidity[1]}
                        />
                        <MetricChip
                          icon={FlaskConical}
                          label="pH"
                          value={`${r.metrics?.ph ?? "—"}`}
                          color="#FFD166"
                          inRange={r.metrics?.ph != null && r.metrics.ph >= r.targets.ph[0] && r.metrics.ph <= r.targets.ph[1]}
                        />
                        <MetricChip
                          icon={Zap}
                          label="EC"
                          value={`${r.metrics?.ec?.toFixed(2) ?? "—"} mS`}
                          inRange={r.metrics?.ec != null && r.metrics.ec >= r.targets.ec[0] && r.metrics.ec <= r.targets.ec[1]}
                        />
                      </div>

                      <div
                        className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <Sun
                          className="w-3 h-3 flex-shrink-0"
                          style={{ color: lightOn ? "#FFD166" : "#6a9778" }}
                        />
                        <span className="text-[10px] text-ink-dim">Lights</span>
                        <span
                          className="text-[10px] font-semibold ml-auto"
                          style={{ color: lightOn ? "#FFD166" : "#6a9778" }}
                        >
                          {lightOn ? "On" : "Off"} · {lightHours}h / day
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Add / Edit room sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editRoom ? `Edit ${editRoom.name}` : "New Room"}
      >
        <div className="space-y-4">
          <Field label="Room Name">
            <Input
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="e.g. Veg Room A"
            />
          </Field>

          <Field label="Stage">
            <Select
              value={form.stage}
              onChange={(v) => setForm({ ...form, stage: v })}
              options={stageOptions}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Current Day">
              <Input
                type="number"
                value={form.day}
                onChange={(v) => setForm({ ...form, day: Number(v) })}
              />
            </Field>
            <Field label="Total Days">
              <Input
                type="number"
                value={form.totalDays}
                onChange={(v) => setForm({ ...form, totalDays: Number(v) })}
              />
            </Field>
          </div>

          <Field label="Light Schedule">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-ink-dim mb-1">Lights On</p>
                <Input
                  type="number"
                  value={form.lightSchedule?.onHour ?? 6}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      lightSchedule: { ...form.lightSchedule!, onHour: Number(v) },
                    })
                  }
                />
              </div>
              <div>
                <p className="text-[10px] text-ink-dim mb-1">Lights Off</p>
                <Input
                  type="number"
                  value={form.lightSchedule?.offHour ?? 20}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      lightSchedule: { ...form.lightSchedule!, offHour: Number(v) },
                    })
                  }
                />
              </div>
            </div>
          </Field>

          <Field label="Targets">
            <div
              className="rounded-xl p-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <RangeRow
                label="Temp °C"
                value={form.targets.temp}
                onChange={(v) => setForm({ ...form, targets: { ...form.targets, temp: v } })}
                step={0.5}
              />
              <RangeRow
                label="Humidity %"
                value={form.targets.humidity}
                onChange={(v) => setForm({ ...form, targets: { ...form.targets, humidity: v } })}
                step={1}
              />
              <RangeRow
                label="pH"
                value={form.targets.ph}
                onChange={(v) => setForm({ ...form, targets: { ...form.targets, ph: v } })}
                step={0.1}
              />
              <RangeRow
                label="EC mS"
                value={form.targets.ec}
                onChange={(v) => setForm({ ...form, targets: { ...form.targets, ec: v } })}
                step={0.1}
              />
              <RangeRow
                label="CO₂ ppm"
                value={form.targets.co2}
                onChange={(v) => setForm({ ...form, targets: { ...form.targets, co2: v } })}
                step={50}
                unit="ppm"
              />
            </div>
          </Field>

          <SheetButton onClick={handleSave} loading={saving}>
            {editRoom ? "Save Changes" : "Create Room"}
          </SheetButton>
        </div>
      </Sheet>
    </MobileShell>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
  color = "#5fd47e",
  inRange = true,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
  inRange?: boolean;
}) {
  const bg = inRange ? "rgba(255,255,255,0.04)" : "rgba(255,209,102,0.10)";
  const border = inRange ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(255,209,102,0.20)";
  const iconColor = inRange ? color : "#FFD166";
  const valColor = inRange ? undefined : "#FFD166";
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
      style={{ background: bg, border }}
    >
      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: iconColor }} />
      <span className="text-[10px] text-ink-dim">{label}</span>
      <span className="font-num text-[11px] ml-auto" style={{ color: valColor ?? "#e8f5ec" }}>{value}</span>
    </div>
  );
}
