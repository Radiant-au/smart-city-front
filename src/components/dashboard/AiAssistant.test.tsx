// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiAssistantView } from "./AiAssistant";

const api = vi.hoisted(() => ({
  fetchAiHealth: vi.fn(),
  chat: vi.fn(),
  textToSpeech: vi.fn(),
  audioUrl: vi.fn(),
}));

vi.mock("@/lib/ai-assistant-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai-assistant-api")>()),
  ...api,
}));

describe("AiAssistantView", () => {
  beforeEach(() => {
    api.fetchAiHealth.mockResolvedValue({ dashscopeConfigured: true });
    api.chat.mockResolvedValue({
      reply: "Backend reply",
      ttsAvailable: false,
      audioBase64: null,
      audioMimeType: null,
    });
    api.textToSpeech.mockResolvedValue("AQI=");
    api.audioUrl.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("sends typed text and displays the backend reply", async () => {
    render(<AiAssistantView />);
    fireEvent.change(screen.getByPlaceholderText(/Ask about/i), {
      target: { value: "How is traffic?" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form")!);

    await waitFor(() =>
      expect(api.chat).toHaveBeenCalledWith(
        "How is traffic?",
        expect.any(Array),
        true,
        expect.any(AbortSignal),
      ),
    );
    expect(await screen.findByText("Backend reply")).toBeTruthy();
  });

  it("keeps a text reply when TTS is unavailable", async () => {
    render(<AiAssistantView />);
    fireEvent.change(screen.getByPlaceholderText(/Ask about/i), { target: { value: "Hello" } });
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form")!);

    expect(await screen.findByText("Backend reply")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Play voice/i })).toHaveLength(2);
  });

  it("prevents duplicate sends while pending and shows a safe error", async () => {
    let reject!: (reason: Error) => void;
    api.chat.mockImplementation(
      () =>
        new Promise((_, rejectRequest) => {
          reject = rejectRequest;
        }),
    );
    render(<AiAssistantView />);
    const input = screen.getByPlaceholderText(/Ask about/i);
    fireEvent.change(input, { target: { value: "Help" } });
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form")!);
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form")!);
    expect(api.chat).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toContain("responding");

    await act(async () => reject(new Error("network")));
    expect((await screen.findByRole("alert")).textContent).toContain("AI backend is unavailable.");
  });
});
