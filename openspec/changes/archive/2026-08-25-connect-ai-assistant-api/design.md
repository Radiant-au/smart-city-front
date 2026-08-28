## Context

`AiAssistantView` currently turns browser speech recognition into input text but selects a local mock reply. The adjacent FastAPI service already owns provider credentials and exposes `GET /api/ai/health`, `POST /api/ai/chat`, and `POST /api/ai/tts`; it accepts a text message, up to 20 prior user/assistant messages, and can return an optional base64 MP3. The dashboard already resolves that service from `VITE_TRAFFIC_API_ORIGIN` for camera REST, MJPEG, and WebSocket traffic data.

The dashboard has an unresolved merge conflict in `Sidebar.tsx`; implementation must preserve the existing overview/traffic interaction and AI Assistant route while resolving it before normal build/test results are considered meaningful.

## Goals / Non-Goals

**Goals:**

- Replace mock responses in the existing assistant tab with the backend typed-chat API.
- Preserve text input and browser speech recognition, including accessible pending/error feedback.
- Keep credentials on the FastAPI server and use the already-configured backend origin.
- Surface optional returned audio without making a failed TTS result discard a successful text reply.

**Non-Goals:**

- Recording audio in the browser or sending `POST /api/ai/voice` requests.
- Changing backend endpoints, provider models, CORS configuration, traffic camera contracts, or adding a frontend dependency.
- Persisting conversations, adding accounts, streaming tokens, or making city-data claims from the browser.

## Decisions

### Reuse the traffic API origin for AI endpoints

The client helper will derive `/api/ai/health`, `/api/ai/chat`, and `/api/ai/tts` from `getTrafficApiOrigin()`. This keeps a single local/production backend setting and avoids a second environment variable. A dedicated `VITE_AI_API_ORIGIN` is rejected because both API families are served by the same FastAPI app.

### Keep a narrow API helper separate from the component

A small `ai-assistant-api.ts` module will define request/response types, validate the JSON success/error envelope, and create audio from returned base64. `AiAssistantView` remains responsible for rendering, speech recognition, local message state, cancellation, and playback controls. This reuses the current `traffic-api.ts` pattern without adding a generic transport layer.

### Use typed chat for both keyboard and browser transcription

Final Web Speech transcripts continue to fill the input; submitting the input calls `POST /api/ai/chat` with `generateVoice` equal to the user’s audio preference. This avoids duplicate browser recording, upload limits, and STT behavior when browser transcription is already available. The client sends only the latest 20 prior display messages converted to `{ role, content }`, then appends the current text through the backend request field.

### Treat audio as optional output

The UI creates a short-lived `Blob`/object URL only for valid returned MP3 base64 and exposes a visible play/replay control. Automatic playback is attempted only when enabled and the request originated from a user action; a browser autoplay rejection leaves the text reply and replay control intact. Object URLs are revoked when replaced or on unmount. No audio is stored in application state or local storage.

### One in-flight request

Disable chat submission and the microphone send path while a request is pending, attach an `AbortController`, and abort on unmount. This prevents message ordering errors and provides a small, deterministic behavior without introducing a request queue.

## Risks / Trade-offs

- [The backend is unreachable or missing credentials] → Query safe health state, show the backend error from the request, and retain the user’s typed text for retry.
- [Browser autoplay blocks returned TTS] → Keep playback user-initiated through a replay button; text success remains complete.
- [A backend response is malformed or oversized] → Accept only the documented JSON success shape and present a safe frontend error; do not render arbitrary response fields.
- [The existing `Sidebar.tsx` conflict breaks the app before AI integration] → Resolve the conflict as a prerequisite and verify route and view navigation with the smallest focused test.
