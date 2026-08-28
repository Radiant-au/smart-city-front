// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./hooks/use-traffic-monitor", () => ({
  useTrafficMonitor: () => ({
    cameras: [
      {
        id: "fire-smoke-1",
        name: "Fire smoke camera",
        connected: true,
        fps: 12,
        vehicleCount: null,
        fireCount: 1,
        smokeCount: 2,
        hazardDetected: true,
        trafficLevel: "unknown",
        error: null,
      },
    ],
    error: null,
    isLoading: false,
    isRealtime: false,
    isStale: false,
  }),
}));

vi.mock("./hooks/use-air-flood-monitor", () => ({
  useAirFloodMonitor: () => ({
    snapshot: {
      sensor_data: {
        device_id: "SMARTCITY_PI_01",
        timestamp: "2026-08-26T12:00:00Z",
        air: { mq135_raw: 42, mq135_voltage: 1.2, temperature: 30, humidity: 65, status: null },
        flood: {
          water_raw: 12,
          water_voltage: 1,
          rain_raw: 2,
          rain_voltage: 0.3,
          water_level_normalized: 0.3,
          water_level_percent: 30,
          current_water_height_cm: 1.2,
          predicted_water_level: null,
          predicted_water_percent: null,
          predicted_water_height_cm: null,
          ml_status: "WARMING_UP",
          prediction_ready: false,
          historical_samples: 1,
          required_samples: 4,
          missing_hours: [1],
          input_sequence: null,
          model_horizon: "next_1_hour",
          warning_height_cm: 2.4,
          danger_height_cm: 3.2,
          rain_state: "Dry",
          status: "MONITORING",
          decision_reason: "Normal",
          reservoir: { location: "Reservoir", type: "reservoir", width_cm: 20, max_height_cm: 4 },
        },
      },
      openweather: {
        aqi: 2,
        aqi_status: "Fair",
        pm2_5: 2,
        pm10: 3,
        co: 4,
        no: 5,
        no2: 6,
        o3: 7,
        so2: 8,
        nh3: 9,
      },
    },
    forecast: { forecast: [], updated_at: null },
    history: { period: "24h", sensor_history: [], api_history: [] },
    period: "24h",
    setPeriod: vi.fn(),
    isLoading: false,
    isStale: false,
    snapshotError: null,
    forecastError: null,
    historyError: null,
    lastUpdatedAt: new Date("2026-08-26T12:00:00Z"),
  }),
}));

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

describe("App navigation", () => {
  afterEach(cleanup);

  it("shows the four-camera panel only on the Traffic tab", () => {
    render(<App />);
    expect(screen.queryByText("Live traffic cameras")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Traffic" }));
    expect(screen.getByText("Live traffic cameras")).toBeTruthy();
    expect(screen.getAllByText("Awaiting backend registration")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Fire & smoke" }));
    expect(screen.getByText("Fire & smoke camera")).toBeTruthy();
    expect(screen.getByText("Fire smoke camera")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.queryByText("Live traffic cameras")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "AI Assistant" }));
    expect(screen.getByText("AI chat")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Air quality" }));
    expect(screen.getByText("Atmospheric pollutants")).toBeTruthy();
    expect(screen.getByText("PM2.5")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Flood watch" }));
    expect(screen.getByText("Flood intelligence")).toBeTruthy();
    expect(screen.getByText("Manual water-release alert")).toBeTruthy();
  });

  it("does not send a water-release alert when confirmation is cancelled", () => {
    const confirm = vi.fn(() => false);
    const fetchMock = vi.fn();
    vi.stubGlobal("confirm", confirm);
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Flood watch" }));
    fireEvent.click(screen.getByRole("button", { name: "Send water-release alert" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports queued and failed water-release requests accurately", async () => {
    vi.stubGlobal("confirm", () => true);
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Flood watch" }));
    fireEvent.click(screen.getByRole("button", { name: "Send water-release alert" }));
    await waitFor(() => expect(screen.getByText(/queued by the backend/i)).toBeTruthy());
    expect(fetchMock.mock.calls[0]?.[0]).toContain("device_id=SMARTCITY_PI_01");
    unmount();

    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Flood watch" }));
    fireEvent.click(screen.getByRole("button", { name: "Send water-release alert" }));
    await waitFor(() => expect(screen.getByText(/could not be queued/i)).toBeTruthy());
  });
});
