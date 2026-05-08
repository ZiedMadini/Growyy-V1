import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { AppHeader } from "@/components/AppHeader";
import { WaterTank } from "@/components/WaterTank";
import { Sheet, Field, Input, Select, SheetButton } from "@/components/Sheet";
import { useTanks, type Tank } from "@/hooks/useTanks";
import { useRooms } from "@/hooks/useRooms";
import { useRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/contexts/AuthContext";
import {
  addTank,
  updateTank,
  deleteTank,
  addRecipe,
  deleteRecipe,
  type TankFormData,
} from "@/lib/firestore";
import { useDosingLog } from "@/hooks/useDosingLog";
import {
  FlaskConical,
  Clock,
  Plus,
  Beaker,
  ChevronRight,
  DropletIcon,
  CheckCircle2,
  Edit3,
} from "lucide-react";

export const Route = createFileRoute("/nutrients")({
  component: NutrientsPage,
});

const tabs = ["Formulas", "Dosing Log"] as const;

function NutrientsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Formulas");
  return (
    <MobileShell bgVariant="pipes">
      <AppHeader subtitle="Solution Management" title="Solutions" />

      <div className="px-5 mb-4">
        <div className="glass rounded-full p-1 flex relative">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-full text-xs font-semibold relative z-10 transition-colors"
                style={{ color: active ? "#06120a" : "#8ab894" }}
              >
                {active && (
                  <motion.span
                    layoutId="nut-tab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: "linear-gradient(135deg, #2EA84A, #5fd47e)" }}
                  />
                )}
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {tab === "Formulas" && <FormulasView />}
        {tab === "Dosing Log" && <LogView />}
      </div>
    </MobileShell>
  );
}

/* ─── Tank Sheet ─── */
const tankTypeOptions = [
  { value: "nutrient", label: "Nutrient" },
  { value: "ph", label: "pH" },
  { value: "additive", label: "Additive" },
];
const tankColorOptions = [
  { value: "primary", label: "Green (Primary)" },
  { value: "warning", label: "Yellow (Warning)" },
  { value: "destructive", label: "Red (Low)" },
];

function TankSheet({
  open,
  onClose,
  tank,
}: {
  open: boolean;
  onClose: () => void;
  tank: Tank | null;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<TankFormData>({
    name: tank?.name ?? "",
    type: (tank?.type as TankFormData["type"]) ?? "nutrient",
    level: tank?.level ?? 100,
    volume: tank?.volume ?? 20,
    capacity: tank?.capacity ?? 20,
    color: tank?.color ?? "primary",
    solutionName: tank?.solutionName ?? "",
  });
  const [saving, setSaving] = useState(false);

  // sync form when tank changes
  useState(() => {
    if (tank) {
      setForm({
        name: tank.name,
        type: tank.type as TankFormData["type"],
        level: tank.level,
        volume: tank.volume,
        capacity: tank.capacity,
        color: tank.color,
        solutionName: tank.solutionName ?? "",
      });
    }
  });

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Tank name required");
    setSaving(true);
    try {
      if (tank) {
        await updateTank(tank.id, form);
        toast.success("Tank updated");
      } else {
        await addTank(user!.uid, form);
        toast.success(`"${form.name}" added`);
      }
      onClose();
    } catch {
      toast.error("Failed to save tank");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!tank) return;
    if (!confirm(`Delete "${tank.name}"?`)) return;
    try {
      await deleteTank(tank.id);
      toast.success("Tank removed");
      onClose();
    } catch {
      toast.error("Failed to delete tank");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose} title={tank ? `Edit ${tank.name}` : "New Tank"}>
      <div className="space-y-4">
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. Solution A"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v as TankFormData["type"] })}
              options={tankTypeOptions}
            />
          </Field>
          <Field label="Color indicator">
            <Select
              value={form.color}
              onChange={(v) => setForm({ ...form, color: v })}
              options={tankColorOptions}
            />
          </Field>
        </div>
        <Field label="Solution name">
          <Input
            value={form.solutionName ?? ""}
            onChange={(v) => setForm({ ...form, solutionName: v })}
            placeholder="e.g. Canna Aqua Vega"
          />
        </Field>
        <Field label={`Level — ${form.level}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={form.level}
            onChange={(e) => {
              const lvl = Number(e.target.value);
              setForm({
                ...form,
                level: lvl,
                volume: parseFloat(((lvl / 100) * form.capacity).toFixed(1)),
              });
            }}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-ink-dim mt-1">
            <span>0%</span>
            <span className="font-num text-ink">
              {form.volume} / {form.capacity} L
            </span>
            <span>100%</span>
          </div>
        </Field>
        <Field label="Capacity (L)">
          <Input
            type="number"
            value={form.capacity}
            onChange={(v) => setForm({ ...form, capacity: Number(v) })}
          />
        </Field>
        <SheetButton onClick={handleSave} loading={saving}>
          {tank ? "Save Changes" : "Add Tank"}
        </SheetButton>
        {tank && (
          <SheetButton onClick={handleDelete} destructive>
            Remove Tank
          </SheetButton>
        )}
      </div>
    </Sheet>
  );
}

/* ─── Stock strip ─── */
function StockStrip({ onTankTap }: { onTankTap: (t: Tank) => void }) {
  const { tanks } = useTanks();
  return (
    <div className="px-5 mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim mb-2">
        Tank Stock
      </p>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
        {tanks.map((t) => (
          <button
            key={t.id}
            onClick={() => onTankTap(t)}
            className="glass rounded-2xl p-2.5 flex-shrink-0 w-[88px] text-left active:scale-95 transition-transform"
          >
            <p className="text-[9px] font-semibold text-ink truncate mb-1.5">{t.name}</p>
            <WaterTank level={t.level} height={70} showLabel={false} />
            <div className="mt-1.5 text-center">
              <p className="text-[11px] font-num font-semibold text-ink">{t.level}%</p>
              <p className="text-[9px] font-num text-ink-dim">
                {t.volume}/{t.capacity}L
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Formulas tab ─── */
function FormulasView() {
  const { user } = useAuth();
  const { tanks } = useTanks();
  const { recipes, loading } = useRecipes();
  const { rooms } = useRooms();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tankSheetOpen, setTankSheetOpen] = useState(false);
  const [editTank, setEditTank] = useState<Tank | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipeStage, setNewRecipeStage] = useState("Vegetative");
  const [savingRecipe, setSavingRecipe] = useState(false);

  function openAddTank() {
    setEditTank(null);
    setTankSheetOpen(true);
  }

  async function handleDeleteRecipe(id: string, name: string) {
    if (!confirm(`Delete recipe "${name}"?`)) return;
    try {
      await deleteRecipe(id);
      toast.success("Recipe deleted");
    } catch {
      toast.error("Failed to delete recipe");
    }
  }

  async function handleAddRecipe() {
    if (!newRecipeName.trim()) return toast.error("Recipe name required");
    setSavingRecipe(true);
    try {
      await addRecipe(user!.uid, {
        name: newRecipeName,
        stage: newRecipeStage,
        week: 1,
        roomId: null,
        doses: [],
      });
      toast.success(`"${newRecipeName}" created`);
      setRecipeSheetOpen(false);
      setNewRecipeName("");
    } catch {
      toast.error("Failed to create recipe");
    } finally {
      setSavingRecipe(false);
    }
  }

  return (
    <section className="px-5 space-y-3">
      <StockStrip
        onTankTap={(t) => {
          setEditTank(t);
          setTankSheetOpen(true);
        }}
      />

      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setRecipeSheetOpen(true)}
          className="flex-1 glass rounded-2xl p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-primary"
        >
          <Plus className="w-4 h-4" /> New Formula
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openAddTank}
          className="glass rounded-2xl p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-ink-dim"
        >
          <Plus className="w-4 h-4" /> Tank
        </motion.button>
      </div>

      {loading && <div className="glass rounded-2xl h-16 animate-pulse" />}

      {recipes.map((r, i) => {
        const isOpen = expanded === r.id;
        const totalMl = r.doses.reduce((s, d) => s + d.ml, 0);
        const roomName = rooms.find((rm) => rm.id === r.roomId)?.name;
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl overflow-hidden"
          >
            <button
              className="w-full p-4 flex items-center gap-3 text-left"
              onClick={() => setExpanded(isOpen ? null : r.id)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(46,168,74,0.12)" }}
              >
                <Beaker className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{r.name}</p>
                <p className="text-[11px] text-ink-dim mt-0.5">
                  {r.stage} · week {r.week} · <span className="font-num">{totalMl.toFixed(1)}</span>{" "}
                  ml/L
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {roomName && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(46,168,74,0.12)", color: "#5fd47e" }}
                  >
                    {roomName.split(" ")[0]}
                  </span>
                )}
                <ChevronRight
                  className="w-4 h-4 text-ink-dim transition-transform"
                  style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                {r.doses.length === 0 && (
                  <p className="text-xs text-ink-dim text-center py-2">
                    No doses added yet — edit to add
                  </p>
                )}
                {r.doses.map((d, idx) => {
                  const tank = tanks.find((t) => t.id === d.tankId || t.name === d.tankName);
                  const stock = tank?.level ?? 100;
                  const stockOk = stock >= 30;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      {tank ? (
                        <div className="w-9 flex-shrink-0">
                          <WaterTank level={stock} height={36} showLabel={false} />
                        </div>
                      ) : (
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <DropletIcon className="w-4 h-4 text-ink-dim" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink">{d.tankName}</p>
                        {tank && (
                          <p
                            className={`text-[10px] font-num ${stockOk ? "text-ink-dim" : "text-destructive"}`}
                          >
                            {stock}% stock
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-num font-semibold text-primary">{d.ml}</span>
                        <span className="text-[10px] text-ink-dim">ml/L</span>
                        {stockOk ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-destructive/80 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-2 mt-3 pt-2 border-t border-white/5">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteRecipe(r.id, r.name)}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl glass text-destructive flex items-center justify-center gap-1.5"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Tank edit/add sheet */}
      <TankSheet open={tankSheetOpen} onClose={() => setTankSheetOpen(false)} tank={editTank} />

      {/* New recipe sheet */}
      <Sheet open={recipeSheetOpen} onOpenChange={setRecipeSheetOpen} title="New Formula">
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={newRecipeName}
              onChange={setNewRecipeName}
              placeholder="e.g. Bloom Week 5"
            />
          </Field>
          <Field label="Stage">
            <Select
              value={newRecipeStage}
              onChange={setNewRecipeStage}
              options={[
                { value: "Vegetative", label: "Vegetative" },
                { value: "Flowering", label: "Flowering" },
                { value: "Propagation", label: "Propagation" },
                { value: "Flushing", label: "Flushing" },
              ]}
            />
          </Field>
          <SheetButton onClick={handleAddRecipe} loading={savingRecipe}>
            Create Formula
          </SheetButton>
        </div>
      </Sheet>
    </section>
  );
}

/* ─── Dosing Log tab ─── */
function LogView() {
  const { rooms } = useRooms();
  const log = useDosingLog();
  const [filter, setFilter] = useState<string>("All");
  const roomNames = ["All", ...Array.from(new Set(rooms.map((r) => r.name)))];
  const filtered = filter === "All" ? log : log.filter((d) => d.roomName === filter);

  const grouped: Record<string, typeof log> = {};
  filtered.forEach((e) => {
    const dateStr = e.timestamp?.toDate
      ? e.timestamp
          .toDate()
          .toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
      : "Unknown";
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(e);
  });

  return (
    <section className="px-5 space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
        {roomNames.map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              color: filter === r ? "#06120a" : "#8ab894",
              background:
                filter === r
                  ? "linear-gradient(135deg, #2EA84A, #5fd47e)"
                  : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim mb-2">
            {date}
          </p>
          <div className="space-y-2">
            {entries.map((e, i) => {
              const room = rooms.find((r) => r.name === e.roomName);
              const timeStr = e.timestamp?.toDate
                ? e.timestamp
                    .toDate()
                    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl p-3.5 flex items-start gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(46,168,74,0.10)" }}
                  >
                    <FlaskConical className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-ink">{e.recipeName}</p>
                        <p className="text-[10px] text-ink-dim mt-0.5">{e.roomName}</p>
                      </div>
                      <span className="text-[10px] text-ink-dim font-num whitespace-nowrap flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {timeStr}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(Array.isArray(e.doses) ? e.doses : []).map((d, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-num px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(46,168,74,0.10)", color: "#5fd47e" }}
                        >
                          {d.tankName} {d.ml}ml
                        </span>
                      ))}
                    </div>
                    {room && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div
                          className="h-1.5 flex-1 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((room.day / room.totalDays) * 100)}%`,
                              background: "linear-gradient(90deg, #2EA84A, #5fd47e)",
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-num text-ink-dim whitespace-nowrap">
                          day {room.day}/{room.totalDays}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
