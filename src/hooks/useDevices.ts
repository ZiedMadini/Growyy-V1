import { useEffect, useState } from "react";
import { getDbAsync } from "@/lib/firebase";

export type Device = {
  id: string;
  name: string;
  type: string;
  online: boolean;
  status: "on" | "off";
  battery: number | null;
  settings: Record<string, unknown>;
};

export function useDevices(roomId: string | undefined): { devices: Device[]; loading: boolean } {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setDevices([]);
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    getDbAsync().then(async (db) => {
      const { collection, onSnapshot } = await import("firebase/firestore");
      unsub = onSnapshot(collection(db, "rooms", roomId, "devices"), (snap) => {
        setDevices(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Device, "id">) })));
        setLoading(false);
      });
    });
    return () => unsub?.();
  }, [roomId]);

  return { devices, loading };
}
