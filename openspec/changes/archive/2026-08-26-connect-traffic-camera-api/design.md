## Context

The dashboard is a TanStack Start/Vite React application whose `TrafficPanel` currently renders mock congestion data. The adjacent FastAPI car-detection service already owns two `car` cameras and supplies three compatible read interfaces: `GET /api/cameras` for a keyed status snapshot, `GET /stream/{camera_id}` for an annotated MJPEG feed, and `WS /ws/traffic` for full status snapshots every 0.5 seconds. Its camera registry can grow without a frontend API change, but only two cameras are currently configured.

The backend is separately deployed and must remain the owner of camera connections, YOLO inference, frame annotation, and traffic calculations. The dashboard needs a deployment-safe origin rather than a localhost value compiled into UI code. The existing CORS configuration allows Vite development origins; production deployment will need its actual dashboard origin added to the backend configuration.

## Goals / Non-Goals

**Goals:**

- Replace the mock Traffic panel with four readable live-camera slots.
- Present genuine backend status and MJPEG streams for currently registered cameras.
- Keep two future slots visible and explicit while only two backend cameras exist.
- Make REST, MJPEG, and WebSocket endpoints derive from one public, configurable backend HTTP origin.
- Preserve a useful stale/offline view when the backend, a stream, or the WebSocket is unavailable.
- Keep traffic integration isolated from unrelated dashboard panels and browser-only network work out of server rendering.

**Non-Goals:**

- Changing the FastAPI camera registry, adding the two future cameras, or modifying YOLO detection.
- Proxying video through the TanStack server, recording streams, or adding playback controls.
- Deriving a city-wide congestion statistic from camera counts or retaining historical traffic analytics.
- Treating a placeholder as a connected camera or inventing vehicle counts for it.

## Decisions

### Create a focused traffic API boundary

Add a small traffic module that defines the documented backend camera and WebSocket payload types, validates/normalizes received values, and builds endpoint URLs from `VITE_TRAFFIC_API_ORIGIN`. The origin is trimmed of its trailing slash; HTTP(S) is converted to WS(S) only for the WebSocket URL. A local development fallback can target the backend's documented default URL, while deployment documentation requires setting the variable explicitly.

Keeping this translation outside `Panels.tsx` avoids leaking backend field names across presentation components and makes it possible to add backend contract tests with mocked fetch/WebSocket inputs. Hard-coding API and WebSocket URLs separately was rejected because it would make deployment changes error-prone. A server-side proxy was rejected because it would add streaming infrastructure and is unnecessary for direct MJPEG display.

### Use REST for an initial snapshot and WebSocket updates with bounded reconnection

After client mount, the traffic hook requests `/api/cameras` to populate the UI without waiting for the first socket event. It then opens one `/ws/traffic` connection, applies valid `traffic_update` camera snapshots, and reconnects with a bounded backoff after disconnect/error. If the socket cannot reconnect, the hook continues periodic REST refreshes at a lower cadence until it is restored. It tracks loading, last successful update, and a user-readable backend error separately from individual camera errors.

The WebSocket is preferred for timeliness; REST fallback retains current behavior with no new backend endpoint. Frequent independent polling was rejected because the backend already publishes status at a suitable interval. Network work is initiated only in browser effects so SSR never attempts to access `WebSocket` or the local detector service.

### Render exactly four stable camera slots

The Traffic panel becomes a responsive camera grid. Registered backend cameras fill slots in deterministic camera-ID order up to four; each card contains its MJPEG image, name/ID, connection badge, vehicle count, traffic level, FPS, and any backend error. Camera image load failures are presented as a stream-unavailable state without erasing the last status.

When fewer than four cameras are registered, remaining slots use a neutral reserved-card presentation such as “Camera 3 — awaiting backend registration.” If more than four cameras are eventually returned, the panel displays the first four deterministic entries and signals that additional feeds are not yet shown. This provides the requested four-view layout without guessing future IDs or URLs. A dynamically sized grid was rejected because it would remove the planned capacity until the backend expands.

### Keep backend responsibilities and contracts unchanged

The frontend consumes only the existing status and stream contracts. It does not calculate traffic level, open camera transports, or modify camera settings. Backend rollout must configure CORS for the dashboard's production origin and provide an HTTPS/WSS-compatible reachable origin. This preserves the backend's detector/camera separation and avoids coupling UI deployment to its internal worker implementation.

## Risks / Trade-offs

- [An unreachable backend can leave the traffic area blank] → Render loading, unavailable, and last-known status states; surface a retryable connection message and continue bounded reconnection/poll fallback.
- [MJPEG streams can consume considerable browser/network resources] → Limit the first release to four direct image streams and unmount cards when the Traffic panel is not rendered; do not proxy or duplicate frames.
- [Backend payloads can evolve or contain malformed values] → Normalize unknown/missing fields and display safe fallbacks rather than throwing during render; retain existing displayed status until a valid replacement arrives.
- [Production browser access can be blocked by CORS or mixed content] → Document the required `VITE_TRAFFIC_API_ORIGIN` and matching FastAPI CORS origin; require HTTPS dashboard deployments to use an HTTPS backend so the WebSocket becomes WSS.
- [The two later cameras may not have predictable IDs] → Reserve slots by position only, then populate them from the registry response rather than embedding anticipated camera IDs.

## Migration Plan

1. Add the frontend traffic API module, hook, view components, and environment-variable documentation.
2. Configure the development dashboard origin in the backend's CORS allowlist (already present for port 5173) and start the FastAPI service with the two current cameras.
3. Set `VITE_TRAFFIC_API_ORIGIN` for the target dashboard environment, deploy, and confirm status, two MJPEG feeds, socket updates, and backend-unavailable states.
4. When two further backend cameras are configured, no frontend deployment is required: confirm that they appear in the reserved slots and that their streams/status load.
5. Roll back by removing the frontend release or unsetting the configured origin; the independent backend service and its existing APIs remain unchanged.

## Open Questions

- What public HTTPS origin and port will host the FastAPI service in production? This determines the production environment value and CORS entry.
- Should the four-camera grid ultimately replace the existing Traffic card in place or become a dedicated route once sidebar navigation gains working tabs? This proposal retains the existing dashboard location and does not add routing.
