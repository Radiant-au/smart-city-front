## 1. Fire and Smoke Surveillance Layout

- [x] 1.1 Replace the generic fire/smoke camera-card layout in `FireSmokePanel` with a responsive featured surveillance stage using the existing filtered camera data and stream endpoint.
- [x] 1.2 Add live/offline, clear/hazard, fire count, smoke count, frame-rate, and camera identity presentation using existing theme tokens and Lucide icons.
- [x] 1.3 Preserve loading, reconnecting, backend error, no-camera, and stream-failure states with meaningful accessible text.

## 2. Verification

- [x] 2.1 Update `Panels.test.tsx` with focused checks for connected clear, detected hazard, no-camera, stream-failure, and backend-error states.
- [x] 2.2 Run the focused panel tests, lint, and production build; fix only regressions caused by this change.
