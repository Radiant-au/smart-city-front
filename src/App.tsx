import { useState } from "react";
import { Dashboard } from "./routes";

export default function App() {
  const [view, setView] = useState<
    "overview" | "traffic" | "assistant" | "fire-smoke" | "air-quality" | "flood-watch"
  >("overview");

  return <Dashboard view={view} onViewChange={setView} />;
}
