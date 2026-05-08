import { useEffect, useState } from "react";
import { getDbAsync } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Room } from "@/lib/mockData";

export function useRooms(): { rooms: Room[]; loading: boolean } {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    getDbAsync().then(async (db) => {
      const { collection, onSnapshot, query, where } = await import("firebase/firestore");
      const q = query(collection(db, "rooms"), where("userId", "==", user.uid));
      unsub = onSnapshot(q, (snap) => {
        setRooms(
          snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              name: d.name,
              stage: d.stage,
              day: d.day,
              totalDays: d.totalDays,
              status: d.status,
              metrics: d.currentMetrics ?? d.metrics ?? {},
              targets: d.targets ?? {},
              lightSchedule: d.lightSchedule,
              simulationConfig: d.simulationConfig,
            } as Room;
          }),
        );
        setLoading(false);
      });
    });
    return () => unsub?.();
  }, [user]);

  return { rooms, loading };
}

export function useRoom(roomId: string): { room: Room | null; loading: boolean } {
  const { rooms, loading } = useRooms();
  return { room: rooms.find((r) => r.id === roomId) ?? null, loading };
}
