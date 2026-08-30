import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff, Send, User, Volume2 } from "lucide-react";
import {
  AiApiError,
  audioUrl,
  chat,
  createAiEndpoints,
  fetchAiHealth,
  textToSpeech,
  type AiMessage,
} from "@/lib/ai-assistant-api";
import { cn } from "@/lib/utils";

type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  time: string;
  audioUrl?: string;
};
type PendingRequest = { text: string; messages: AiMessage[]; existingUser: boolean };

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const realtimeInputConstraints = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
const realtimeOutputGain = 1.35;

function eventText(event: Record<string, unknown>) {
  return typeof event.delta === "string"
    ? event.delta
    : typeof event.transcript === "string"
      ? event.transcript
      : "";
}

function pcm16(samples: Float32Array, inputRate: number) {
  const outputLength = Math.round((samples.length * 16_000) / inputRate);
  const output = new Int16Array(outputLength);
  for (let index = 0; index < outputLength; index++) {
    const sample = samples[Math.min(samples.length - 1, Math.floor((index * inputRate) / 16_000))];
    output[index] = Math.max(-1, Math.min(1, sample)) * 0x7fff;
  }
  return output.buffer;
}

function pcm24k(base64: string, context: AudioContext) {
  const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0));
  const audio = context.createBuffer(1, Math.floor(bytes.length / 2), 24_000);
  const channel = audio.getChannelData(0);
  for (let index = 0; index < channel.length; index++) {
    const value = bytes[index * 2] | (bytes[index * 2 + 1] << 8);
    channel[index] = (value & 0x8000 ? value - 0x10000 : value) / 0x8000;
  }
  return audio;
}

export function AiAssistantView() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hi! I'm your Smart City assistant. Ask me about air quality, floods, traffic or energy — or just tap the mic and speak.",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<"loading" | "online" | "setup" | "unavailable">("loading");
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputTimeRef = useRef(0);
  const realtimeReplyRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const audioUrlsRef = useRef<string[]>([]);
  const failedRequestRef = useRef<PendingRequest | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAiHealth(controller.signal)
      .then(({ dashscopeConfigured }) => {
        setHealth(dashscopeConfigured ? "online" : "setup");
      })
      .catch(() => {
        if (!controller.signal.aborted) setHealth("unavailable");
      });
    return () => controller.abort();
  }, []);

  useEffect(
    () => () => {
      requestRef.current?.abort();
      socketRef.current?.close();
      processorRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void inputContextRef.current?.close();
      outputGainRef.current?.disconnect();
      void outputContextRef.current?.close();
      audioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const stopRealtime = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void inputContextRef.current?.close();
    inputContextRef.current = null;
    outputGainRef.current?.disconnect();
    outputGainRef.current = null;
    void outputContextRef.current?.close();
    outputContextRef.current = null;
    outputTimeRef.current = 0;
    setListening(false);
    setInterim("");
  }, []);

  const startRealtime = useCallback(async () => {
    if (listening || isPending) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: realtimeInputConstraints });
      const inputContext = new AudioContext();
      const outputContext = outputContextRef.current ?? new AudioContext();
      const outputGain = outputContext.createGain();
      outputGain.gain.value = realtimeOutputGain;
      outputGain.connect(outputContext.destination);
      outputContextRef.current = outputContext;
      outputGainRef.current = outputGain;
      await outputContext.resume();
      const socket = new WebSocket(createAiEndpoints().realtime);
      socket.binaryType = "arraybuffer";
      streamRef.current = stream;
      inputContextRef.current = inputContext;
      socketRef.current = socket;
      socket.onopen = () => {
        const source = inputContext.createMediaStreamSource(stream);
        const processor = inputContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = ({ inputBuffer }) => {
          if (socket.readyState === WebSocket.OPEN)
            socket.send(pcm16(inputBuffer.getChannelData(0), inputContext.sampleRate));
        };
        source.connect(processor);
        processor.connect(inputContext.destination);
        processorRef.current = processor;
        setListening(true);
      };
      socket.onmessage = ({ data }) => {
        if (typeof data !== "string") return;
        try {
          const event: unknown = JSON.parse(data);
          if (!event || typeof event !== "object" || Array.isArray(event)) return;
          const message = event as Record<string, unknown>;
          const type = message.type;
          if (type === "conversation.item.input_audio_transcription.delta")
            setInterim((current) => current + eventText(message));
          if (type === "conversation.item.input_audio_transcription.completed") {
            const text = eventText(message).trim();
            if (text)
              setMessages((current) => [
                ...current,
                { id: Date.now(), role: "user", text, time: now() },
              ]);
            setInterim("");
          }
          if (type === "response.audio_transcript.delta")
            realtimeReplyRef.current += eventText(message);
          if (type === "response.audio_transcript.done")
            realtimeReplyRef.current = eventText(message) || realtimeReplyRef.current;
          if (type === "response.audio.delta" && typeof message.delta === "string") {
            const audio = pcm24k(message.delta, outputContext);
            const source = outputContext.createBufferSource();
            source.buffer = audio;
            source.connect(outputGain);
            outputTimeRef.current = Math.max(outputTimeRef.current, outputContext.currentTime);
            source.start(outputTimeRef.current);
            outputTimeRef.current += audio.duration;
          }
          if (type === "response.done" && realtimeReplyRef.current.trim()) {
            const text = realtimeReplyRef.current.trim();
            realtimeReplyRef.current = "";
            setMessages((current) => [
              ...current,
              { id: Date.now(), role: "assistant", text, time: now() },
            ]);
          }
        } catch {
          setError("AI realtime returned an invalid response.");
        }
      };
      socket.onerror = () => setError("AI realtime voice is unavailable.");
      socket.onclose = () => {
        if (socketRef.current === socket) stopRealtime();
      };
    } catch {
      stopRealtime();
      setError("Microphone access is required for realtime voice.");
    }
  }, [isPending, listening, stopRealtime]);

  const play = (url: string) => {
    const audio = new Audio(url);
    audio.volume = 1;
    void audio.play().catch(() => undefined);
  };

  const send = async ({ text, messages: history, existingUser }: PendingRequest) => {
    if (isPending) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setIsPending(true);
    setError(null);
    if (!existingUser) {
      setMessages((current) => [...current, { id: Date.now(), role: "user", text, time: now() }]);
    }
    setInput("");
    try {
      const result = await chat(text, history, voiceEnabled, controller.signal);
      const url = audioUrl(result.audioBase64, result.audioMimeType);
      if (url) audioUrlsRef.current.push(url);
      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          role: "assistant",
          text: result.reply,
          time: now(),
          ...(url ? { audioUrl: url } : {}),
        },
      ]);
      failedRequestRef.current = null;
      if (url && voiceEnabled) play(url);
    } catch (reason) {
      if (!controller.signal.aborted) {
        const message =
          reason instanceof AiApiError ? reason.message : "AI backend is unavailable.";
        setError(message);
        setInput(text);
        failedRequestRef.current = { text, messages: history, existingUser: true };
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsPending(false);
      }
    }
  };

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text || isPending) return;
    void send({
      text,
      messages: messages.map(({ role, text: content }) => ({ role, content })),
      existingUser: false,
    });
  };

  const replay = async (message: Msg) => {
    if (message.audioUrl) return play(message.audioUrl);
    if (isPending) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setIsPending(true);
    setError(null);
    try {
      const url = audioUrl(await textToSpeech(message.text, controller.signal), "audio/mpeg");
      if (!url) throw new AiApiError("AI voice output is unavailable.");
      audioUrlsRef.current.push(url);
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? { ...item, audioUrl: url } : item)),
      );
      play(url);
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(reason instanceof AiApiError ? reason.message : "AI voice output is unavailable.");
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsPending(false);
      }
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Voice panel */}
      <section className="panel flex flex-col p-5">
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold">Voice recognition</h2>
          <p className="text-xs text-muted-foreground">Realtime AI voice · English</p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
          <button
            onClick={() => void (listening ? stopRealtime() : startRealtime())}
            disabled={isPending}
            aria-label={listening ? "Stop listening" : "Start listening"}
            className={cn(
              "relative flex size-28 items-center justify-center rounded-full border border-border transition-all disabled:opacity-40",
              listening
                ? "glow-ring bg-primary/20 text-primary"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {listening ? <Mic className="size-10" /> : <MicOff className="size-10" />}
            {listening ? (
              <span className="pulse-dot absolute -inset-2 -z-10 rounded-full bg-primary/25 blur-lg" />
            ) : null}
          </button>

          <p className={cn("text-sm", listening ? "text-primary" : "text-muted-foreground")}>
            {listening ? "Listening…" : "Tap to start speaking"}
          </p>

          <div className="flex h-12 items-end gap-1.5" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 rounded-full transition-all",
                  listening ? "wave-bar bg-primary" : "h-1.5 bg-secondary",
                )}
                style={listening ? { animationDelay: `${i * 70}ms` } : undefined}
              />
            ))}
          </div>

          <button
            onClick={() => void (listening ? stopRealtime() : startRealtime())}
            disabled={isPending}
            className={cn(
              "rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40",
              listening
                ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                : "bg-primary/15 text-primary hover:bg-primary/25",
            )}
          >
            {listening ? "Stop listening" : "Start listening"}
          </button>

          <p className="min-h-5 max-w-sm text-center text-xs text-muted-foreground/80">
            {interim || "Speak naturally; your transcript and reply appear in the chat."}
          </p>
        </div>
      </section>

      {/* Chat panel */}
      <section className="panel flex h-[560px] flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">AI chat</h2>
            <p className="text-xs text-muted-foreground">
              City intelligence assistant · backend chat
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium",
              health === "online"
                ? "bg-success/12 text-success"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {health === "online"
              ? "Online"
              : health === "setup"
                ? "Setup required"
                : health === "loading"
                  ? "Checking…"
                  : "Unavailable"}
          </span>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex items-start gap-2.5", m.role === "user" && "flex-row-reverse")}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                  m.role === "user"
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary/60 text-muted-foreground",
                )}
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </span>
              <div className={cn("max-w-[80%]", m.role === "user" && "text-right")}>
                <div
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-secondary/35 text-foreground",
                  )}
                >
                  {m.text}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{m.time}</p>
                {m.role === "assistant" ? (
                  <button
                    type="button"
                    onClick={() => void replay(m)}
                    disabled={isPending}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary disabled:opacity-40"
                  >
                    <Volume2 className="size-3" /> {m.audioUrl ? "Replay" : "Play voice"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about air quality, floods, traffic…"
            className="flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            aria-label="Send message"
            className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(event) => setVoiceEnabled(event.target.checked)}
          />
          Play voice replies
        </label>
        {isPending ? (
          <p role="status" className="mt-2 text-xs text-muted-foreground">
            Assistant is responding…
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}{" "}
            {failedRequestRef.current ? (
              <button
                type="button"
                className="underline"
                onClick={() => failedRequestRef.current && void send(failedRequestRef.current)}
              >
                Retry
              </button>
            ) : null}
          </p>
        ) : null}
      </section>
    </div>
  );
}
