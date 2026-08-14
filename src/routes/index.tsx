import { createFileRoute } from "@tanstack/react-router";
import { Wind, Waves, Car, Flame } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  AirQualityPanel,
  AlertsPanel,
  DistrictsPanel,
  EnergyPanel,
  FloodPanel,
  MapPanel,
  TrafficPanel,
} from "@/components/dashboard/Panels";
import { airSeries, floodSeries, trafficSeries, series } from "@/lib/city-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart AI City · IoT Operations Dashboard" },
      {
        name: "description",
        content:
          "Live smart city IoT dashboard tracking air quality, flood levels, smoke detection, traffic flow and energy across every district.",
      },
      { property: "og:title", content: "Smart AI City · IoT Operations Dashboard" },
      {
        property: "og:description",
        content:
          "Real-time monitoring of air quality, floods, fire and traffic sensors across the city.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const smokeSeries = series(12, 18, 9, 55);

  return (
    <main className="mx-auto flex w-full max-w-[1500px] gap-6 px-4 py-6 sm:px-6">
      <Sidebar />

      <div className="min-w-0 flex-1 space-y-6">
        <Topbar time="Aug 14, 15:44 UTC" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Air quality"
            value="72"
            unit="AQI"
            delta={6.2}
            icon={Wind}
            tone="warning"
            data={airSeries.map((d) => ({ value: d.pm25 }))}
          />
          <StatCard
            label="River level"
            value="3.2"
            unit="m"
            delta={4.1}
            icon={Waves}
            tone="primary"
            data={floodSeries.map((d) => ({ value: d.level }))}
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

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <AirQualityPanel />
          </div>
          <AlertsPanel />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <MapPanel />
          </div>
          <EnergyPanel />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FloodPanel />
          <TrafficPanel />
        </div>

        <DistrictsPanel />

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Smart AI City · telemetry refreshed every 30 seconds
        </p>
      </div>
    </main>
  );
}
