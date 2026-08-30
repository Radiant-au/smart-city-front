## 1. Confirm Backend Contracts

- [x] 1.1 Identify the deployed AI backend source and document its current chat, realtime session, system-instruction, and server-VAD configuration points.
- [x] 1.2 Identify the existing backend current-weather and air-quality endpoints, fields, timestamps, and freshness rules; do not add another public weather provider.

## 2. Ground Assistant Responses in Current City Data

- [x] 2.1 Add one backend resolver for weather and air-quality intent that fetches and normalizes the existing current data with a bounded timeout.
- [x] 2.2 Use the resolver in typed chat and realtime final-transcript handling, including stale, missing-field, and unavailable responses that never fabricate values.
- [x] 2.3 Add focused backend checks for current weather, current AQI/pollutants, stale observations, null fields, upstream timeout, and equivalent typed/realtime grounding.

## 3. Improve Voice Input and Turn Completion

- [x] 3.1 Update the existing microphone request to prefer mono echo cancellation, noise suppression, and automatic gain control while preserving retry and manual stop behavior.
- [x] 3.2 Add configurable realtime server-VAD threshold and silence duration at the existing backend session setup, with defaults calibrated for ordinary nearby noise.
- [x] 3.3 Add focused checks for requested microphone constraints, unsupported-constraint fallback, cleanup, and backend VAD session configuration.

## 4. Make Replies Shorter, Clearer, and Louder

- [x] 4.1 Apply one shared backend response instruction for concise, plain spoken answers with units, status, freshness, and warnings only when relevant.
- [x] 4.2 Route realtime PCM playback through one conservative Web Audio gain node and maximize the existing MP3 audio element volume without changing text-first fallback behavior.
- [x] 4.3 Add focused checks for the response instruction, gain routing, ordered playback, and retained text when audio fails.

## 5. Verify End to End

- [x] 5.1 Run focused frontend and backend tests, then the existing frontend test, lint, build, and OpenSpec validation gates.
- [ ] 5.2 Smoke-test in a supported browser with quiet speech and nearby steady noise, confirming automatic completion, manual stop, louder output, and retry behavior.
- [ ] 5.3 Ask current-weather and air-quality questions in typed and realtime modes against live backend data, then repeat with the city-data backend unavailable and record the distinction between local checks and live proof.
