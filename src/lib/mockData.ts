export type RoomStatus = "healthy" | "warning" | "critical";

export type Room = {
  id: string;
  name: string;
  stage: string;
  day: number;
  totalDays: number;
  status: RoomStatus;
  metrics: {
    temp: number;
    humidity: number;
    ph: number;
    ec: number;
    co2: number;
    vpd: number;
  };
  targets: {
    temp: [number, number];
    humidity: [number, number];
    ph: [number, number];
    ec: [number, number];
    co2: [number, number];
  };
};

export const rooms: Room[] = [
  {
    id: "r1",
    name: "Veg Room A",
    stage: "Vegetative",
    day: 18,
    totalDays: 28,
    status: "healthy",
    metrics: { temp: 24.2, humidity: 65, ph: 5.9, ec: 1.6, co2: 820, vpd: 1.0 },
    targets: { temp: [22, 26], humidity: [60, 70], ph: [5.8, 6.2], ec: [1.4, 1.8], co2: [800, 1000] },
  },
  {
    id: "r2",
    name: "Flower Room 1",
    stage: "Flowering",
    day: 32,
    totalDays: 56,
    status: "warning",
    metrics: { temp: 26.8, humidity: 58, ph: 6.4, ec: 2.1, co2: 950, vpd: 1.4 },
    targets: { temp: [22, 26], humidity: [50, 60], ph: [5.8, 6.2], ec: [1.8, 2.2], co2: [900, 1200] },
  },
  {
    id: "r3",
    name: "Clone Tent",
    stage: "Propagation",
    day: 6,
    totalDays: 14,
    status: "healthy",
    metrics: { temp: 23.5, humidity: 78, ph: 5.8, ec: 0.8, co2: 600, vpd: 0.7 },
    targets: { temp: [22, 25], humidity: [70, 80], ph: [5.6, 6.0], ec: [0.6, 1.0], co2: [600, 800] },
  },
  {
    id: "r4",
    name: "Flower Room 2",
    stage: "Flowering",
    day: 48,
    totalDays: 56,
    status: "critical",
    metrics: { temp: 28.4, humidity: 45, ph: 6.7, ec: 2.6, co2: 720, vpd: 1.9 },
    targets: { temp: [22, 26], humidity: [50, 60], ph: [5.8, 6.2], ec: [1.8, 2.2], co2: [900, 1200] },
  },
];

export const tanks = [
  { id: "t1", name: "Solution A", type: "nutrient", level: 78, volume: 39, capacity: 50, color: "primary" },
  { id: "t2", name: "Solution B", type: "nutrient", level: 72, volume: 36, capacity: 50, color: "primary" },
  { id: "t3", name: "pH Down", type: "ph", level: 34, volume: 6.8, capacity: 20, color: "warning" },
  { id: "t4", name: "pH Up", type: "ph", level: 56, volume: 11.2, capacity: 20, color: "primary" },
  { id: "t5", name: "Cal-Mag", type: "additive", level: 18, volume: 3.6, capacity: 20, color: "destructive" },
  { id: "t6", name: "Bloom Boost", type: "additive", level: 88, volume: 17.6, capacity: 20, color: "primary" },
];

export const recipes = [
  { id: "rc1", name: "Veg Week 2", stage: "Vegetative", week: 2, room: "Veg Room A", doses: [
    { nutrient: "Solution A", ml: 2.0 }, { nutrient: "Solution B", ml: 2.0 }, { nutrient: "Cal-Mag", ml: 1.0 },
  ]},
  { id: "rc2", name: "Bloom Week 5", stage: "Flowering", week: 5, room: "Flower Room 1", doses: [
    { nutrient: "Solution A", ml: 3.5 }, { nutrient: "Solution B", ml: 3.5 }, { nutrient: "Bloom Boost", ml: 2.0 }, { nutrient: "Cal-Mag", ml: 0.5 },
  ]},
  { id: "rc3", name: "Flush Final", stage: "Flushing", week: 8, room: "Flower Room 2", doses: [
    { nutrient: "pH Down", ml: 0.3 },
  ]},
  { id: "rc4", name: "Clone Mild", stage: "Propagation", week: 1, room: "Clone Tent", doses: [
    { nutrient: "Solution A", ml: 0.8 }, { nutrient: "Cal-Mag", ml: 0.4 },
  ]},
];

export const dosingLog = [
  { id: "d1", time: "10:42", date: "Today", room: "Flower Room 1", recipe: "Bloom Week 5", doses: "A 35ml • B 35ml • Bloom 20ml" },
  { id: "d2", time: "09:15", date: "Today", room: "Veg Room A", recipe: "Veg Week 2", doses: "A 20ml • B 20ml • Cal-Mag 10ml" },
  { id: "d3", time: "07:00", date: "Today", room: "Clone Tent", recipe: "Clone Mild", doses: "A 8ml • Cal-Mag 4ml" },
  { id: "d4", time: "22:18", date: "Yesterday", room: "Flower Room 1", recipe: "Bloom Week 5", doses: "A 35ml • B 35ml" },
  { id: "d5", time: "16:30", date: "Yesterday", room: "Flower Room 2", recipe: "Flush Final", doses: "pH Down 3ml" },
  { id: "d6", time: "10:00", date: "Yesterday", room: "Veg Room A", recipe: "Veg Week 2", doses: "A 20ml • B 20ml • Cal-Mag 10ml" },
];

export const lightingCurve = [
  { h: 0, v: 0 }, { h: 4, v: 0 }, { h: 6, v: 20 }, { h: 8, v: 60 },
  { h: 10, v: 90 }, { h: 12, v: 100 }, { h: 14, v: 100 }, { h: 16, v: 95 },
  { h: 18, v: 80 }, { h: 20, v: 40 }, { h: 22, v: 10 }, { h: 24, v: 0 },
];

export const history7d = {
  temp: [23.8, 24.1, 24.5, 25.0, 24.7, 24.3, 24.2],
  humidity: [62, 64, 65, 67, 66, 65, 65],
  ph: [5.9, 6.0, 5.95, 6.1, 6.0, 5.95, 5.9],
  ec: [1.5, 1.55, 1.6, 1.62, 1.58, 1.6, 1.6],
};

export const devicesMock = [
  { id: "dv1", name: "Climate Sensor #1", type: "Air", room: "Veg Room A", online: true, battery: 92 },
  { id: "dv2", name: "pH/EC Probe", type: "Water", room: "Veg Room A", online: true, battery: 78 },
  { id: "dv3", name: "CO₂ Monitor", type: "Air", room: "Veg Room A", online: true, battery: 88 },
  { id: "dv4", name: "Dosing Pump A", type: "Actuator", room: "Veg Room A", online: true, battery: 100 },
  { id: "dv5", name: "Leaf Camera", type: "Camera", room: "Veg Room A", online: false, battery: 12 },
];

export const recentEvents = [
  { id: "e1", time: "10:42", type: "dose", text: "Dosed 35ml Solution A • 35ml B" },
  { id: "e2", time: "10:30", type: "irrigation", text: "Irrigation cycle completed (3 min)" },
  { id: "e3", time: "09:15", type: "alert", text: "EC drifted to 2.3 — corrected" },
  { id: "e4", time: "08:00", type: "light", text: "Lights ramped to 100%" },
  { id: "e5", time: "07:00", type: "irrigation", text: "Morning irrigation cycle" },
];

export const notifications = [
  { id: "n1", title: "Tank Cal-Mag below 20%", room: "Flower Room 2", time: "2 min ago", severity: "critical", roomId: "r4" },
  { id: "n2", title: "EC out of range", room: "Flower Room 2", time: "12 min ago", severity: "critical", roomId: "r4" },
  { id: "n3", title: "pH drift detected", room: "Flower Room 1", time: "1 hr ago", severity: "warning", roomId: "r2" },
  { id: "n4", title: "Tank pH Down at 34%", room: "Shared", time: "2 hr ago", severity: "warning", roomId: "r1" },
  { id: "n5", title: "Dosing completed", room: "Veg Room A", time: "3 hr ago", severity: "info", roomId: "r1" },
  { id: "n6", title: "Leaf camera offline", room: "Veg Room A", time: "Yesterday", severity: "warning", roomId: "r1" },
];

export const chatHistory = [
  { id: "c1", role: "user" as const, text: "Why is EC dropping in Flower Room 1?" },
  { id: "c2", role: "ai" as const, text: "EC dropped from 2.1 to 1.85 over the last 6h. Likely cause: plants are uptaking nutrients faster than expected at week 5 of flowering. Recommendation: increase Solution A & B dose by ~15% in your next cycle (currently 35ml → 40ml)." },
];

export const solutions = [
  { id: "s1", title: "pH is drifting upward", desc: "Add 0.5ml pH Down per liter to bring back to 6.0", severity: "warning" },
  { id: "s2", title: "VPD slightly high", desc: "Increase humidity by 5% to reach optimal 1.2 kPa", severity: "warning" },
];
