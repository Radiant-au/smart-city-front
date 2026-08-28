## Context

`FireSmokePanel` currently filters fire/smoke cameras from `useTrafficMonitor` and renders them through the generic `CameraFeedCard`. The reference FireWatch frontend makes the feed the visual focus and communicates monitoring and hazard state more strongly, but it also owns camera selection, image upload, confidence controls, alert fetching, and detection requests that do not belong in this dashboard.

## Goals / Non-Goals

**Goals:**

- Give the existing Fire & smoke tab a surveillance-first layout suited to hazard monitoring.
- Adapt the reference hierarchy to the existing dashboard theme, shell, responsive behavior, and API data.
- Keep loading, connection, stale, error, offline, clear, and hazard states understandable and accessible.
- Reuse current hooks, endpoint helpers, icons, and Tailwind theme tokens.

**Non-Goals:**

- Copy the reference app wholesale or alter global dashboard branding.
- Add camera selection, uploads, confidence controls, sound alarms, incident storage, or detector API calls.
- Change backend payloads, routes, polling, WebSocket behavior, or camera classification.
- Add packages or introduce a reusable component framework for one tab.

## Decisions

1. **Specialize `FireSmokePanel` while retaining the shared data path.** The panel will continue filtering `useTrafficMonitor()` results and building stream URLs with `createTrafficEndpoints()`. A focused fire/smoke feed presentation is smaller and clearer than expanding the generic traffic camera card with mode-specific branches. The alternative—copying reference state and requests—would duplicate working integration.

2. **Adapt hierarchy, not exact styling.** The primary camera occupies a wide surveillance stage with an overlaid live/offline indicator and hazard status. Fire count, smoke count, connection state, and frame rate use compact supporting cards below or beside it. Existing dashboard colors and typography replace FireWatch's global CSS so the tab remains visually coherent.

3. **Use the first matching camera as the featured feed.** The backend currently exposes one fire/smoke detector camera. If more appear, they can be shown as compact additional feeds using the same local presentation, without adding selection state now.

4. **Keep operational states in the existing component.** Loading, backend error, reconnecting, empty registration, stream failure, clear, and hazard states will derive directly from existing hook and camera fields. No new store or hook is needed.

5. **Verify behavior with the existing focused Vitest file.** Tests will assert the prominent live view and meaningful state text rather than CSS implementation details.

## Risks / Trade-offs

- [The reference includes controls the current backend contract does not expose] → Copy only presentation supported by existing data and omit inactive controls.
- [A large feed can dominate small screens] → Use responsive aspect ratios and stack supporting metrics below the feed.
- [A stream image can fail after the camera reports connected] → Preserve a local image-error fallback and expose an offline/unavailable state.
- [Future multiple hazard cameras may need selection] → Render additional cameras without selection state; add it only when multiple active feeds make it necessary.
