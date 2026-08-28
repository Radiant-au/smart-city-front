## Why

The dashboard's air and flood navigation items are inactive and its overview cards use generated placeholder data even though the Air-pollutionz-system backend already exposes live telemetry, forecasts, history, flood decisions, and alert controls. These backend-owned values need complete, honest UI coverage while preserving the existing citysparkle dashboard shell and visual language.

## What Changes

- Activate dedicated Air quality and Flood watch views in the existing sidebar and route them through the current dashboard view state.
- Replace the overview's placeholder air and river summaries with live backend values and clear loading, unavailable, stale, and last-updated states.
- Populate the air view with every data-bearing source feature: Raspberry Pi connection/device status, MQ135 voltage/raw value, temperature, humidity, current OpenWeather AQI/status, all eight pollutant values, four-day forecast summaries, and relevant air/sensor history charts.
- Populate the flood view with every data-bearing source feature: current water level and physical height, rain state/raw/voltage, one-hour prediction and ML readiness, flood status/reason, reservoir context, thresholds, decision pipeline details, relevant flood history charts, and manual water-release alert feedback.
- Reuse existing citysparkle panels, cards, Recharts, theme tokens, and responsive layout wherever they fit; adapt only individual design patterns from `Air-pollutionz-system/frontend` when no equivalent component exists, without copying whole source files.
- Add one typed frontend API boundary with a configurable backend origin and focused checks for response mapping, polling/cleanup, unavailable data, navigation, rendering, and the confirmed manual alert action.
- Remove air and flood placeholder generators only after their remaining consumers are migrated; preserve unrelated traffic, fire/smoke, AI assistant, map, and dashboard work.

## Capabilities

### New Capabilities

- `live-air-quality-monitoring`: Defines live air telemetry, current pollution, forecast, history, overview summary, and resilient UI states.
- `flood-early-warning-monitoring`: Defines live flood telemetry, prediction and decision context, history, overview summary, and the manual water-release alert workflow.

### Modified Capabilities

None.

## Impact

- Frontend navigation and view composition: `src/App.tsx`, `src/routes/index.tsx`, and `src/components/dashboard/Sidebar.tsx`.
- Existing and new focused dashboard panels, hooks/API helpers, types, and tests under `src/components/dashboard`, `src/hooks`, and `src/lib`.
- Existing backend contracts consumed without modification: `GET /api/dashboard/latest`, `GET /api/air/forecast`, `GET /api/history/dashboard/{period}`, and `POST /api/alerts/water-release`.
- Configuration: a Vite environment value for the Air-pollutionz-system API origin, with a local-development fallback.
- Dependencies: no new package; use the already-installed React, Recharts, Lucide, and Tailwind stack.
- External source reference: `/home/radiant/Desktop/Projects/Air-pollutionz-system/frontend` supplies field coverage and missing-card design direction only.
