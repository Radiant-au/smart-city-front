export type Trend = "up" | "down" | "flat";

export const series = (points: number, base: number, spread: number, seed = 1) => {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: points }, (_, i) => ({
    t: `${String(i * 2).padStart(2, "0")}:00`,
    value: Math.round((base + Math.sin(i / 2.2) * spread + (rand() - 0.5) * spread) * 10) / 10,
  }));
};

export const airSeries = series(12, 62, 18, 7).map((d, i) => ({
  ...d,
  pm25: Math.max(5, Math.round(d.value)),
  pm10: Math.max(8, Math.round(d.value * 1.4 + (i % 3) * 4)),
  no2: Math.max(4, Math.round(d.value * 0.5)),
}));

export const floodSeries = series(12, 2.4, 0.9, 21).map((d) => ({
  t: d.t,
  level: Math.max(0.2, Math.round(d.value * 100) / 100),
  rainfall: Math.max(0, Math.round((d.value * 6 + 4) * 10) / 10),
}));

export const trafficSeries = series(12, 58, 24, 33).map((d) => ({
  t: d.t,
  congestion: Math.min(100, Math.max(8, Math.round(d.value))),
  speed: Math.max(9, Math.round(70 - d.value * 0.6)),
}));

export const energySeries = [
  { name: "Solar", value: 38 },
  { name: "Wind", value: 24 },
  { name: "Grid", value: 27 },
  { name: "Storage", value: 11 },
];

export const districts = [
  { name: "Riverside", aqi: 42, flood: 0.9, traffic: 34, status: "normal" as const },
  { name: "Old Town", aqi: 88, flood: 1.6, traffic: 71, status: "warning" as const },
  { name: "Harbour", aqi: 61, flood: 3.2, traffic: 52, status: "warning" as const },
  { name: "Tech Park", aqi: 35, flood: 0.4, traffic: 28, status: "normal" as const },
  { name: "Industrial", aqi: 134, flood: 1.1, traffic: 63, status: "critical" as const },
  { name: "Northgate", aqi: 47, flood: 0.7, traffic: 41, status: "normal" as const },
];

export const alerts = [
  {
    id: "ALR-4192",
    kind: "Smoke detected",
    zone: "Industrial · Sector 7",
    level: "critical" as const,
    time: "2 min ago",
    detail: "Thermal + particulate spike on sensor cluster IND-07.",
  },
  {
    id: "ALR-4188",
    kind: "Water level rising",
    zone: "Harbour · Dock 3",
    level: "warning" as const,
    time: "18 min ago",
    detail: "River gauge at 3.2m, 0.4m below flood threshold.",
  },
  {
    id: "ALR-4181",
    kind: "AQI above safe range",
    zone: "Old Town · Market St",
    level: "warning" as const,
    time: "41 min ago",
    detail: "PM2.5 sustained at 88 µg/m³ for 30 minutes.",
  },
  {
    id: "ALR-4175",
    kind: "Traffic congestion",
    zone: "Ring Road · Junction B",
    level: "info" as const,
    time: "1 h ago",
    detail: "Average speed dropped to 14 km/h after signal fault.",
  },
];

export const sensors = [
  { label: "Air quality nodes", online: 128, total: 132 },
  { label: "Flood gauges", online: 46, total: 48 },
  { label: "Traffic cameras", online: 87, total: 96 },
  { label: "Smoke detectors", online: 211, total: 214 },
];
