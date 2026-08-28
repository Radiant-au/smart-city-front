## Why

The existing AI Assistant tab records browser speech but returns rotating demo replies, even though the adjacent FastAPI backend already provides safe typed chat, voice transcription, and optional speech output. Connecting the tab now makes it useful without moving provider credentials into the browser or changing the established traffic integration.

## What Changes

- Replace simulated chat replies with calls to the backend `POST /api/ai/chat` endpoint.
- Send the bounded in-browser conversation history with each request and show backend-safe errors in the existing chat panel.
- Use the existing speech-recognition transcript as typed chat input; do not add browser audio recording or invoke the backend voice-upload endpoint in this change.
- Play optional MP3 audio returned by chat, with a user control to turn automatic playback on or off.
- Remove UI copy that calls the assistant a demo and show backend configuration/availability state from `GET /api/ai/health`.

## Capabilities

### New Capabilities

- `ai-assistant-backend-integration`: The dashboard AI Assistant tab sends typed and browser-transcribed messages to the existing backend AI chat API and presents text, voice, and safe failure states.

### Modified Capabilities

- None.

## Impact

- Affects `src/components/dashboard/AiAssistant.tsx`, `src/routes/ai-assistant.tsx`, and a small frontend API helper/test file.
- Reuses `VITE_TRAFFIC_API_ORIGIN` to target the existing FastAPI server; no provider credential, dependency, or backend endpoint changes.
- Implementation must resolve the pre-existing merge conflict in `src/components/dashboard/Sidebar.tsx` before normal frontend verification can be trusted, without overwriting either intended navigation behavior.
