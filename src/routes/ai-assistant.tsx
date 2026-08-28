import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { AiAssistantView } from "@/components/dashboard/AiAssistant";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant · Smart AI City Dashboard" },
      {
        name: "description",
        content:
          "Talk to the Smart AI City assistant: voice recognition with live waveform plus an AI chat panel for air quality, flood, traffic and energy questions.",
      },
      { property: "og:title", content: "AI Assistant · Smart AI City Dashboard" },
      {
        property: "og:description",
        content: "Voice-driven city intelligence assistant for the Smart AI City IoT dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiAssistantPage,
});

function AiAssistantPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1500px] gap-6 px-4 py-6 sm:px-6">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-6">
        <Topbar time="Aug 24, 15:44 UTC" title="AI Assistant" />
        <AiAssistantView />
        <p className="pb-4 text-center text-xs text-muted-foreground">
          Smart AI City · AI responses are provided by the configured backend
        </p>
      </div>
    </main>
  );
}
