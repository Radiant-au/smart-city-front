## 1. Traffic backend client foundation

- [x] 1.1 Document `VITE_TRAFFIC_API_ORIGIN`, its local-development value, production CORS requirements, and HTTPS/WSS deployment expectations.
- [x] 1.2 Add typed, defensive normalization for the backend `/api/cameras` snapshot and `traffic_update` WebSocket payload, including car-specific and generic camera status fields.
- [x] 1.3 Add URL helpers that derive status, MJPEG stream, and WebSocket endpoints from the one configured backend origin, including trailing-slash and HTTP-to-WS handling.
- [x] 1.4 Add client-side tests for endpoint construction and malformed/partial status payload handling.

## 2. Live traffic synchronization

- [x] 2.1 Implement a browser-only traffic monitor hook that loads the initial REST snapshot and exposes loading, stale, and recoverable backend-error state.
- [x] 2.2 Connect the hook to `/ws/traffic`, apply valid status updates, and release the connection and timers during component cleanup.
- [x] 2.3 Add bounded WebSocket reconnection and lower-frequency REST refresh fallback while real-time updates are unavailable.
- [x] 2.4 Test initial loading, live WebSocket update, reconnect/fallback behavior, and SSR-safe initialization with mocked browser APIs.

## 3. Four-camera Traffic interface

- [x] 3.1 Replace the static `TrafficPanel` chart with a responsive four-slot camera grid backed by the traffic monitor hook.
- [x] 3.2 Implement a registered-camera card with annotated MJPEG feed, identity, connection badge, vehicle count, traffic level, FPS, backend error, and stream-load failure state.
- [x] 3.3 Implement stable reserved future-camera cards, explicit backend-unavailable/loading/stale states, and an overflow notice for more than four backend cameras.
- [x] 3.4 Verify the Traffic panel with mocked two-camera, offline-camera, four-camera, and unreachable-backend states at desktop and mobile widths.

## 4. Integration verification

- [x] 4.1 Start the existing FastAPI backend with its two configured cameras and confirm the dashboard reads `/api/cameras`, displays both MJPEG streams, and receives `/ws/traffic` updates.
- [x] 4.2 Confirm the dashboard remains usable when the backend, a camera, or a camera stream is unavailable and that it recovers when status updates return.
- [x] 4.3 Run the dashboard lint and production build, then record the verification results and any backend deployment/CORS configuration still required.
