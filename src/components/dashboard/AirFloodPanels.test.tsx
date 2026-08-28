// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AirMonitoringPanel } from "./AirFloodPanels";

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Legend: () => null,
  Line: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe("AirMonitoringPanel", () => {
  it("renders Unix-second forecast timestamps without crashing", () => {
    render(
      <AirMonitoringPanel
        monitor={{
          snapshot: { sensor_data: null, openweather: null },
          forecast: { updated_at: null, forecast: [{ timestamp: 1_787_760_000, aqi: 1 }] },
          history: { period: "24h", sensor_history: [], api_history: [] },
          period: "24h",
          setPeriod: vi.fn(),
          isLoading: false,
          isStale: false,
          snapshotError: null,
          forecastError: null,
          historyError: null,
          lastUpdatedAt: null,
        }}
      />,
    );

    expect(screen.getByText("1 AQI")).toBeTruthy();
  });
});
