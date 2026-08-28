import { describe, expect, it, vi } from "vitest";
import { AiApiError, audioUrl, chat, createAiEndpoints, latestMessages } from "./ai-assistant-api";

describe("AI assistant API helpers", () => {
  it("uses the traffic backend origin for AI endpoints", () => {
    expect(createAiEndpoints("https://city.example.test/")).toEqual({
      health: "https://city.example.test/api/ai/health",
      chat: "https://city.example.test/api/ai/chat",
      tts: "https://city.example.test/api/ai/tts",
      realtime: "wss://city.example.test/api/ai/realtime",
    });
  });

  it("keeps the latest twenty messages", () => {
    const messages = Array.from({ length: 21 }, (_, index) => ({
      role: "user" as const,
      content: String(index),
    }));
    expect(latestMessages(messages).map((message) => message.content)).toEqual(
      messages.slice(1).map((message) => message.content),
    );
  });

  it("surfaces safe backend failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: "AI chat is not configured." }), {
          status: 500,
        }),
      ),
    );
    await expect(chat("hello", [], false)).rejects.toEqual(
      new AiApiError("AI chat is not configured."),
    );
  });

  it("creates an MP3 URL only from valid audio", () => {
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:audio") });
    expect(audioUrl("AQI=", "audio/mpeg")).toBe("blob:audio");
    expect(audioUrl("not base64", "audio/mpeg")).toBeNull();
  });
});
