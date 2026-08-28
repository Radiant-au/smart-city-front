import { describe, expect, it } from "vitest";
import {
  createTrafficEndpoints,
  getTrafficApiOrigin,
  normalizeCameraStatuses,
  normalizeTrafficUpdate,
} from "./traffic-api";

describe("traffic API helpers", () => {
  it("derives REST, MJPEG, and secure WebSocket endpoints from one origin", () => {
    const endpoints = createTrafficEndpoints("https://traffic.example.test/");

    expect(endpoints.cameras).toBe("https://traffic.example.test/api/cameras");
    expect(endpoints.stream("vertical 1")).toBe("https://traffic.example.test/stream/vertical%201");
    expect(endpoints.websocket).toBe("wss://traffic.example.test/ws/traffic");
  });

  it("falls back safely when the configured origin is malformed", () => {
    expect(getTrafficApiOrigin("not a URL")).toBe("http://127.0.0.1:8000");
  });

  it("normalizes valid camera snapshots and ignores malformed camera entries", () => {
    expect(
      normalizeCameraStatuses({
        "vertical-1": {
          id: "vertical-1",
          name: "Vertical Camera 1",
          connected: true,
          fps: 18.4,
          vehicle_count: 6,
          fire_count: null,
          smoke_count: null,
          hazard_detected: false,
          traffic_level: "high",
          error: null,
        },
        malformed: "not-a-camera",
      }),
    ).toEqual([
      {
        id: "vertical-1",
        name: "Vertical Camera 1",
        connected: true,
        fps: 18.4,
        vehicleCount: 6,
        fireCount: null,
        smokeCount: null,
        hazardDetected: false,
        trafficLevel: "high",
        error: null,
      },
    ]);
  });

  it("normalizes fire-smoke camera fields", () => {
    expect(
      normalizeCameraStatuses({
        "fire-smoke-1": {
          connected: true,
          fire_count: 1,
          smoke_count: 2,
          hazard_detected: true,
        },
      }),
    ).toMatchObject([
      {
        id: "fire-smoke-1",
        fireCount: 1,
        smokeCount: 2,
        hazardDetected: true,
      },
    ]);
  });

  it("normalizes car-detector traffic labels", () => {
    expect(
      normalizeCameraStatuses({
        "vertical-1": { connected: true, traffic_level: "LOW TRAFFIC" },
      }),
    ).toMatchObject([{ id: "vertical-1", trafficLevel: "low" }]);
  });

  it("accepts only traffic-update WebSocket messages", () => {
    expect(normalizeTrafficUpdate({ type: "unknown", cameras: {} })).toBeNull();
    expect(normalizeTrafficUpdate({ type: "traffic_update", cameras: [] })).toBeNull();
  });
});
