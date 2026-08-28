import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Camera,
  Flame,
  Info,
  MapPin,
  Radio,
  ShieldCheck,
  VideoOff,
  Wind,
} from "lucide-react";
import cityMap from "@/assets/city-map.jpg";
import { useTrafficMonitor } from "@/hooks/use-traffic-monitor";
import { createTrafficEndpoints, type TrafficCameraStatus } from "@/lib/traffic-api";
import { cn } from "@/lib/utils";
import { airSeries, alerts, districts, energySeries, floodSeries, sensors } from "@/lib/city-data";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

function PanelHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function AirQualityPanel() {
  return (
    <section className="panel p-5">
      <PanelHead
        title="Air quality index"
        sub="PM2.5 · PM10 · NO₂ over the last 24 hours"
        right={
          <div className="flex gap-3 text-xs text-muted-foreground">
            {[
              ["PM2.5", "var(--primary)"],
              ["PM10", "var(--violet)"],
              ["NO₂", "var(--warning)"],
            ].map(([k, c]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: c }} />
                {k}
              </span>
            ))}
          </div>
        }
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={airSeries} margin={{ left: -18, right: 6, top: 6 }}>
            <defs>
              {[
                ["pm25", "var(--primary)"],
                ["pm10", "var(--violet)"],
                ["no2", "var(--warning)"],
              ].map(([k, c]) => (
                <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="t" {...axis} />
            <YAxis {...axis} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
            <Area
              type="monotone"
              dataKey="pm25"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#g-pm25)"
            />
            <Area
              type="monotone"
              dataKey="pm10"
              stroke="var(--violet)"
              strokeWidth={2}
              fill="url(#g-pm10)"
            />
            <Area
              type="monotone"
              dataKey="no2"
              stroke="var(--warning)"
              strokeWidth={2}
              fill="url(#g-no2)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function AlertsPanel() {
  const icons = { critical: Flame, warning: AlertTriangle, info: Info };
  const tones = {
    critical: "text-destructive bg-destructive/12",
    warning: "text-warning bg-warning/12",
    info: "text-info bg-info/12",
  };

  return (
    <section className="panel p-5">
      <PanelHead
        title="Live alerts"
        sub="Auto-triaged by the AI incident engine"
        right={
          <span className="rounded-full bg-destructive/12 px-2.5 py-1 text-[11px] font-medium text-destructive">
            1 critical
          </span>
        }
      />
      <ul className="space-y-3">
        {alerts.map((a) => {
          const Icon = icons[a.level];
          return (
            <li
              key={a.id}
              className="rounded-xl border border-border bg-secondary/35 p-3 transition-colors hover:bg-secondary/60"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    tones[a.level],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{a.kind}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.zone}</p>
                  <p className="mt-1 text-xs text-muted-foreground/80">{a.detail}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FloodPanel() {
  return (
    <section className="panel p-5">
      <PanelHead title="Flood monitoring" sub="Water level (m) vs. rainfall (mm)" />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={floodSeries} margin={{ left: -20, right: 6, top: 6 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="t" {...axis} />
            <YAxis {...axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="level"
              stroke="var(--info)"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="rainfall"
              stroke="var(--success)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function CameraFeedCard({ camera }: { camera: TrafficCameraStatus }) {
  const [streamFailed, setStreamFailed] = useState(false);
  const streamUrl = createTrafficEndpoints().stream(camera.id);
  const isLive = camera.connected && !streamFailed;
  const isFireSmoke = camera.fireCount !== null || camera.smokeCount !== null;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-secondary/25">
      <div className="relative aspect-video bg-background">
        {isLive ? (
          <img
            src={streamUrl}
            alt={`Live annotated traffic feed from ${camera.name}`}
            className="size-full object-cover"
            onError={() => setStreamFailed(true)}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <VideoOff className="size-7" />
            <span className="text-xs">
              {streamFailed ? "Stream unavailable" : "Camera offline"}
            </span>
          </div>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur",
            isLive
              ? "bg-success/90 text-success-foreground"
              : "bg-background/85 text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              isLive ? "bg-success-foreground" : "bg-muted-foreground",
            )}
          />
          {isLive ? "Live" : "Offline"}
        </span>
      </div>
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{camera.name}</h3>
            <p className="truncate text-[11px] text-muted-foreground">{camera.id}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-md bg-background px-2 py-1 text-[11px] font-medium capitalize text-foreground",
              camera.hazardDetected && "bg-destructive/15 text-destructive",
            )}
          >
            {isFireSmoke ? (camera.hazardDetected ? "hazard" : "clear") : camera.trafficLevel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-background/70 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {isFireSmoke ? "Fire" : "Vehicles"}
            </p>
            <p className="mt-0.5 font-semibold">
              {isFireSmoke ? (camera.fireCount ?? "—") : (camera.vehicleCount ?? "—")}
            </p>
          </div>
          <div className="rounded-lg bg-background/70 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {isFireSmoke ? "Smoke" : "Frame rate"}
            </p>
            <p className="mt-0.5 font-semibold">
              {isFireSmoke
                ? (camera.smokeCount ?? "—")
                : camera.fps === null
                  ? "—"
                  : `${camera.fps} fps`}
            </p>
          </div>
        </div>
        {camera.error ? <p className="text-xs text-destructive">{camera.error}</p> : null}
      </div>
    </article>
  );
}

function FireSmokeSurveillance({ camera }: { camera: TrafficCameraStatus }) {
  const [streamFailed, setStreamFailed] = useState(false);
  const streamUrl = createTrafficEndpoints().stream(camera.id);
  const isLive = camera.connected && !streamFailed;
  const isHazard = camera.hazardDetected;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-secondary/20">
      <div className="grid lg:grid-cols-[minmax(0,1.8fr)_minmax(15rem,0.7fr)]">
        <div className="relative aspect-video bg-background">
          {isLive ? (
            <img
              src={streamUrl}
              alt={`Live annotated hazard feed from ${camera.name}`}
              className="size-full object-cover"
              onError={() => setStreamFailed(true)}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <VideoOff className="size-8" />
              <span className="text-sm font-medium">
                {streamFailed ? "Stream unavailable" : "Camera offline"}
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent px-4 pb-4 pt-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              Live city monitor
            </p>
            <h3 className="mt-1 text-lg font-semibold">{camera.name}</h3>
            <p className="text-xs text-muted-foreground">{camera.id}</p>
          </div>
          <span
            className={cn(
              "absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur",
              isLive
                ? "bg-success/90 text-success-foreground"
                : "bg-background/85 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isLive ? "bg-success-foreground" : "bg-muted-foreground",
              )}
            />
            {isLive ? "Monitoring live" : "Monitoring offline"}
          </span>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4 lg:border-l lg:border-t-0">
          <span
            className={cn(
              "flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              isHazard ? "bg-destructive/15 text-destructive" : "bg-success/12 text-success",
            )}
          >
            {isHazard ? (
              <AlertTriangle className="size-3.5" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            {isHazard ? "Hazard detected" : "Area clear"}
          </span>
          <p className="text-sm text-muted-foreground">
            {isHazard
              ? "Fire or smoke requires attention."
              : "No fire or smoke detected on this feed."}
          </p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-background/70 p-3">
              <dt className="flex items-center gap-1.5 uppercase tracking-wide text-muted-foreground">
                <Flame className="size-3" /> Fire
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{camera.fireCount ?? "—"}</dd>
            </div>
            <div className="rounded-xl bg-background/70 p-3">
              <dt className="flex items-center gap-1.5 uppercase tracking-wide text-muted-foreground">
                <Wind className="size-3" /> Smoke
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {camera.smokeCount ?? "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-auto text-xs text-muted-foreground">
            Frame rate:{" "}
            <span className="font-medium text-foreground">
              {camera.fps === null ? "—" : `${camera.fps} fps`}
            </span>
          </p>
          {camera.error ? <p className="text-xs text-destructive">{camera.error}</p> : null}
        </div>
      </div>
    </article>
  );
}

function FutureCameraCard({ number }: { number: number }) {
  return (
    <article className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-center">
      <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-background text-muted-foreground">
        <Camera className="size-5" />
      </span>
      <h3 className="text-sm font-semibold">Camera {number}</h3>
      <p className="mt-1 text-xs text-muted-foreground">Awaiting backend registration</p>
    </article>
  );
}

export function TrafficPanel() {
  const { cameras, error, isLoading, isRealtime, isStale } = useTrafficMonitor();
  const displayedCameras = cameras
    .filter((camera) => camera.fireCount === null && camera.smokeCount === null)
    .slice(0, 4);
  const reservedSlots = Math.max(0, 4 - displayedCameras.length);

  return (
    <section className="panel p-5">
      <PanelHead
        title="Live traffic cameras"
        sub="Annotated vehicle detection feeds from the traffic API"
        right={
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              isRealtime ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground",
            )}
          >
            <Radio className="size-3" />
            {isRealtime ? "Live updates" : isStale ? "Reconnecting" : "Status check"}
          </span>
        }
      />

      {isLoading ? (
        <p className="mb-4 text-xs text-muted-foreground">Connecting to the traffic backend…</p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {displayedCameras.map((camera) => (
          <CameraFeedCard key={camera.id} camera={camera} />
        ))}
        {Array.from({ length: reservedSlots }, (_, index) => (
          <FutureCameraCard
            key={`future-camera-${index}`}
            number={displayedCameras.length + index + 1}
          />
        ))}
      </div>

      {cameras.length > 4 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {cameras.length - 4} additional backend camera feeds are not shown yet.
        </p>
      ) : null}
    </section>
  );
}

export function FireSmokePanel() {
  const { cameras, error, isLoading, isRealtime, isStale } = useTrafficMonitor();
  const fireSmokeCameras = cameras.filter(
    (camera) =>
      camera.id.includes("fire") ||
      camera.id.includes("smoke") ||
      camera.fireCount !== null ||
      camera.smokeCount !== null,
  );

  return (
    <section className="panel p-5">
      <PanelHead
        title="Fire & smoke camera"
        sub="Annotated hazard detection feed from the traffic API"
        right={
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              isRealtime ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground",
            )}
          >
            <Radio className="size-3" />
            {isRealtime ? "Live updates" : isStale ? "Reconnecting" : "Status check"}
          </span>
        }
      />

      {isLoading ? (
        <p className="mb-4 text-xs text-muted-foreground">Connecting to the traffic backend…</p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {fireSmokeCameras.length ? (
        <>
          <FireSmokeSurveillance camera={fireSmokeCameras[0]} />
          {fireSmokeCameras.length > 1 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {fireSmokeCameras.slice(1).map((camera) => (
                <CameraFeedCard key={camera.id} camera={camera} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <article className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 p-5 text-center">
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-background text-muted-foreground">
            <Camera className="size-5" />
          </span>
          <h3 className="text-sm font-semibold">No hazard camera registered</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            A fire or smoke camera is awaiting backend registration.
          </p>
        </article>
      )}
    </section>
  );
}

export function EnergyPanel() {
  const data = energySeries.map((d, i) => ({
    ...d,
    fill: ["var(--primary)", "var(--success)", "var(--violet)", "var(--warning)"][i],
  }));

  return (
    <section className="panel p-5">
      <PanelHead title="Energy mix" sub="City grid supply right now" />
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="35%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: "var(--secondary)" }} cornerRadius={8} />
            <Tooltip contentStyle={tooltipStyle} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: d.fill }} />
            {d.name}
            <span className="ml-auto text-foreground">{d.value}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MapPanel() {
  const pins = [
    { top: "26%", left: "32%", tone: "bg-success" },
    { top: "48%", left: "58%", tone: "bg-warning" },
    { top: "66%", left: "24%", tone: "bg-primary" },
    { top: "36%", left: "76%", tone: "bg-destructive" },
  ];

  return (
    <section className="panel relative overflow-hidden">
      <img
        src={cityMap}
        alt="Live map of city sensor coverage"
        width={1280}
        height={960}
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-70"
      />
      <div className="grid-lines absolute inset-0 opacity-40" />
      <div className="relative p-5">
        <PanelHead
          title="Sensor grid"
          sub="472 devices across 6 districts"
          right={
            <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
              Live
            </span>
          }
        />
        <div className="relative h-64">
          {pins.map((p, i) => (
            <span key={i} className="absolute" style={{ top: p.top, left: p.left }}>
              <span className={cn("pulse-dot block size-3 rounded-full", p.tone)} />
              <span
                className={cn("absolute -inset-2 -z-10 rounded-full opacity-25 blur-md", p.tone)}
              />
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sensors.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-background/60 p-3 backdrop-blur"
            >
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="font-display mt-1 text-lg font-semibold">
                {s.online}
                <span className="text-xs text-muted-foreground">/{s.total}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DistrictsPanel() {
  const badge = {
    normal: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    critical: "bg-destructive/12 text-destructive",
  };

  return (
    <section className="panel p-5">
      <PanelHead title="District status" sub="AQI, water level and congestion by zone" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 font-medium">District</th>
              <th className="pb-3 font-medium">AQI</th>
              <th className="pb-3 font-medium">Water</th>
              <th className="pb-3 font-medium">Traffic</th>
              <th className="pb-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((d) => (
              <tr key={d.name} className="border-t border-border/70">
                <td className="py-3">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    {d.name}
                  </span>
                </td>
                <td className="py-3 tabular-nums">{d.aqi}</td>
                <td className="py-3 tabular-nums">{d.flood.toFixed(1)} m</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${d.traffic}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{d.traffic}%</span>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
                      badge[d.status],
                    )}
                  >
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
