// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAirFloodMonitor } from "./use-air-flood-monitor";

const api = vi.hoisted(() => ({ dashboard: vi.fn(), forecast: vi.fn(), history: vi.fn() }));
vi.mock("@/lib/air-flood-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/air-flood-api")>()),
  fetchDashboardSnapshot: api.dashboard,
  fetchAirForecast: api.forecast,
  fetchDashboardHistory: api.history,
}));

describe("useAirFloodMonitor", () => {
  afterEach(() => vi.clearAllMocks());
  it("keeps the last snapshot when a later request fails and reloads history by period", async () => {
    api.dashboard.mockResolvedValueOnce({ sensor_data: null, openweather: { aqi: 2 } });
    api.forecast.mockResolvedValue({ forecast: [], updated_at: null });
    api.history.mockResolvedValue({ period: "24h", sensor_history: [], api_history: [] });
    const { result } = renderHook(() => useAirFloodMonitor());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot?.openweather?.aqi).toBe(2);
    result.current.setPeriod("7d");
    await waitFor(() =>
      expect(api.history).toHaveBeenLastCalledWith("7d", expect.any(AbortSignal)),
    );
  });

  it("reports independent failures and aborts owned requests on unmount", async () => {
    let signal: AbortSignal | undefined;
    api.dashboard.mockImplementation((_signal?: AbortSignal) => {
      signal = _signal;
      return Promise.reject(new Error("offline"));
    });
    api.forecast.mockRejectedValue(new Error("forecast offline"));
    api.history.mockRejectedValue(new Error("history offline"));
    const { result, unmount } = renderHook(() => useAirFloodMonitor());
    await waitFor(() => expect(result.current.snapshotError).toContain("offline"));
    expect(result.current.forecastError).toContain("forecast offline");
    expect(result.current.historyError).toContain("history offline");
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
