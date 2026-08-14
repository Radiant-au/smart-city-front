import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { AlertTriangle, Flame, Info, MapPin } from "lucide-react";
import cityMap from "@/assets/city-map.jpg";
import { cn } from "@/lib/utils";
import {
  airSeries,
  alerts,
  districts,
  energySeries,
  floodSeries,
  sensors,
  trafficSeries,
} from "@/lib/city-data";

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

function PanelHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
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
            <Area type="monotone" dataKey="pm25" stroke="var(--primary)" strokeWidth={2} fill="url(#g-pm25)" />
            <Area type="monotone" dataKey="pm10" stroke="var(--violet)" strokeWidth={2} fill="url(#g-pm10)" />
            <Area type="monotone" dataKey="no2" stroke="var(--warning)" strokeWidth={2} fill="url(#g-no2)" />
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
                <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", tones[a.level])}>
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
            <Line type="monotone" dataKey="level" stroke="var(--info)" strokeWidth={2.5} dot={false} />
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

export function TrafficPanel() {
  return (
    <section className="panel p-5">
      <PanelHead title="Traffic flow" sub="Congestion index by hour" />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trafficSeries} margin={{ left: -20, right: 6, top: 6 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="t" {...axis} />
            <YAxis {...axis} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)", opacity: 0.4 }} />
            <Bar dataKey="congestion" radius={[6, 6, 0, 0]}>
              {trafficSeries.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.congestion > 70 ? "var(--destructive)" : d.congestion > 45 ? "var(--warning)" : "var(--primary)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
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
          <RadialBarChart data={data} innerRadius="35%" outerRadius="100%" startAngle={90} endAngle={-270}>
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
              <span className={cn("absolute -inset-2 -z-10 rounded-full opacity-25 blur-md", p.tone)} />
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sensors.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background/60 p-3 backdrop-blur">
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
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium capitalize", badge[d.status])}>
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
