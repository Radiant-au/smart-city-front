import { useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Radio, Send } from "lucide-react";
import { sendWaterReleaseAlert, type AirQuality, type HistoryPeriod } from "@/lib/air-flood-api";
import { type useAirFloodMonitor } from "@/hooks/use-air-flood-monitor";
import { cn } from "@/lib/utils";

type Monitor = ReturnType<typeof useAirFloodMonitor>;
const periods: HistoryPeriod[] = ["24h", "7d", "30d"];
const pollutants: Array<[keyof AirQuality, string, string]> = [
  ["pm2_5", "PM2.5", "Fine particulate matter"],
  ["pm10", "PM10", "Particulate matter"],
  ["co", "CO", "Carbon monoxide"],
  ["no", "NO", "Nitrogen monoxide"],
  ["no2", "NO₂", "Nitrogen dioxide"],
  ["o3", "O₃", "Ozone"],
  ["so2", "SO₂", "Sulfur dioxide"],
  ["nh3", "NH₃", "Ammonia"],
];
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };
const tooltip = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
};

function value(value: number | string | null | undefined, digits = 1) {
  return typeof value === "number" ? value.toFixed(digits) : value || "—";
}

function parseTimestamp(value: Date | string | number | null | undefined) {
  return new Date(typeof value === "number" && value < 1_000_000_000_000 ? value * 1_000 : value ?? "");
}

function timestamp(date: Date | string | number | null | undefined) {
  if (!date) return "Waiting for data";
  const parsed = parseTimestamp(date);
  return Number.isNaN(parsed.getTime()) ? "Waiting for data" : parsed.toLocaleString();
}

function dayKey(date: string | number | null | undefined) {
  const parsed = parseTimestamp(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function Header({ title, sub, monitor }: { title: string; sub: string; monitor: Monitor }) {
  const online = !monitor.snapshotError && Boolean(monitor.snapshot);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </div>
      <span
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
          online ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground",
        )}
      >
        <Radio className="size-3" />{" "}
        {online ? "Live telemetry" : monitor.isLoading ? "Connecting" : "Stale / offline"}
      </span>
    </div>
  );
}

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/25 p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{children}</p>
    </div>
  );
}

function HistoryControls({ monitor }: { monitor: Monitor }) {
  return (
    <div className="flex gap-1 rounded-lg bg-secondary/50 p-1" aria-label="History period">
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => monitor.setPeriod(period)}
          className={cn(
            "rounded-md px-2 py-1 text-xs",
            monitor.period === period
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {period}
        </button>
      ))}
    </div>
  );
}

function HistoryState({ monitor, children }: { monitor: Monitor; children: React.ReactNode }) {
  if (monitor.historyError)
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
        {monitor.historyError}
      </p>
    );
  if (!monitor.history?.sensor_history.length && !monitor.history?.api_history.length)
    return (
      <p className="text-sm text-muted-foreground">No history is available for this period.</p>
    );
  return <>{children}</>;
}

export function AirMonitoringPanel({ monitor }: { monitor: Monitor }) {
  const air = monitor.snapshot?.sensor_data?.air;
  const current = monitor.snapshot?.openweather;
  const forecast = [...(monitor.forecast?.forecast ?? [])].sort(
    (a, b) => parseTimestamp(a.timestamp).getTime() - parseTimestamp(b.timestamp).getTime(),
  );
  const days = forecast
    .filter(
      (item, index) =>
        !forecast
          .slice(0, index)
          .some((previous) => dayKey(previous.timestamp) === dayKey(item.timestamp)),
    )
    .slice(0, 4);
  const history = monitor.history;

  return (
    <div className="space-y-6">
      <Header
        title="Air quality monitoring"
        sub={`Device: ${monitor.snapshot?.sensor_data?.device_id ?? "Waiting for Raspberry Pi"} · updated ${timestamp(monitor.lastUpdatedAt)}`}
        monitor={monitor}
      />
      {monitor.snapshotError ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {monitor.snapshotError} Last-known values remain visible.
        </p>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="MQ135 gas sensor">
          {value(air?.mq135_voltage, 3)} V{" "}
          <span className="text-xs font-normal text-muted-foreground">
            raw {value(air?.mq135_raw, 0)}
          </span>
        </Metric>
        <Metric label="Temperature">{value(air?.temperature)} °C</Metric>
        <Metric label="Humidity">{value(air?.humidity)} %</Metric>
        <Metric label="OpenWeather AQI">
          {value(current?.aqi, 0)}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {current?.aqi_status ?? "Waiting"}
          </span>
        </Metric>
      </section>
      <section className="panel p-5">
        <h2 className="font-display text-base font-semibold">Atmospheric pollutants</h2>
        <p className="mb-4 text-xs text-muted-foreground">Current OpenWeather concentrations</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pollutants.map(([key, label, meaning]) => (
            <Metric key={String(key)} label={label}>
              {value(current?.[key] as number | null)}{" "}
              <span className="block text-xs font-normal text-muted-foreground">{meaning}</span>
            </Metric>
          ))}
        </div>
      </section>
      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Four-day air forecast</h2>
            <p className="text-xs text-muted-foreground">
              Updated {timestamp(monitor.forecast?.updated_at)}
            </p>
          </div>
        </div>
        {monitor.forecastError ? (
          <p className="text-xs text-destructive">{monitor.forecastError}</p>
        ) : days.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {days.map((day, index) => (
              <Metric key={day.timestamp ?? index} label={timestamp(day.timestamp)}>
                {value(day.aqi, 0)} AQI{" "}
                <span className="block text-xs font-normal text-muted-foreground">
                  {pollutants
                    .map(([key, label]) => `${label} ${value(day[key] as number | null)}`)
                    .join(" · ")}
                </span>
              </Metric>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for forecast data.</p>
        )}
      </section>
      <section className="panel p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Air history</h2>
            <p className="text-xs text-muted-foreground">
              MQ135, temperature, humidity, AQI, and pollutants
            </p>
          </div>
          <HistoryControls monitor={monitor} />
        </div>
        <HistoryState monitor={monitor}>
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={history?.sensor_history}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) =>
                      new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                    {...axis}
                  />
                  <YAxis {...axis} />
                  <Tooltip contentStyle={tooltip} />
                  <Legend />
                  <Line
                    dataKey="mq135_voltage"
                    name="MQ135 V"
                    stroke="var(--primary)"
                    dot={false}
                  />
                  <Line dataKey="temperature" stroke="var(--warning)" dot={false} />
                  <Line dataKey="humidity" stroke="var(--info)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={history?.api_history}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) =>
                      new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                    {...axis}
                  />
                  <YAxis {...axis} />
                  <Tooltip contentStyle={tooltip} />
                  <Legend />
                  <Area
                    dataKey="aqi"
                    stroke="var(--warning)"
                    fill="var(--warning)"
                    fillOpacity={0.2}
                  />
                  <Area
                    dataKey="pm2_5"
                    name="PM2.5"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.15}
                  />
                  <Area
                    dataKey="pm10"
                    stroke="var(--violet)"
                    fill="var(--violet)"
                    fillOpacity={0.1}
                  />
                  <Line dataKey="no2" name="NO₂" stroke="var(--destructive)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={history?.api_history}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) =>
                      new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                    {...axis}
                  />
                  <YAxis {...axis} />
                  <Tooltip contentStyle={tooltip} />
                  <Legend />
                  <Line dataKey="co" stroke="var(--success)" dot={false} />
                  <Line dataKey="no" stroke="var(--info)" dot={false} />
                  <Line dataKey="no2" name="NO₂" stroke="var(--destructive)" dot={false} />
                  <Line dataKey="o3" name="O₃" stroke="var(--warning)" dot={false} />
                  <Line dataKey="so2" name="SO₂" stroke="var(--violet)" dot={false} />
                  <Line dataKey="nh3" name="NH₃" stroke="var(--primary)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </HistoryState>
      </section>
    </div>
  );
}

export function FloodMonitoringPanel({ monitor }: { monitor: Monitor }) {
  const flood = monitor.snapshot?.sensor_data?.flood;
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const send = async () => {
    if (
      !window.confirm(
        "Send WATER RELEASE alert? Connected buzzers will be instructed to double beep.",
      )
    )
      return;
    setSending(true);
    setMessage(null);
    try {
      await sendWaterReleaseAlert(monitor.snapshot?.sensor_data?.device_id ?? "SMARTCITY_PI_01");
      setMessage("Water-release alert queued by the backend.");
    } catch {
      setMessage("Water-release alert could not be queued.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="space-y-6">
      <Header
        title="Flood early warning"
        sub={`Device: ${monitor.snapshot?.sensor_data?.device_id ?? "Waiting for Raspberry Pi"} · updated ${timestamp(monitor.lastUpdatedAt)}`}
        monitor={monitor}
      />
      {monitor.snapshotError ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {monitor.snapshotError} Last-known values remain visible.
        </p>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Current water level">
          {value(flood?.water_level_percent)} %{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {value(flood?.current_water_height_cm, 2)} cm
          </span>
        </Metric>
        <Metric label="Water sensor">
          {value(flood?.water_voltage, 3)} V{" "}
          <span className="text-xs font-normal text-muted-foreground">
            raw {value(flood?.water_raw, 0)}
          </span>
        </Metric>
        <Metric label="Rain condition">
          {flood?.rain_state ?? "—"}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {value(flood?.rain_voltage, 3)} V · raw {value(flood?.rain_raw, 0)}
          </span>
        </Metric>
        <Metric label="Flood status">
          {flood?.status ?? "Monitoring"}
          <span className="block text-xs font-normal text-muted-foreground">
            {flood?.decision_reason ?? "Waiting for decision data"}
          </span>
        </Metric>
      </section>
      <section className="panel p-5">
        <h2 className="font-display text-base font-semibold">Flood intelligence</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Sensor, reservoir, prediction, and decision context
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Reservoir">
            {flood?.reservoir?.location ?? "—"}
            <span className="block text-xs font-normal text-muted-foreground">
              {flood?.reservoir?.type ?? "—"} · {value(flood?.reservoir?.width_cm)} cm wide ·{" "}
              {value(flood?.reservoir?.max_height_cm)} cm max
            </span>
          </Metric>
          <Metric label="Thresholds">
            Warning {value(flood?.warning_height_cm, 2)} cm
            <span className="block text-xs font-normal text-muted-foreground">
              Danger {value(flood?.danger_height_cm, 2)} cm · current{" "}
              {value(flood?.current_water_height_cm, 2)} cm
            </span>
          </Metric>
          <Metric label="+1 hour prediction">
            {flood?.prediction_ready
              ? `${value(flood.predicted_water_height_cm, 2)} cm`
              : "Warming up"}
            <span className="block text-xs font-normal text-muted-foreground">
              {value(flood?.predicted_water_percent)}% · {flood?.model_horizon ?? "Next 1 hour"}
            </span>
          </Metric>
          <Metric label="ML readiness">
            {flood?.ml_status ?? "—"}
            <span className="block text-xs font-normal text-muted-foreground">
              {value(flood?.historical_samples, 0)} / {value(flood?.required_samples, 0)} samples ·
              missing {flood?.missing_hours?.join(", ") || "none"}
            </span>
          </Metric>
        </div>
        <div className="mt-4 rounded-xl bg-secondary/35 p-4 text-sm">
          <p className="font-medium">Decision pipeline</p>
          <p className="mt-1 text-muted-foreground">
            Water {value(flood?.water_level_normalized, 3)} normalized → rain{" "}
            {flood?.rain_state ?? "—"} → prediction{" "}
            {flood?.prediction_ready ? "ready" : "warming up"} → {flood?.status ?? "monitoring"}
          </p>
          {flood?.input_sequence?.length ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Model input: {flood.input_sequence.join(", ")}
            </p>
          ) : null}
        </div>
      </section>
      <section className="panel p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Flood history</h2>
            <p className="text-xs text-muted-foreground">Water, rain, and predicted level</p>
          </div>
          <HistoryControls monitor={monitor} />
        </div>
        <HistoryState monitor={monitor}>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={monitor.history?.sensor_history}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  }
                  {...axis}
                />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltip} />
                <Legend />
                <Line
                  dataKey="water_level_percent"
                  name="Water level %"
                  stroke="var(--info)"
                  dot={false}
                />
                <Line dataKey="rain_voltage" name="Rain V" stroke="var(--success)" dot={false} />
                <Line
                  dataKey="predicted_water_percent"
                  name="Predicted %"
                  stroke="var(--warning)"
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </HistoryState>
      </section>
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-display text-base font-semibold">Manual water-release alert</h2>
          <p className="text-xs text-muted-foreground">
            Requires confirmation before the backend queues a device command.
          </p>
          {message ? (
            <p
              className={cn(
                "mt-2 text-xs",
                message.includes("could not") ? "text-destructive" : "text-success",
              )}
            >
              {message}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={sending}
          onClick={() => void send()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Send className="size-4" />
          {sending ? "Sending…" : "Send water-release alert"}
        </button>
      </section>
    </div>
  );
}
