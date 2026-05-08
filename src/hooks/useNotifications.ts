import { useEffect, useState } from "react";
import { getDbAsync } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export type Notification = {
  id: string;
  userId: string;
  roomId: string;
  title: string;
  severity: "info" | "warning" | "critical";
  read: boolean;
  timestamp: { toDate: () => Date } | null;
};

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    getDbAsync().then(async (db) => {
      const { collection, onSnapshot, query, where, orderBy } = await import("firebase/firestore");
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
      );
      unsub = onSnapshot(q, (snap) => {
        setNotifications(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notification, "id">) })),
        );
        setLoading(false);
      });
    });
    return () => unsub?.();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, loading, unreadCount };
}
