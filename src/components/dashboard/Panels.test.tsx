// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FireSmokePanel, TrafficPanel } from "./Panels";

const monitor = vi.hoisted(() => ({ current: {} }));

vi.mock("@/hooks/use-traffic-monitor", () => ({
  useTrafficMonitor: () => monitor.current,
}));

const camera = (id: string, connected = true) => ({
  id,
  name: `Camera ${id}`,
  connected,
  fps: 12.5,
  vehicleCount: 4,
  fireCount: null,
  smokeCount: null,
  hazardDetected: false,
  trafficLevel: "moderate" as const,
  error: connected ? null : "Camera disconnected",
});

describe("TrafficPanel", () => {
  afterEach(cleanup);

  it("keeps four slots for two, offline, and four-camera snapshots", () => {
    monitor.current = {
      cameras: [camera("one"), camera("two", false)],
      error: null,
      isLoading: false,
      isRealtime: true,
      isStale: false,
    };
    const { rerender } = render(<TrafficPanel />);
    expect(screen.getAllByText(/Awaiting backend registration/)).toHaveLength(2);
    expect(screen.getByText("Camera disconnected")).toBeTruthy();

    monitor.current = {
      ...monitor.current,
      cameras: [camera("one"), camera("two"), camera("three"), camera("four")],
    };
    rerender(<TrafficPanel />);
    expect(screen.queryByText(/Awaiting backend registration/)).toBeNull();
  });

  it("shows backend errors and retains a camera card when its stream fails", () => {
    monitor.current = {
      cameras: [camera("one")],
      error: "Traffic backend is unavailable.",
      isLoading: false,
      isRealtime: false,
      isStale: true,
    };
    render(<TrafficPanel />);
    fireEvent.error(screen.getByRole("img", { name: /camera one/i }));
    expect(screen.getByText("Traffic backend is unavailable.")).toBeTruthy();
    expect(screen.getByText("Stream unavailable")).toBeTruthy();
    expect(screen.getByText("Camera one")).toBeTruthy();
  });

  it("keeps fire-smoke cameras out of traffic slots", () => {
    monitor.current = {
      cameras: [
        { ...camera("fire-smoke-1"), fireCount: 1, smokeCount: 2, hazardDetected: true },
        camera("one"),
      ],
      error: null,
      isLoading: false,
      isRealtime: true,
      isStale: false,
    };
    render(<TrafficPanel />);
    expect(screen.queryByText("Camera fire-smoke-1")).toBeNull();
    expect(screen.getByText("Camera one")).toBeTruthy();
  });
});

describe("FireSmokePanel", () => {
  afterEach(cleanup);

  it("shows the featured live hazard feed and counts", () => {
    monitor.current = {
      cameras: [
        { ...camera("fire-smoke-1"), fireCount: 1, smokeCount: 2, hazardDetected: true },
        camera("one"),
      ],
      error: null,
      isLoading: false,
      isRealtime: true,
      isStale: false,
    };
    render(<FireSmokePanel />);
    expect(
      screen.getByRole("img", { name: /live annotated hazard feed from camera fire-smoke-1/i }),
    ).toBeTruthy();
    expect(screen.getByText("Monitoring live")).toBeTruthy();
    expect(screen.getByText("Fire")).toBeTruthy();
    expect(screen.getByText("Smoke")).toBeTruthy();
    expect(screen.getByText("Hazard detected")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("shows a clear state and stream fallback", () => {
    monitor.current = {
      cameras: [{ ...camera("fire-smoke-1"), fireCount: 0, smokeCount: 0 }],
      error: null,
      isLoading: false,
      isRealtime: false,
      isStale: true,
    };
    render(<FireSmokePanel />);
    fireEvent.error(screen.getByRole("img", { name: /hazard feed/i }));
    expect(screen.getByText("Area clear")).toBeTruthy();
    expect(screen.getByText("Stream unavailable")).toBeTruthy();
    expect(screen.getByText("Monitoring offline")).toBeTruthy();
    expect(screen.getByText("Reconnecting")).toBeTruthy();
  });

  it("keeps backend errors visible and explains when no hazard camera is registered", () => {
    monitor.current = {
      cameras: [camera("one")],
      error: "Traffic backend is unavailable.",
      isLoading: true,
      isRealtime: false,
      isStale: true,
    };
    render(<FireSmokePanel />);
    expect(screen.getByText("Connecting to the traffic backend…")).toBeTruthy();
    expect(screen.getByText("Traffic backend is unavailable.")).toBeTruthy();
    expect(screen.getByText("No hazard camera registered")).toBeTruthy();
    expect(screen.getByText(/awaiting backend registration/i)).toBeTruthy();
  });
});
