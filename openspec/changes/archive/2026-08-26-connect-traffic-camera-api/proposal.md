## Why

The Traffic dashboard is currently a static hourly-congestion chart, so operators cannot see the live annotated camera feeds or the vehicle and connection state already produced by the car-detection backend. Connecting it now makes the two active cameras useful immediately while ensuring the interface is ready for two additional cameras when they are configured.

## What Changes

- Replace the static Traffic panel with a live traffic-camera view containing four consistent camera slots.
- Connect the dashboard to the car-detection service's camera-status API, MJPEG stream URLs, and traffic WebSocket updates through configurable backend URLs.
- Show each available camera's live feed, name, connection state, vehicle count, traffic level, FPS, and connection/detection error when provided.
- Reserve unavailable slots for future cameras with an explicit "awaiting camera" state; do not fabricate streams or traffic telemetry for them.
- Keep the dashboard resilient when the backend is unreachable, a camera is offline, or WebSocket updates disconnect.

## Capabilities

### New Capabilities

- `live-traffic-camera-monitoring`: Displays up to four backend-powered traffic camera views and their current traffic telemetry with clear available, offline, loading, and future-camera states.
- `traffic-backend-connection`: Configures and maintains client-side REST, MJPEG, and WebSocket communication with the car-detection backend without coupling the UI to fixed deployment URLs.

### Modified Capabilities

- None.

## Impact

- Affects `src/components/dashboard/Panels.tsx` and the dashboard's traffic presentation, likely adding focused traffic API/types/hooks/components under `src/`.
- Consumes the existing backend contracts: `GET /api/cameras`, `GET /stream/{camera_id}`, and `WS /ws/traffic` from `../ai-car-detection`.
- Requires deployment configuration for the backend HTTP origin; the matching WebSocket origin and MJPEG URLs are derived from it.
- Does not require a backend change for the initial two cameras; future cameras become visible when the backend includes them in `/api/cameras`.
