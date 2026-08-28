// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrafficMonitor } from "./use-traffic-monitor";

const mocks = vi.hoisted(() => ({
  fetchTrafficCameraStatuses: vi.fn(),
}));

vi.mock("@/lib/traffic-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/traffic-api")>();
  return {
    ...actual,
    createTrafficEndpoints: () => ({
      cameras: "http://traffic.test/api/cameras",
      stream: (cameraId: string) => `http://traffic.test/stream/${cameraId}`,
      websocket: "ws://traffic.test/ws/traffic",
    }),
    fetchTrafficCameraStatuses: mocks.fetchTrafficCameraStatuses,
  };
});

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;

  constructor(_url: string) {
    FakeWebSocket.instances.push(this);
  }

  close() {
    this.onclose?.(new CloseEvent("close"));
  }

  open() {
    this.onopen?.(new Event("open"));
  }

  message(payload: unknown) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(payload) }));
  }
}

const verticalCamera = {
  id: "vertical-1",
  name: "Vertical Camera 1",
  connected: true,
  fps: 12.5,
  vehicleCount: 4,
  trafficLevel: "moderate" as const,
  error: null,
};

describe("useTrafficMonitor", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
    mocks.fetchTrafficCameraStatuses.mockReset();
    mocks.fetchTrafficCameraStatuses.mockResolvedValue([verticalCamera]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads an initial REST snapshot and applies WebSocket updates", async () => {
    const { result } = renderHook(() => useTrafficMonitor());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cameras).toEqual([verticalCamera]);

    act(() => FakeWebSocket.instances[0]?.open());
    expect(result.current.isRealtime).toBe(true);

    act(() =>
      FakeWebSocket.instances[0]?.message({
        type: "traffic_update",
        cameras: {
          "vertical-1": {
            id: "vertical-1",
            name: "Vertical Camera 1",
            connected: true,
            fps: 14,
            vehicle_count: 7,
            traffic_level: "high",
            error: null,
          },
        },
      }),
    );

    expect(result.current.cameras[0]?.vehicleCount).toBe(7);
    expect(result.current.cameras[0]?.trafficLevel).toBe("high");
  });

  it("reconnects after a WebSocket close and refreshes through REST", async () => {
    const { result } = renderHook(() => useTrafficMonitor());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => FakeWebSocket.instances[0]?.close());
    expect(result.current.isStale).toBe(true);

    await waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2), { timeout: 1_500 });
    expect(mocks.fetchTrafficCameraStatuses).toHaveBeenCalledTimes(1);
  });
});
