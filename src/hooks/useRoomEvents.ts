import { useEffect, useState } from "react";
import { getDbAsync } from "@/lib/firebase";

export type RoomEvent = {
  id: string;
  type: "dose" | "irrigation" | "alert" | "light";
  text: string;
  timestamp: { toDate: () => Date } | null;
};

export function useRoomEvents(roomId: string | undefined, count = 10) {
  const [events, setEvents] = useState<RoomEvent[]>([]);

  useEffect(() => {
    if (!roomId) return;
    let unsub: (() => void) | undefined;
    getDbAsync().then(async (db) => {
      const { collection, onSnapshot, query, orderBy, limit } = await import("firebase/firestore");
      const q = query(
        collection(db, "rooms", roomId, "events"),
        orderBy("timestamp", "desc"),
        limit(count),
      );
      unsub = onSnapshot(q, (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RoomEvent, "id">) })));
      });
    });
    return () => unsub?.();
  }, [roomId, count]);

  return events;
}
