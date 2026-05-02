import type { RoomStatus } from "@/lib/mockData";

const staticColor: Record<RoomStatus, string> = {
  healthy: "#2EA84A",
  warning: "#FFD166",
  critical: "#FF6B6B",
};

export function StatusDot({
  status,
  size = 10,
  static: isStatic = false,
}: {
  status: RoomStatus;
  size?: number;
  static?: boolean;
}) {
  if (isStatic) {
    return (
      <span
        className="inline-block rounded-full"
        style={{ width: size, height: size, background: staticColor[status] }}
        aria-label={status}
      />
    );
  }

  const cls =
    status === "critical" ? "dot-critical" : status === "warning" ? "dot-warning" : "dot-healthy";
  return (
    <span
      className={`inline-block rounded-full ${cls}`}
      style={{ width: size, height: size }}
      aria-label={status}
    />
  );
}
