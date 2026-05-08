import { useEffect, useState } from "react";
import { getDbAsync } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export type Tank = {
  id: string;
  name: string;
  type: string;
  level: number;
  volume: number;
  capacity: number;
  color: string;
  solutionName?: string;
};

export function useTanks(): { tanks: Tank[]; loading: boolean } {
  const { user } = useAuth();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTanks([]);
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    getDbAsync().then(async (db) => {
      const { collection, onSnapshot, query, where } = await import("firebase/firestore");
      const q = query(collection(db, "tanks"), where("userId", "==", user.uid));
      unsub = onSnapshot(q, (snap) => {
        setTanks(
          snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              name: d.name,
              type: d.type,
              level: d.level,
              volume: d.volume,
              capacity: d.capacity,
              color: d.color ?? "primary",
              solutionName: d.solutionName,
            };
          }),
        );
        setLoading(false);
      });
    });
    return () => unsub?.();
  }, [user]);

  return { tanks, loading };
}
