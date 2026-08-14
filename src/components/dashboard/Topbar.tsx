import { Bell, Search, RadioTower } from "lucide-react";

export function Topbar({ time }: { time: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="pulse-dot inline-block size-2 rounded-full bg-success" />
          Live telemetry · {time}
        </div>
        <h1 className="font-display mt-1 text-2xl font-semibold sm:text-3xl">City Operations</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground md:flex">
          <Search className="size-4" />
          <input
            placeholder="Search sensors, zones…"
            className="w-48 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition-colors hover:text-foreground">
          <Bell className="size-4" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive" />
        </button>
        <div className="glow-ring flex items-center gap-2 rounded-xl bg-primary/12 px-3 py-2 text-sm text-primary">
          <RadioTower className="size-4" />
          <span className="font-medium">472 nodes</span>
        </div>
      </div>
    </header>
  );
}
