import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDbAsync } from "@/lib/firebase";
import { getMessagingAsync, VAPID_KEY } from "@/lib/firebase";

// Registers the browser for FCM push notifications and saves the token to
// Firestore under users/{uid}/fcmTokens so the backend can send pushes.
// Called once from __root.tsx after the user is logged in.
export function useFCMToken() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Only request in a browser context with service worker support
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // Don't request if the key is still the placeholder
    if (VAPID_KEY.includes("REPLACE_ME")) return;

    let cancelled = false;

    (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted" || cancelled) return;

        const messaging = await getMessagingAsync();
        if (!messaging || cancelled) return;

        const { getToken } = await import("firebase/messaging");
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token || cancelled) return;

        const [db, { doc, setDoc, serverTimestamp }] = await Promise.all([
          getDbAsync(),
          import("firebase/firestore"),
        ]);
        await setDoc(
          doc(db, "users", user.uid, "fcmTokens", token.slice(-20)),
          { token, updatedAt: serverTimestamp() },
          { merge: true },
        );
      } catch {
        // FCM not available in all environments — fail silently
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
