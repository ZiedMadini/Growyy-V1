import { useEffect, useState } from "react";
import { getDbAsync } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export type DosingLogEntry = {
  id: string;
  userId: string;
  roomId: string;
  roomName: string;
  recipeId: string;
  recipeName: string;
  doses: { tankId: string; tankName: string; ml: number }[];
  timestamp: { toDate: () => Date } | null;
};

export function useDosingLog(maxEntries = 30) {
  const { user } = useAuth();
  const [log, setLog] = useState<DosingLogEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setLog([]);
      return;
    }
    let unsub: (() => void) | undefined;
    getDbAsync().then(async (db) => {
      const { collection, onSnapshot, query, where, orderBy, limit } =
        await import("firebase/firestore");
      const q = query(
        collection(db, "dosingLog"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(maxEntries),
      );
      unsub = onSnapshot(q, (snap) => {
        setLog(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DosingLogEntry, "id">) })));
      });
    });
    return () => unsub?.();
  }, [user, maxEntries]);

  return log;
}
