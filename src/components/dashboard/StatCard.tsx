import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "destructive" | "violet";

const toneMap: Record<Tone, { text: string; bg: string; stroke: string }> = {
  primary: { text: "text-primary", bg: "bg-primary/12", stroke: "var(--primary)" },
  success: { text: "text-success", bg: "bg-success/12", stroke: "var(--success)" },
  warning: { text: "text-warning", bg: "bg-warning/12", stroke: "var(--warning)" },
  destructive: { text: "text-destructive", bg: "bg-destructive/12", stroke: "var(--destructive)" },
  violet: { text: "text-violet", bg: "bg-violet/12", stroke: "var(--violet)" },
};

export function StatCard({
  label,
  value,
  unit,
  delta,
  icon: Icon,
  tone = "primary",
  data,
}: {
  label: string;
  value: string;
  unit?: string;
  delta: number;
  icon: LucideIcon;
  tone?: Tone;
  data: { value: number }[];
}) {
  const t = toneMap[tone];
  const up = delta >= 0;

  return (
    <div className="panel group relative overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="font-display mt-2 text-3xl font-semibold">
            {value}
            {unit ? <span className="ml-1 text-base text-muted-foreground">{unit}</span> : null}
          </p>
        </div>
        <div className={cn("flex size-9 items-center justify-center rounded-xl", t.bg, t.text)}>
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium",
            up ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success",
          )}
        >
          {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(delta)}%
        </span>
        <span className="text-muted-foreground">vs. last 24h</span>
      </div>

      <div className="pointer-events-none mt-4 h-12 opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.stroke} stopOpacity={0.45} />
                <stop offset="100%" stopColor={t.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={t.stroke}
              strokeWidth={2}
              fill={`url(#spark-${label})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
