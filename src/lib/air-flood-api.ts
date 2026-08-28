export type HistoryPeriod = "24h" | "7d" | "30d";

export type AirData = {
  mq135_raw: number | null;
  mq135_voltage: number | null;
  temperature: number | null;
  humidity: number | null;
  status: string | null;
};

export type FloodData = {
  water_raw: number | null;
  water_voltage: number | null;
  rain_raw: number | null;
  rain_voltage: number | null;
  water_level_normalized: number | null;
  water_level_percent: number | null;
  current_water_height_cm: number | null;
  predicted_water_level: number | null;
  predicted_water_percent: number | null;
  predicted_water_height_cm: number | null;
  ml_status: string | null;
  prediction_ready: boolean | null;
  historical_samples: number | null;
  required_samples: number | null;
  missing_hours: number[] | null;
  input_sequence: number[] | null;
  model_horizon: string | null;
  warning_height_cm: number | null;
  danger_height_cm: number | null;
  rain_state: string | null;
  status: string | null;
  decision_reason: string | null;
  reservoir: {
    location: string | null;
    type: string | null;
    width_cm: number | null;
    max_height_cm: number | null;
  } | null;
};

export type DashboardSnapshot = {
  sensor_data: {
    id: number | null;
    device_id: string | null;
    timestamp: string | null;
    air: AirData | null;
    flood: FloodData | null;
  } | null;
  openweather: AirQuality | null;
};

export type AirQuality = {
  aqi: number | null;
  aqi_status: string | null;
  pm2_5: number | null;
  pm10: number | null;
  co: number | null;
  no: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  nh3: number | null;
  timestamp?: string | number | null;
};

export type ForecastResponse = { forecast: AirQuality[]; updated_at: string | null };
export type SensorHistory = {
  timestamp: string;
  mq135_voltage: number | null;
  temperature: number | null;
  humidity: number | null;
  water_voltage: number | null;
  water_level_percent: number | null;
  water_height_cm: number | null;
  rain_voltage: number | null;
  predicted_water_level: number | null;
  predicted_water_percent: number | null;
  predicted_water_height_cm: number | null;
  flood_status: string | null;
};
export type DashboardHistory = {
  period: HistoryPeriod;
  sensor_history: SensorHistory[];
  api_history: AirQuality[];
};

const defaultAirFloodApiOrigin = "http://127.0.0.1:8000";

export function getAirFloodApiOrigin(
  configuredOrigin = import.meta.env.VITE_AIR_FLOOD_API_ORIGIN,
): string {
  try {
    const url = new URL(configuredOrigin?.trim() || defaultAirFloodApiOrigin);
    if (url.protocol === "http:" || url.protocol === "https:") return url.origin;
  } catch {
    // Use the documented local FastAPI address when configuration is malformed.
  }
  return defaultAirFloodApiOrigin;
}

export function createAirFloodEndpoints(configuredOrigin?: string) {
  const origin = getAirFloodApiOrigin(configuredOrigin);
  return {
    dashboard: `${origin}/api/dashboard/latest`,
    forecast: `${origin}/api/air/forecast`,
    history: (period: HistoryPeriod) => `${origin}/api/history/dashboard/${period}`,
    waterRelease: (deviceId: string) =>
      `${origin}/api/alerts/water-release?device_id=${encodeURIComponent(deviceId)}`,
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Air and flood backend returned ${response.status}.`);
  return response.json() as Promise<T>;
}

export const fetchDashboardSnapshot = (signal?: AbortSignal) =>
  request<DashboardSnapshot>(createAirFloodEndpoints().dashboard, { signal });

export const fetchAirForecast = (signal?: AbortSignal) =>
  request<ForecastResponse>(createAirFloodEndpoints().forecast, { signal });

export const fetchDashboardHistory = (period: HistoryPeriod, signal?: AbortSignal) =>
  request<DashboardHistory>(createAirFloodEndpoints().history(period), { signal });

export const sendWaterReleaseAlert = (deviceId: string, signal?: AbortSignal) =>
  request<unknown>(createAirFloodEndpoints().waterRelease(deviceId), { method: "POST", signal });
