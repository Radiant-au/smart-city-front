import { useEffect, useState } from "react";
import {
  createTrafficEndpoints,
  fetchTrafficCameraStatuses,
  normalizeTrafficUpdate,
  type TrafficCameraStatus,
} from "@/lib/traffic-api";

const refreshIntervalMs = 15_000;
const initialReconnectDelayMs = 1_000;
const maximumReconnectDelayMs = 15_000;

export type TrafficMonitor = {
  cameras: TrafficCameraStatus[];
  error: string | null;
  isLoading: boolean;
  isRealtime: boolean;
  isStale: boolean;
};

export function useTrafficMonitor(): TrafficMonitor {
  const [cameras, setCameras] = useState<TrafficCameraStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isDisposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let reconnectDelay = initialReconnectDelayMs;

    const applyCameras = (nextCameras: TrafficCameraStatus[]) => {
      setCameras(nextCameras);
      setError(null);
      setIsLoading(false);
      setIsStale(false);
    };

    const refresh = async () => {
      try {
        const nextCameras = await fetchTrafficCameraStatuses(controller.signal);
        if (!isDisposed) applyCameras(nextCameras);
      } catch (reason) {
        if (isDisposed || controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Traffic backend is unavailable.");
        setIsLoading(false);
        setIsStale(true);
      }
    };

    const connect = () => {
      if (isDisposed) return;

      try {
        socket = new WebSocket(createTrafficEndpoints().websocket);
      } catch {
        setError("Traffic live updates could not be started.");
        setIsRealtime(false);
        setIsStale(true);
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        if (isDisposed) return;
        reconnectDelay = initialReconnectDelayMs;
        setIsRealtime(true);
      };

      socket.onmessage = (event) => {
        try {
          const nextCameras = normalizeTrafficUpdate(JSON.parse(event.data));
          if (nextCameras) applyCameras(nextCameras);
        } catch {
          setError("Traffic live update contained invalid data.");
        }
      };

      socket.onclose = () => {
        if (isDisposed) return;
        setIsRealtime(false);
        setIsStale(true);
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (isDisposed || reconnectTimer !== undefined) return;

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        connect();
        reconnectDelay = Math.min(reconnectDelay * 2, maximumReconnectDelayMs);
      }, reconnectDelay);
    };

    void refresh();
    connect();
    const refreshTimer = window.setInterval(() => void refresh(), refreshIntervalMs);

    return () => {
      isDisposed = true;
      controller.abort();
      window.clearInterval(refreshTimer);
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  return { cameras, error, isLoading, isRealtime, isStale };
}
