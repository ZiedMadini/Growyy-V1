import type { RoomStatus } from "@/lib/mockData";

export function StatusDot({ status, size = 10 }: { status: RoomStatus; size?: number }) {
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
