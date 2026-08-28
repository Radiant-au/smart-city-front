import { useCallback, useEffect, useState } from "react";
import {
  fetchAirForecast,
  fetchDashboardHistory,
  fetchDashboardSnapshot,
  type DashboardHistory,
  type DashboardSnapshot,
  type ForecastResponse,
  type HistoryPeriod,
} from "@/lib/air-flood-api";

const latestIntervalMs = 5_000;
const forecastIntervalMs = 30 * 60_000;

export function useAirFloodMonitor() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [history, setHistory] = useState<DashboardHistory | null>(null);
  const [period, setPeriod] = useState<HistoryPeriod>("24h");
  const [isLoading, setIsLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadHistory = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const nextHistory = await fetchDashboardHistory(period, signal);
        if (!signal?.aborted) {
          setHistory(nextHistory);
          setHistoryError(null);
        }
      } catch (reason) {
        if (!signal?.aborted)
          setHistoryError(reason instanceof Error ? reason.message : "History is unavailable.");
      }
    },
    [period],
  );

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const loadSnapshot = async () => {
      try {
        const nextSnapshot = await fetchDashboardSnapshot(controller.signal);
        if (!disposed) {
          setSnapshot(nextSnapshot);
          setSnapshotError(null);
          setLastUpdatedAt(new Date());
        }
      } catch (reason) {
        if (!disposed && !controller.signal.aborted)
          setSnapshotError(
            reason instanceof Error ? reason.message : "Live telemetry is unavailable.",
          );
      } finally {
        if (!disposed) setIsLoading(false);
      }
    };
    const loadForecast = async () => {
      try {
        const nextForecast = await fetchAirForecast(controller.signal);
        if (!disposed) {
          setForecast(nextForecast);
          setForecastError(null);
        }
      } catch (reason) {
        if (!disposed && !controller.signal.aborted)
          setForecastError(reason instanceof Error ? reason.message : "Forecast is unavailable.");
      }
    };

    void loadSnapshot();
    void loadForecast();
    const latestTimer = window.setInterval(() => void loadSnapshot(), latestIntervalMs);
    const forecastTimer = window.setInterval(() => void loadForecast(), forecastIntervalMs);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(latestTimer);
      window.clearInterval(forecastTimer);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  return {
    snapshot,
    forecast,
    history,
    period,
    setPeriod,
    isLoading,
    isStale: snapshotError !== null,
    snapshotError,
    forecastError,
    historyError,
    lastUpdatedAt,
  };
}
