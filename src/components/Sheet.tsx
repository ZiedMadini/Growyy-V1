import { Drawer } from "vaul";
import { X } from "lucide-react";

type SheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  children: React.ReactNode;
};

export function Sheet({ open, onOpenChange, title, children }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        />
        <Drawer.Content
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-50 outline-none"
          style={{
            background: "rgba(14,28,18,0.97)",
            borderRadius: "24px 24px 0 0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* drag handle */}
          <div className="mx-auto mt-3 mb-1 w-10 h-1 rounded-full bg-white/20" />

          {title && (
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <p className="text-base font-semibold text-ink">{title}</p>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-ink-dim"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="px-5 pb-10 pt-3 max-h-[82vh] overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Reusable form field
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
        {label}
      </label>
      {children}
    </div>
  );
}

// Text input with Growy style
export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div
      className="glass rounded-xl flex items-center px-3 py-2.5"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-soft outline-none"
      />
    </div>
  );
}

// Select
export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div
      className="glass rounded-xl px-3 py-2.5"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-ink outline-none"
        style={{ WebkitAppearance: "none" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#0e1c12" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Range row: min + max steppers
export function RangeRow({
  label,
  value,
  onChange,
  step = 0.1,
  unit = "",
}: {
  label: string;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  step?: number;
  unit?: string;
}) {
  const fmt = (n: number) => parseFloat(n.toFixed(2));
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-ink-dim w-20">{label}</span>
      <div className="flex items-center gap-2 text-xs font-num text-ink">
        <Nudge value={value[0]} onChange={(v) => onChange([fmt(v), value[1]])} step={step} />
        <span className="text-ink-dim">–</span>
        <Nudge value={value[1]} onChange={(v) => onChange([value[0], fmt(v)])} step={step} />
        <span className="text-ink-soft">{unit}</span>
      </div>
    </div>
  );
}

function Nudge({
  value,
  onChange,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(value - step)}
        className="w-6 h-6 rounded-full glass text-ink-dim flex items-center justify-center text-sm"
      >
        −
      </button>
      <span className="w-10 text-center font-semibold">{value}</span>
      <button
        onClick={() => onChange(value + step)}
        className="w-6 h-6 rounded-full glass text-ink-dim flex items-center justify-center text-sm"
      >
        +
      </button>
    </div>
  );
}

// Primary action button
export function SheetButton({
  onClick,
  loading,
  children,
  destructive,
}: {
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
      style={{
        background: loading
          ? "rgba(255,255,255,0.06)"
          : destructive
            ? "rgba(255,107,107,0.18)"
            : "linear-gradient(135deg, #2EA84A, #5fd47e)",
        color: loading ? "#6a9778" : destructive ? "#FF6B6B" : "#06120a",
        border: destructive ? "1px solid rgba(255,107,107,0.3)" : undefined,
      }}
    >
      {loading ? "Saving…" : children}
    </button>
  );
}
