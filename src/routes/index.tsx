import { Wind, Waves, Car, Flame } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatCard } from "@/components/dashboard/StatCard";
import { FireSmokePanel, MapPanel, TrafficPanel } from "@/components/dashboard/Panels";
import { AirMonitoringPanel, FloodMonitoringPanel } from "@/components/dashboard/AirFloodPanels";
import { AiAssistantView } from "@/components/dashboard/AiAssistant";
import { trafficSeries, series } from "@/lib/city-data";
import { useAirFloodMonitor } from "@/hooks/use-air-flood-monitor";

export function Dashboard({
  view,
  onViewChange,
}: {
  view: "overview" | "traffic" | "assistant" | "fire-smoke" | "air-quality" | "flood-watch";
  onViewChange: (
    view: "overview" | "traffic" | "assistant" | "fire-smoke" | "air-quality" | "flood-watch",
  ) => void;
}) {
  const smokeSeries = series(12, 18, 9, 55);
  const monitor = useAirFloodMonitor();
  const airHistory = monitor.history?.api_history.map((point) => ({ value: point.aqi ?? 0 })) ?? [];
  const floodHistory =
    monitor.history?.sensor_history.map((point) => ({ value: point.water_level_percent ?? 0 })) ??
    [];
  const aqi = monitor.snapshot?.openweather?.aqi;
  const water = monitor.snapshot?.sensor_data?.flood?.water_level_percent;

  return (
    <main className="mx-auto flex w-full max-w-[1500px] gap-6 px-4 py-6 sm:px-6">
      <Sidebar view={view} onViewChange={onViewChange} />

      <div className="min-w-0 flex-1 space-y-6">
        <Topbar time="Aug 14, 15:44 UTC" />

        {view === "assistant" ? (
          <AiAssistantView />
        ) : view === "air-quality" ? (
          <AirMonitoringPanel monitor={monitor} />
        ) : view === "flood-watch" ? (
          <FloodMonitoringPanel monitor={monitor} />
        ) : view === "fire-smoke" ? (
          <FireSmokePanel />
        ) : view === "traffic" ? (
          <TrafficPanel />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Air quality"
                value={aqi === null || aqi === undefined ? "—" : String(aqi)}
                unit="AQI"
                note={
                  monitor.snapshotError
                    ? "Stale / offline"
                    : monitor.isLoading
                      ? "Connecting"
                      : (monitor.snapshot?.openweather?.aqi_status ?? "Waiting for AQI")
                }
                icon={Wind}
                tone="warning"
                data={airHistory}
              />
              <StatCard
                label="River level"
                value={water === null || water === undefined ? "—" : water.toFixed(1)}
                unit="%"
                note={
                  monitor.snapshotError
                    ? "Stale / offline"
                    : (monitor.snapshot?.sensor_data?.flood?.status ?? "Waiting for water data")
                }
                icon={Waves}
                tone="primary"
                data={floodHistory}
              />
              <StatCard
                label="Congestion"
                value="54"
                unit="%"
                delta={-8.4}
                icon={Car}
                tone="success"
                data={trafficSeries.map((d) => ({ value: d.congestion }))}
              />
              <StatCard
                label="Smoke events"
                value="3"
                delta={12.5}
                icon={Flame}
                tone="destructive"
                data={smokeSeries}
              />
            </div>

            <div className="[&>section]:h-full">
              <MapPanel />
            </div>
          </>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Smart AI City · air and flood telemetry refreshed every 5 seconds
        </p>
      </div>
    </main>
  );
}
