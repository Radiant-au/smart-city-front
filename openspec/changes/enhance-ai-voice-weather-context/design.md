## Context

The assistant currently streams microphone PCM to `WS /api/ai/realtime`, schedules returned 24 kHz PCM directly to an `AudioContext`, and uses `POST /api/ai/chat` for typed requests. Microphone capture requests only mono audio, realtime turn completion is controlled by the AI backend/provider, and playback has no gain control. Separately, the dashboard already reads current air data from the configured air/flood backend, including AQI, pollutant values, status, and timestamps.

This change crosses the browser, AI backend, and existing city-data backend. The deployed source is `../smart-city-backend`: `app/ai.py` owns chat, realtime session setup, and tool calls; `app/api/app.py` forwards realtime tool outputs; `app/air_pollution/weather_service.py` owns the server-held OpenWeather calls. Current air is available through `GET /api/air/current` and `GET /api/dashboard/latest`; weather now uses the same server-held OpenWeather configuration through the AI resolver. Provider credentials and current-data retrieval remain server-side.

## Goals / Non-Goals

**Goals:**

- Complete normal voice turns despite low-level nearby noise.
- Produce concise, plain-language responses optimized for speech.
- Make realtime speech audibly louder without changing provider audio formats.
- Answer current weather and air-quality questions from backend data with freshness information.
- Keep failures recoverable and current-data answers honest.

**Non-Goals:**

- Perfect recognition in loud environments or client-side machine-learning noise removal.
- A new weather provider, browser-held provider credentials, or duplicate frontend weather polling.
- Long reports, configurable personalities, multilingual voice, or a general plugin/tool framework.

## Decisions

### Use native microphone processing and tune server VAD

Request mono audio with `noiseSuppression`, `echoCancellation`, and `autoGainControl`. Keep the existing PCM/WebSocket pipeline and manual stop button. Configure the backend realtime session with a moderately stricter server-VAD threshold and finite silence duration so background noise is less likely to extend a turn forever.

This uses browser and provider features already in the flow. A client-side denoising library or custom voice-activity detector would add weight and tuning surfaces before native processing has been shown insufficient.

### Apply a fixed Web Audio gain for realtime output

Connect realtime buffer sources through one `GainNode` before the output destination. Use a conservative fixed gain with clipping-safe browser output; keep device volume under the user's control. Existing MP3 replies continue through the current audio element path, with its volume set to the maximum valid element volume.

A new volume UI is deferred because the request is for louder output, not per-user audio mixing controls.

### Set one concise spoken-response policy on the backend

The backend system instruction for chat and realtime responses will require short, plain sentences suitable for speech. A current-data answer includes the important value, unit, status, observation time/freshness, and one warning only when relevant. This keeps typed and voice behavior aligned and avoids fragile frontend truncation.

### Resolve weather and air intent against backend-owned data

The AI backend will classify only the two requested current-data intents: weather and air quality. Before model generation, it will retrieve the applicable current payload through the existing backend service/API boundary. Weather uses current weather fields; air quality uses AQI, status, pollutants, and observation time. The normalized facts are added to the request/session context, and instructions forbid inventing absent values.

This is deliberately a small intent branch rather than a general tool framework. Calling a public weather API from the browser was rejected because it duplicates existing backend integration and risks exposing credentials. Sending a dashboard snapshot with every chat request was rejected because realtime sessions also need the data and the browser may hold stale state.

### Share the same current-data resolver across typed and realtime paths

Typed chat calls the resolver for each weather/air question. Realtime uses the same resolver when a final user transcript identifies either intent, then supplies the facts before creating the response. Both paths surface a short unavailable or stale-data answer when retrieval fails or freshness exceeds the backend's existing acceptable window.

## Risks / Trade-offs

- [Browser audio constraints are best-effort and device-dependent] → Retain manual stop, clear status, and focused browser smoke checks.
- [Higher output gain can clip already-loud audio] → Start with a conservative fixed gain and test representative provider output before raising it.
- [Stricter VAD can cut off quiet speakers] → Keep threshold and silence duration in backend configuration so they can be calibrated without frontend changes.
- [The AI and city-data APIs may run as separate services] → Keep retrieval server-to-server with timeouts and safe unavailable responses; do not couple UI rendering to that request.
- [Keyword intent matching has a narrow ceiling] → Cover weather and air-quality phrasing now; add model tool calling only when more live domains are requested.

## Migration Plan

1. Add focused frontend checks for requested media constraints, louder realtime routing, and preserved fallback behavior.
2. Add the shared backend current-data resolver and tests for weather, air quality, stale data, and upstream failure.
3. Apply the concise response policy and VAD settings to typed and realtime sessions.
4. Deploy the backend first, then the compatible frontend; verify with quiet speech, nearby steady noise, current weather, current AQI, and an unavailable city-data backend.
5. Roll back the frontend independently; backend additions remain compatible with existing clients.

## Open Questions

- Calibrate the initial VAD threshold, silence duration, and playback gain against the actual microphone, speaker, and deployment room rather than treating defaults as hardware proof.
