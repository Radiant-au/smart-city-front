import { describe, expect, it, vi } from "vitest";
import {
  createAirFloodEndpoints,
  fetchDashboardHistory,
  getAirFloodApiOrigin,
  sendWaterReleaseAlert,
} from "./air-flood-api";

describe("air and flood API helpers", () => {
  it("normalizes configured origins and routes every endpoint through it", () => {
    expect(getAirFloodApiOrigin("https://air.example.test/path")).toBe("https://air.example.test");
    expect(getAirFloodApiOrigin("not a URL")).toBe("http://127.0.0.1:8000");
    expect(createAirFloodEndpoints("https://air.example.test/").history("7d")).toBe(
      "https://air.example.test/api/history/dashboard/7d",
    );
  });

  it("encodes device IDs and rejects non-success responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendWaterReleaseAlert("pi / 1")).rejects.toThrow("503");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("device_id=pi%20%2F%201");
    vi.unstubAllGlobals();
  });

  it("requests only supported history paths", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ period: "24h", sensor_history: [], api_history: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchDashboardHistory("24h")).resolves.toMatchObject({ period: "24h" });
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/24h");
    vi.unstubAllGlobals();
  });
});
