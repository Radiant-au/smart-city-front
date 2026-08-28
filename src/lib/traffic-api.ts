export type TrafficLevel = "low" | "moderate" | "high" | "unknown";

export type TrafficCameraStatus = {
  id: string;
  name: string;
  connected: boolean;
  fps: number | null;
  vehicleCount: number | null;
  fireCount: number | null;
  smokeCount: number | null;
  hazardDetected: boolean;
  trafficLevel: TrafficLevel;
  error: string | null;
};

export type TrafficEndpoints = {
  cameras: string;
  stream: (cameraId: string) => string;
  websocket: string;
};

const defaultTrafficApiOrigin = "http://127.0.0.1:8000";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readTrafficLevel(value: unknown): TrafficLevel {
  if (value === "low" || value === "moderate" || value === "high") return value;
  if (value === "LOW TRAFFIC") return "low";
  if (value === "MODERATE TRAFFIC") return "moderate";
  if (value === "HIGH TRAFFIC") return "high";
  return "unknown";
}

export function getTrafficApiOrigin(
  configuredOrigin = import.meta.env.VITE_TRAFFIC_API_ORIGIN,
): string {
  const origin = configuredOrigin?.trim() || defaultTrafficApiOrigin;

  try {
    const url = new URL(origin);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch {
    // Fall back to the documented local backend address when configuration is malformed.
  }

  return defaultTrafficApiOrigin;
}

export function createTrafficEndpoints(configuredOrigin?: string): TrafficEndpoints {
  const origin = getTrafficApiOrigin(configuredOrigin);
  const websocketOrigin = new URL(origin);
  websocketOrigin.protocol = websocketOrigin.protocol === "https:" ? "wss:" : "ws:";

  return {
    cameras: `${origin}/api/cameras`,
    stream: (cameraId) => `${origin}/stream/${encodeURIComponent(cameraId)}`,
    websocket: `${websocketOrigin.origin}/ws/traffic`,
  };
}

export function normalizeCameraStatuses(payload: unknown): TrafficCameraStatus[] | null {
  if (!isRecord(payload)) return null;

  const cameras = Object.entries(payload)
    .flatMap(([cameraId, value]) => {
      if (!isRecord(value)) return [];

      return [
        {
          id: readString(value.id) ?? cameraId,
          name: readString(value.name) ?? cameraId,
          connected: value.connected === true,
          fps: readNumber(value.fps),
          vehicleCount: readNumber(value.vehicle_count),
          fireCount: readNumber(value.fire_count),
          smokeCount: readNumber(value.smoke_count),
          hazardDetected: value.hazard_detected === true,
          trafficLevel: readTrafficLevel(value.traffic_level),
          error: readString(value.error),
        },
      ];
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  return cameras;
}

export function normalizeTrafficUpdate(payload: unknown): TrafficCameraStatus[] | null {
  if (!isRecord(payload) || payload.type !== "traffic_update") return null;
  return normalizeCameraStatuses(payload.cameras);
}

export async function fetchTrafficCameraStatuses(
  signal?: AbortSignal,
): Promise<TrafficCameraStatus[]> {
  const response = await fetch(createTrafficEndpoints().cameras, { signal });
  if (!response.ok) throw new Error(`Traffic backend returned ${response.status}.`);

  const cameras = normalizeCameraStatuses(await response.json());
  if (!cameras) throw new Error("Traffic backend returned an invalid camera status payload.");
  return cameras;
}
