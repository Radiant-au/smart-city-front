## Why

The existing Fire & smoke tab exposes the live hazard feed as a generic camera card, so its most important state is easy to miss. The dedicated Fire-Smoke-Detector-AI frontend already provides a clearer surveillance-first hierarchy that can be adapted to this dashboard without replacing its shell or backend integration.

## What Changes

- Redesign the existing Fire & smoke tab around a prominent annotated surveillance feed.
- Adapt the source design's live/standby state, fire and smoke counts, hazard emphasis, and monitoring context to the dashboard's existing theme and responsive layout.
- Preserve the current shared traffic API, realtime status handling, sidebar navigation, and offline/error states.
- Use existing Tailwind tokens, Lucide icons, and components; add no new UI dependency and do not copy the source application's camera-upload or detector-control behavior.
- Add focused tests for the redesigned tab's live, hazard, empty, and error presentation.

## Capabilities

### New Capabilities

- `fire-smoke-surveillance-view`: Defines the surveillance-focused presentation and states of the existing Fire & smoke tab.

### Modified Capabilities

None.

## Impact

- Frontend: primarily `src/components/dashboard/Panels.tsx` and its focused tests.
- APIs: no contract change; continue using `useTrafficMonitor` and `createTrafficEndpoints`.
- Dependencies: none added.
- Source reference: `/home/radiant/Desktop/Projects/Fire-Smoke-Detector-AI/web/src/App.tsx` and `styles.css` supply visual direction only.
