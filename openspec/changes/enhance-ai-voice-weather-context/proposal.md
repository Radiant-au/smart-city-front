## Why

Realtime voice remains open or mis-detects speech when nearby noise prevents a clean turn boundary, and its spoken replies are too quiet and generic. The assistant also cannot reliably answer current weather or air-quality questions from the city backend data already used by the dashboard.

## What Changes

- Request browser microphone noise suppression, echo cancellation, and automatic gain control, and make noisy-session/turn-completion failures clear and recoverable.
- Tune backend realtime turn detection so normal nearby noise does not keep a voice turn open indefinitely, while retaining the existing manual stop control.
- Make assistant replies short, plain, and easy to understand when spoken, without omitting the key value, unit, status, or warning.
- Increase voice playback gain through the existing browser audio pipeline and keep typed replies available if playback fails.
- Give typed and realtime assistant paths access to current backend weather and air-quality data; weather questions use current weather data and air-quality questions use the current AQI, status, pollutants, and observation time.
- Return an honest unavailable/stale answer when city data cannot be retrieved instead of inventing a current value.

## Capabilities

### New Capabilities

- `assistant-live-city-context`: Current weather and air-quality questions are answered from backend-owned city data with freshness and unavailable-state handling.

### Modified Capabilities

- `ai-assistant-backend-integration`: Realtime microphone handling, turn completion, spoken-response style, and playback loudness become reliable and voice-oriented.

## Impact

- Affects the existing AI assistant component and API helper, plus focused frontend tests.
- Requires the configured AI backend's chat and realtime session handling to retrieve or accept the existing air/weather backend contract without exposing provider or weather credentials to the browser.
- Reuses `VITE_TRAFFIC_API_ORIGIN`, `VITE_AIR_FLOOD_API_ORIGIN`, Web Audio, browser media constraints, and the current dashboard air-data shapes; no new frontend dependency or duplicate public weather API is introduced.
