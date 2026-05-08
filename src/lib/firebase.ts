// Firebase is browser-only. All access must go through these async getters
// so it never gets pulled into TanStack Start's SSR module graph.

const firebaseConfig = {
  apiKey: "AIzaSyAhaZMN2Wx98k3ee9oyPFWbLs_VGmZFwQ8",
  authDomain: "growy-5a9b8.firebaseapp.com",
  projectId: "growy-5a9b8",
  storageBucket: "growy-5a9b8.firebasestorage.app",
  messagingSenderId: "115841280290",
  appId: "1:115841280290:web:bfecc6defca80537015d7b",
};

let _app: import("firebase/app").FirebaseApp | undefined;
let _auth: import("firebase/auth").Auth | undefined;
let _db: import("firebase/firestore").Firestore | undefined;

async function ensureApp() {
  if (_app) return _app;
  const { initializeApp, getApps } = await import("firebase/app");
  _app = getApps()[0] ?? initializeApp(firebaseConfig);
  return _app;
}

export async function getAuthAsync() {
  if (_auth) return _auth;
  const [app, { getAuth }] = await Promise.all([ensureApp(), import("firebase/auth")]);
  _auth = getAuth(app);
  return _auth;
}

export async function getDbAsync() {
  if (_db) return _db;
  const [app, { getFirestore }] = await Promise.all([ensureApp(), import("firebase/firestore")]);
  _db = getFirestore(app);
  return _db;
}

// Sync getters for hooks that call after init (safe because useEffect runs browser-only)
export function getAuthSync(): import("firebase/auth").Auth {
  if (!_auth) throw new Error("Firebase Auth not initialized — call getAuthAsync() first");
  return _auth;
}
export function getDbSync(): import("firebase/firestore").Firestore {
  if (!_db) throw new Error("Firestore not initialized — call getDbAsync() first");
  return _db;
}

let _messaging: import("firebase/messaging").Messaging | undefined;

export async function getMessagingAsync() {
  if (_messaging) return _messaging;
  const [app, { getMessaging, isSupported }] = await Promise.all([
    ensureApp(),
    import("firebase/messaging"),
  ]);
  if (!(await isSupported())) return null;
  _messaging = getMessaging(app);
  return _messaging;
}

// VAPID key — generate at Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
export const VAPID_KEY =
  "BI25-WIK_kdYXhsN8P7-D8ru7OXo__lYtoenhAY34p5wYWGAP_PYqt2gZh-D7ihTMRgJYsWhOmBK5ydky9-JUK0";
