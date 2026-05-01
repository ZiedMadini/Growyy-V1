export const sensorData = {
  temperature: { value: 24.5, unit: "°C", status: "optimal", min: 18, max: 30 },
  humidity: { value: 68, unit: "%", status: "optimal", min: 40, max: 80 },
  soilMoisture: { value: 42, unit: "%", status: "warning", min: 35, max: 70 },
  light: { value: 820, unit: "lux", status: "optimal", min: 400, max: 1200 },
  co2: { value: 410, unit: "ppm", status: "optimal", min: 350, max: 800 },
  ph: { value: 6.4, unit: "pH", status: "optimal", min: 5.5, max: 7 },
};

export const aiInsights = [
  {
    id: 1,
    title: "Increase irrigation by 12%",
    desc: "Soil moisture in Zone B trending below threshold over next 6h.",
    type: "action",
    priority: "high",
    zone: "Zone B",
  },
  {
    id: 2,
    title: "Powdery mildew risk detected",
    desc: "Humidity + low airflow patterns match early disease signature.",
    type: "warning",
    priority: "high",
    zone: "Zone A",
  },
  {
    id: 3,
    title: "Optimal harvest window in 4 days",
    desc: "Tomato batch #12 reaching peak ripeness based on growth model.",
    type: "info",
    priority: "medium",
    zone: "Zone C",
  },
  {
    id: 4,
    title: "Reduce LED intensity 20:00 – 06:00",
    desc: "Energy savings ~14% with no impact on photosynthesis.",
    type: "action",
    priority: "low",
    zone: "All zones",
  },
];

export const devices = [
  { id: "d1", name: "Drip Irrigation", zone: "Zone A", type: "irrigation", on: true, auto: true, level: 65 },
  { id: "d2", name: "Climate Controller", zone: "Zone A", type: "climate", on: true, auto: true, level: 72 },
  { id: "d3", name: "Grow Lights", zone: "Zone B", type: "light", on: true, auto: false, level: 80 },
  { id: "d4", name: "Ventilation Fan", zone: "Zone B", type: "fan", on: false, auto: true, level: 0 },
  { id: "d5", name: "Soil Sensor Array", zone: "Zone C", type: "sensor", on: true, auto: true, level: 100 },
  { id: "d6", name: "Nutrient Doser", zone: "Zone C", type: "irrigation", on: true, auto: true, level: 45 },
];

export const crops = [
  { id: "c1", name: "Cherry Tomatoes", zone: "Zone A", stage: "Flowering", progress: 62, health: "excellent", days: 38 },
  { id: "c2", name: "Butter Lettuce", zone: "Zone B", stage: "Vegetative", progress: 45, health: "good", days: 21 },
  { id: "c3", name: "Bell Peppers", zone: "Zone C", stage: "Fruiting", progress: 78, health: "warning", days: 54 },
  { id: "c4", name: "Fresh Basil", zone: "Zone B", stage: "Mature", progress: 92, health: "excellent", days: 28 },
];

export const alerts = [
  { id: "a1", title: "Temperature spike", desc: "Zone A reached 31°C", time: "2 min ago", severity: "critical" },
  { id: "a2", title: "Low soil moisture", desc: "Zone B at 32% (threshold 35%)", time: "18 min ago", severity: "warning" },
  { id: "a3", title: "AI: Disease risk", desc: "Powdery mildew probability 74%", time: "1 hr ago", severity: "warning" },
  { id: "a4", title: "Irrigation completed", desc: "Zone C cycle finished", time: "3 hr ago", severity: "info" },
  { id: "a5", title: "Sensor reconnected", desc: "Soil sensor #4 back online", time: "Yesterday", severity: "info" },
];
