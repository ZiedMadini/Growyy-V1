import { useEffect, useState } from "react";
import { getDbAsync } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export type Recipe = {
  id: string;
  name: string;
  stage: string;
  week: number;
  roomId: string | null;
  doses: { tankId: string; tankName: string; ml: number }[];
};

export function useRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    getDbAsync().then(async (db) => {
      const { collection, onSnapshot, query, where } = await import("firebase/firestore");
      const q = query(collection(db, "recipes"), where("userId", "==", user.uid));
      unsub = onSnapshot(q, (snap) => {
        setRecipes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Recipe, "id">) })));
        setLoading(false);
      });
    });
    return () => unsub?.();
  }, [user]);

  return { recipes, loading };
}
