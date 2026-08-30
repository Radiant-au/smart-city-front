import {
  LayoutDashboard,
  Wind,
  Waves,
  Flame,
  Car,
  Settings,
  Cpu,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Overview", icon: LayoutDashboard, view: "overview" as const },
  { label: "AI Assistant", icon: Bot, view: "assistant" as const },
  { label: "Air quality", icon: Wind, view: "air-quality" as const },
  { label: "Flood watch", icon: Waves, view: "flood-watch" as const },
  { label: "Fire & smoke", icon: Flame, view: "fire-smoke" as const },
  { label: "Traffic", icon: Car, view: "traffic" as const },
];

export function Sidebar({
  view,
  onViewChange,
}: {
  view: "overview" | "traffic" | "assistant" | "fire-smoke" | "air-quality" | "flood-watch";
  onViewChange: (
    view: "overview" | "traffic" | "assistant" | "fire-smoke" | "air-quality" | "flood-watch",
  ) => void;
}) {
  return (
    <aside className="panel sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col p-5 lg:flex">
      <div className="flex items-center gap-3">
        <div className="glow-ring flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Cpu className="size-5" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight">Smart AI City</p>
          <p className="text-xs text-muted-foreground">IoT control center</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map(({ label, icon: Icon, view: navView, badge }) => (
          <button
            key={label}
            type="button"
            onClick={() => navView && onViewChange(navView)}
            aria-current={navView === view ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              navView === view
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1 text-left">{label}</span>
            {badge ? (
              <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="rounded-xl border border-border bg-secondary/40 p-4">
        <p className="text-xs text-muted-foreground">Network health</p>
        <p className="font-display mt-1 text-2xl font-semibold text-success">98.4%</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/60">
          <div className="h-full w-[98%] rounded-full bg-success" />
        </div>
      </div>

      <button className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <Settings className="size-4" /> Settings
      </button>
    </aside>
  );
}
