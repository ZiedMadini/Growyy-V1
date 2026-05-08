import { getDbAsync } from "./firebase";

async function db() {
  return getDbAsync();
}
async function ff() {
  return import("firebase/firestore");
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export type RoomFormData = {
  name: string;
  stage: string;
  day: number;
  totalDays: number;
  targets: {
    temp: [number, number];
    humidity: [number, number];
    ph: [number, number];
    ec: [number, number];
    co2: [number, number];
  };
  lightSchedule?: { onHour: number; offHour: number };
  irrigation?: { intervalHours: number; durationMin: number };
};

export async function addRoom(userId: string, data: RoomFormData) {
  const [d, { addDoc, collection, serverTimestamp }] = await Promise.all([db(), ff()]);
  return addDoc(collection(d, "rooms"), {
    userId,
    ...data,
    status: "healthy",
    currentMetrics: { temp: 24.0, humidity: 65.0, ph: 6.0, ec: 1.6, co2: 800.0, vpd: 1.0 },
    lightSchedule: data.lightSchedule ?? { onHour: 6, offHour: 20, curve: [] },
    irrigation: data.irrigation ?? { intervalHours: 4, durationMin: 2 },
    simulationConfig: { baseTemp: 24.0, baseHumidity: 65.0, phDriftRate: 0.01, ecDecayRate: 0.005 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRoom(roomId: string, data: Partial<RoomFormData>) {
  const [d, { updateDoc, doc, serverTimestamp }] = await Promise.all([db(), ff()]);
  return updateDoc(doc(d, "rooms", roomId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteRoom(roomId: string) {
  const [d, { deleteDoc, doc }] = await Promise.all([db(), ff()]);
  return deleteDoc(doc(d, "rooms", roomId));
}

// ─── Tanks ────────────────────────────────────────────────────────────────────

export type TankFormData = {
  name: string;
  type: "nutrient" | "ph" | "additive";
  level: number;
  volume: number;
  capacity: number;
  color: string;
  solutionName?: string;
};

export async function addTank(userId: string, data: TankFormData) {
  const [d, { addDoc, collection, serverTimestamp }] = await Promise.all([db(), ff()]);
  return addDoc(collection(d, "tanks"), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTank(tankId: string, data: Partial<TankFormData>) {
  const [d, { updateDoc, doc, serverTimestamp }] = await Promise.all([db(), ff()]);
  return updateDoc(doc(d, "tanks", tankId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTank(tankId: string) {
  const [d, { deleteDoc, doc }] = await Promise.all([db(), ff()]);
  return deleteDoc(doc(d, "tanks", tankId));
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export type DeviceFormData = {
  name: string;
  type: "pump" | "light" | "fan" | "heater" | "cooler" | "camera";
  online: boolean;
  status: "on" | "off";
  battery: number | null;
};

export async function addDevice(roomId: string, data: DeviceFormData) {
  const [d, { addDoc, collection, serverTimestamp }] = await Promise.all([db(), ff()]);
  return addDoc(collection(d, "rooms", roomId, "devices"), {
    ...data,
    settings: {},
    createdAt: serverTimestamp(),
  });
}

export async function updateDevice(
  roomId: string,
  deviceId: string,
  data: Partial<DeviceFormData>,
) {
  const [d, { updateDoc, doc }] = await Promise.all([db(), ff()]);
  return updateDoc(doc(d, "rooms", roomId, "devices", deviceId), data);
}

export async function deleteDevice(roomId: string, deviceId: string) {
  const [d, { deleteDoc, doc }] = await Promise.all([db(), ff()]);
  return deleteDoc(doc(d, "rooms", roomId, "devices", deviceId));
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export type RecipeFormData = {
  name: string;
  stage: string;
  week: number;
  roomId: string | null;
  doses: { tankId: string; tankName: string; ml: number }[];
};

export async function addRecipe(userId: string, data: RecipeFormData) {
  const [d, { addDoc, collection, serverTimestamp }] = await Promise.all([db(), ff()]);
  return addDoc(collection(d, "recipes"), { userId, ...data, createdAt: serverTimestamp() });
}

export async function updateRecipe(recipeId: string, data: Partial<RecipeFormData>) {
  const [d, { updateDoc, doc }] = await Promise.all([db(), ff()]);
  return updateDoc(doc(d, "recipes", recipeId), data);
}

export async function deleteRecipe(recipeId: string) {
  const [d, { deleteDoc, doc }] = await Promise.all([db(), ff()]);
  return deleteDoc(doc(d, "recipes", recipeId));
}

// ─── Dosing log ───────────────────────────────────────────────────────────────

export async function logDosing(
  userId: string,
  roomId: string,
  roomName: string,
  doses: { tankId: string; tankName: string; ml: number }[],
) {
  const [d, { addDoc, collection, serverTimestamp }] = await Promise.all([db(), ff()]);
  return addDoc(collection(d, "dosingLog"), {
    userId,
    roomId,
    roomName,
    recipeId: "manual",
    recipeName: "Manual dose",
    doses,
    timestamp: serverTimestamp(),
  });
}

// ─── Setpoints ────────────────────────────────────────────────────────────────

export async function saveSetpoints(
  roomId: string,
  setpoints: {
    targets?: Record<string, [number, number]>;
    lightSchedule?: { onHour: number; offHour: number };
    irrigation?: { intervalHours: number; durationMin: number };
  },
) {
  const [d, { updateDoc, doc, serverTimestamp }] = await Promise.all([db(), ff()]);
  return updateDoc(doc(d, "rooms", roomId), { ...setpoints, updatedAt: serverTimestamp() });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function markNotificationRead(notifId: string) {
  const [d, { updateDoc, doc }] = await Promise.all([db(), ff()]);
  return updateDoc(doc(d, "notifications", notifId), { read: true });
}

export async function markAllNotificationsRead(notifIds: string[]) {
  return Promise.all(notifIds.map(markNotificationRead));
}
