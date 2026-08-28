## 1. API Contract and Shared Monitoring

- [x] 1.1 Add the typed air/flood API origin and request helpers for latest dashboard data, forecast, period history, and manual water-release alerts, preserving every consumed nullable field.
- [x] 1.2 Add focused API-helper checks for configured/local origins, URL normalization, response/error handling, allowed history periods, and encoded device IDs.
- [x] 1.3 Add the shared React monitoring hook with immediate latest/forecast loading, five-second latest polling, 30-minute forecast refresh, per-period history loading, independent errors, last-success timestamps, last-known retention, and abort/timer cleanup.
- [x] 1.4 Add focused hook checks for successful polling, partial failures, stale last-known data, history period changes, and unmount cleanup.

## 2. Navigation and Shared Dashboard Data

- [x] 2.1 Extend the existing dashboard view state and sidebar actions with active `air-quality` and `flood-watch` views while preserving all existing view behavior.
- [x] 2.2 Provide the shared monitoring state to Overview, Air quality, and Flood watch without adding a state-management dependency or duplicating polling.
- [x] 2.3 Replace the Overview air and flood hard-coded values/series with available live AQI and water data plus truthful loading, unavailable, status, and stale presentation.
- [x] 2.4 Remove only air/flood placeholder data that has no remaining consumer and update navigation/overview tests.

## 3. Complete Air Quality View

- [x] 3.1 Build the Air quality view from existing panel, `StatCard`, theme, icon, and responsive patterns, including backend connection, device, last-update, MQ135 raw/voltage, temperature, and humidity data.
- [x] 3.2 Add current AQI/status and individual PM2.5, PM10, CO, NO, NO2, O3, SO2, and NH3 components with correct meanings, units, and null handling.
- [x] 3.3 Add the four-day forecast presentation from backend forecast entries, including update time and isolated loading, empty, and error states.
- [x] 3.4 Add selectable 24-hour, 7-day, and 30-day Recharts history for MQ135, temperature/humidity, AQI, and pollutant data using the backend's sensor and API history rows.
- [x] 3.5 Add focused Air quality view checks covering complete data, partial/null data, stale/error states, forecast/history states, period selection, and accessible text.

## 4. Complete Flood Early-Warning View

- [x] 4.1 Build the Flood watch view from existing panel, `StatCard`, theme, icon, and responsive patterns, including device/connection/update state, current water raw/voltage/percent/height, rain raw/voltage/state, flood status, and decision reason.
- [x] 4.2 Add reservoir details, warning/danger/current thresholds, prediction level/percent/height, ML status/readiness/sample counts/missing hours/input sequence/horizon, and the sensor-to-decision pipeline with independent missing-value handling.
- [x] 4.3 Add selectable 24-hour, 7-day, and 30-day Recharts history for water, rain, and predicted level data from backend sensor history rows.
- [x] 4.4 Add the confirmed manual water-release action using the current or fallback device ID, disabled submitting state, duplicate prevention, and accurate queued/failure feedback without claiming physical buzzer success.
- [x] 4.5 Add focused Flood watch checks covering complete and partial telemetry, ML ready/unavailable states, history periods, confirmation cancel/success/failure, responsive semantics, and preservation of unrelated views.

## 5. Verification and Live Boundary

- [x] 5.1 Document `VITE_AIR_FLOOD_API_ORIGIN`, local fallback, expected FastAPI origin/CORS setup, and the distinction between mock/local tests and live Pi/backend data.
- [x] 5.2 Run focused tests, the full test suite, lint, and production build; fix only regressions caused by this change and record unrelated pre-existing failures separately.
- [ ] 5.3 With the Air-pollutionz-system backend available, browser-smoke the configured latest, forecast, history, navigation, stale-state, and confirmed alert request flows; report Raspberry Pi, flood model, CORS, and physical buzzer verification separately when hardware/provider proof is unavailable.
