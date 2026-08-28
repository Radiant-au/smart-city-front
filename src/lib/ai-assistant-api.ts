import { getTrafficApiOrigin } from "@/lib/traffic-api";

export type AiMessage = { role: "user" | "assistant"; content: string };
export type AiHealth = { dashscopeConfigured: boolean };
export type AiReply = {
  reply: string;
  ttsAvailable: boolean;
  audioBase64: string | null;
  audioMimeType: string | null;
};

type AiEndpoints = { health: string; chat: string; tts: string; realtime: string };

export class AiApiError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(payload: unknown, fallback: string) {
  return isRecord(payload) && typeof payload.error === "string" && payload.error.trim()
    ? payload.error
    : fallback;
}

async function responseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AiApiError("AI backend returned an invalid response.");
  }
}

function requireSuccess(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload) || payload.success !== true) {
    throw new AiApiError(errorMessage(payload, "AI request failed."));
  }
  return payload;
}

export function createAiEndpoints(configuredOrigin?: string): AiEndpoints {
  const origin = getTrafficApiOrigin(configuredOrigin);
  const realtime = new URL(origin);
  realtime.protocol = realtime.protocol === "https:" ? "wss:" : "ws:";
  return {
    health: `${origin}/api/ai/health`,
    chat: `${origin}/api/ai/chat`,
    tts: `${origin}/api/ai/tts`,
    realtime: `${realtime.origin}/api/ai/realtime`,
  };
}

export function latestMessages(messages: AiMessage[]): AiMessage[] {
  return messages.slice(-20);
}

export async function fetchAiHealth(signal?: AbortSignal): Promise<AiHealth> {
  const response = await fetch(createAiEndpoints().health, { signal });
  const payload = await responseJson(response);
  if (!response.ok)
    throw new AiApiError(errorMessage(payload, `AI backend returned ${response.status}.`));
  const data = requireSuccess(payload);
  if (typeof data.dashscopeConfigured !== "boolean") {
    throw new AiApiError("AI backend returned an invalid response.");
  }
  return {
    dashscopeConfigured: data.dashscopeConfigured,
  };
}

async function post(
  path: string,
  body: object,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const payload = await responseJson(response);
  if (!response.ok)
    throw new AiApiError(errorMessage(payload, `AI backend returned ${response.status}.`));
  return requireSuccess(payload);
}

function readReply(payload: Record<string, unknown>): AiReply {
  if (typeof payload.reply !== "string" || !payload.reply.trim()) {
    throw new AiApiError("AI backend returned an invalid response.");
  }
  return {
    reply: payload.reply,
    ttsAvailable: payload.ttsAvailable === true,
    audioBase64: typeof payload.audioBase64 === "string" ? payload.audioBase64 : null,
    audioMimeType: typeof payload.audioMimeType === "string" ? payload.audioMimeType : null,
  };
}

export function chat(
  text: string,
  messages: AiMessage[],
  generateVoice: boolean,
  signal?: AbortSignal,
) {
  return post(
    createAiEndpoints().chat,
    { text, messages: latestMessages(messages), generateVoice },
    signal,
  ).then(readReply);
}

export async function textToSpeech(text: string, signal?: AbortSignal): Promise<string> {
  const payload = await post(createAiEndpoints().tts, { text }, signal);
  if (typeof payload.audioBase64 !== "string" || payload.audioMimeType !== "audio/mpeg") {
    throw new AiApiError("AI backend returned an invalid response.");
  }
  return payload.audioBase64;
}

export function audioUrl(audioBase64: string | null, mimeType: string | null): string | null {
  if (!audioBase64 || mimeType !== "audio/mpeg") return null;
  try {
    const bytes = Uint8Array.from(atob(audioBase64), (char) => char.charCodeAt(0));
    return bytes.length ? URL.createObjectURL(new Blob([bytes], { type: mimeType })) : null;
  } catch {
    return null;
  }
}
