import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { id: number; role: "user" | "assistant"; text: string; time: string };

const mockReplies = [
  "Air quality in the Harbour district is moderate (AQI 72). PM2.5 is trending up 6% over the last hour.",
  "River level is 3.2 m — 0.4 m below the flood alert threshold. No action needed right now.",
  "Congestion is easing on Ring Road. Junction B is still at 78% — I can reroute signal timing if you want.",
  "3 smoke events detected today, all confirmed as controlled burns outside the city limits.",
  "The grid is running on 41% renewables right now. Solar output peaks in about two hours.",
];

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyIndex = useRef(0);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      let finalText = "";
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else pending += r[0].transcript;
      }
      setInterim(pending);
      if (finalText.trim()) {
        setInput((prev) => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = rec;
    return () => {
      rec.onresult = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const toggleListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
      return;
    }
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [listening]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const userMsg: Msg = { id: Date.now(), role: "user", text, time: now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const reply = mockReplies[replyIndex.current % mockReplies.length] ?? mockReplies[0]!;
    replyIndex.current += 1;
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "assistant", text: reply, time: now() },
      ]);
    }, 700);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Voice panel */}
      <section className="panel flex flex-col p-5">
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold">Voice recognition</h2>
          <p className="text-xs text-muted-foreground">
            {supported ? "Browser speech-to-text · English (US)" : "Speech recognition unavailable in this browser"}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
          <button
            onClick={toggleListening}
            disabled={!supported}
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
            onClick={toggleListening}
            disabled={!supported}
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
            {interim || (input ? `Recognized: ${input}` : "Recognized speech is placed into the chat input.")}
          </p>
        </div>
      </section>

      {/* Chat panel */}
      <section className="panel flex h-[560px] flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">AI chat</h2>
            <p className="text-xs text-muted-foreground">City intelligence assistant · demo responses</p>
          </div>
          <span className="rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-medium text-success">
            Online
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
                  m.role === "user" ? "bg-primary/15 text-primary" : "bg-secondary/60 text-muted-foreground",
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
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
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
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
