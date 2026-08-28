## Context

`citysparkle-dash` is a React/Vite single-page dashboard whose Overview currently renders generated air and flood series from `src/lib/city-data.ts`; the Air quality and Flood watch sidebar buttons do not select views. The adjacent Air-pollutionz-system already provides the required live and historical data through FastAPI, while its standalone frontend demonstrates complete field coverage in a different visual system.

The change crosses navigation, request state, typed response mapping, several panels, and overview summaries. Existing user changes in the dashboard are substantial, so implementation must avoid broad file replacement and preserve traffic, fire/smoke, assistant, and map behavior.

## Goals / Non-Goals

**Goals:**

- Display every backend-fed air and flood component represented by the source frontend.
- Reuse the current dashboard shell, `StatCard`, panel styling, Recharts, Lucide icons, and responsive conventions.
- Make live, loading, empty, stale, partial, and error states truthful without discarding last-known data.
- Keep backend origin resolution, response types, formatting, and fetch behavior centralized and testable.
- Keep the manual water-release action explicit, confirmed, and resistant to duplicate submission.

**Non-Goals:**

- Copying whole components, CSS files, or the complete standalone frontend.
- Changing FastAPI routes, telemetry calculation, flood ML, alert delivery, database storage, or device firmware.
- Adding a state library, query library, chart library, or design dependency.
- Fabricating values when telemetry, forecast, history, or ML output is absent.
- Redesigning unrelated dashboard views or converting the existing view-state navigation to a router.

## Decisions

### Use one small typed API module and one shared monitoring hook

Add an air/flood API module that resolves `VITE_AIR_FLOOD_API_ORIGIN` with a local `http://127.0.0.1:8000` fallback, declares only the consumed response shapes, and wraps the four existing endpoints. A shared hook owns latest-data polling, forecast refresh, history loading by selected period, abort cleanup, last-success timestamps, and independent errors.

This avoids request duplication across Overview, Air, and Flood views while keeping the implementation within existing React primitives. Reusing the traffic API module was considered, but its origin and camera-specific contracts belong to a different backend and must remain independent.

### Preserve last-known values and report source state separately

Latest data polls every five seconds to match the producing frontend and Pi cadence. A failed refresh marks the connection stale/offline but retains the last successful payload; it does not replace values with zero. Forecast refreshes on initial load and every 30 minutes. History is fetched on initial display and period change, with `24h`, `7d`, and `30d` as the only allowed periods.

Independent state prevents a forecast or history outage from hiding live telemetry. Native `AbortController` handles unmount and superseded history requests; no request dependency is needed.

### Compose dedicated views from current dashboard primitives

Extend the existing view union with `air-quality` and `flood-watch`, activate their sidebar buttons, and render dedicated view components inside the unchanged dashboard shell. Reuse `StatCard` and `.panel`-based sections first. Add small local card layouts only for source concepts without an existing equivalent: pollutant details, forecast days, reservoir/threshold/ML/decision details, and manual alert feedback.

Overview receives live AQI and water-level summaries from the same hook. Traffic and smoke summaries keep their current sources. Placeholder air/flood generators are deleted only if no other consumer remains.

### Map API fields without changing their meaning

Air coverage includes device and refresh state; MQ135 raw/voltage; temperature; humidity; AQI/status; `pm2_5`, `pm10`, `co`, `no`, `no2`, `o3`, `so2`, and `nh3`; forecast timestamps and pollutants; and air-related sensor/API history.

Flood coverage includes raw and voltage values; normalized percent and physical height; rain state; predicted level/percent/height; `ml_status`, readiness, history counts, missing hours, input sequence, and horizon; reservoir dimensions; warning/danger thresholds; status/reason; flood-related history; and alert feedback. Null values render as unavailable/warming-up text, never numeric zero.

### Keep the water-release action behind a native confirmation

The action uses the latest device ID, falling back to the backend's established `SMARTCITY_PI_01`, asks for confirmation, disables during submission, and renders success/failure feedback from the request result. `window.confirm` is sufficient for this consequential but simple control and avoids a new dialog flow.

## Risks / Trade-offs

- [Backend CORS does not include the dashboard's deployed origin] → Document the configured frontend/backend origins and treat live cross-origin verification as an implementation gate; do not hide CORS errors.
- [Latest fallback data after backend restart lacks newer computed flood fields] → Render fields independently and show unavailable states for missing properties.
- [One hook can cause polling while a non-air/flood view is visible] → Keep one five-second request for shared overview/navigation data; split only if measured overhead becomes meaningful.
- [History payloads can grow for 30 days] → Use the backend's already aggregated period endpoint and render its returned points without client-side expansion.
- [Manual alert can activate hardware] → Require user confirmation, prevent duplicate clicks, and keep automated tests at the mocked request boundary.
- [Source frontend and backend may drift] → Treat current backend responses as authoritative and use the source frontend only as a coverage/design inventory.

## Migration Plan

1. Add and test origin resolution, response mapping, and request wrappers.
2. Add the shared hook and verify polling, abort cleanup, last-known retention, and period changes.
3. Activate navigation and introduce air/flood views using existing dashboard primitives.
4. Replace only the overview's air and flood placeholders, then remove unused generated data.
5. Run focused tests, full tests, lint, and build; verify the browser against the live FastAPI origin separately.

Rollback consists of reverting the new view cases, API/hook files, and overview bindings; the backend and unrelated dashboard features require no rollback.

## Open Questions

None. The current backend routes and source frontend provide enough contract and coverage detail for implementation.
