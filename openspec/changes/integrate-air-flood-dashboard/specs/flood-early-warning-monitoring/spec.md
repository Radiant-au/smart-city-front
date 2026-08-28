## ADDED Requirements

### Requirement: Flood watch navigation opens a dedicated live view
The dashboard SHALL provide a Flood watch navigation action that opens a dedicated flood early-warning view within the existing dashboard shell.

#### Scenario: User selects Flood watch
- **WHEN** the user selects Flood watch in the sidebar
- **THEN** the dashboard marks that item current and displays the flood monitoring view without changing unrelated shell elements

### Requirement: Current flood and rain telemetry is complete
The flood view SHALL display current water raw/voltage data, normalized percent, physical height, rain raw/voltage data, rain state, flood status, decision reason, device identity, connection state, and last successful update from the latest dashboard response.

#### Scenario: Complete flood telemetry arrives
- **WHEN** `GET /api/dashboard/latest` returns flood sensor and decision data
- **THEN** each available current water, rain, status, and reason field is displayed with the correct label and unit

#### Scenario: Latest flood data is partial
- **WHEN** the latest or persisted fallback payload lacks computed flood fields
- **THEN** each missing component displays unavailable text while other returned fields remain visible

#### Scenario: Flood refresh fails after prior success
- **WHEN** a latest-data refresh fails after flood data was displayed
- **THEN** the view identifies the connection as stale or offline and retains the last-known flood values and update time

### Requirement: Flood prediction and decision context is fully represented
The flood view SHALL display prediction readiness, predicted level/percent/height, ML status, historical and required sample counts, missing hours, input sequence when supplied, model horizon, warning and danger heights, reservoir location/type/dimensions, status, and decision reason.

#### Scenario: Prediction is ready
- **WHEN** the flood payload reports `prediction_ready` as true
- **THEN** the view presents the one-hour prediction alongside physical thresholds and final decision context

#### Scenario: Prediction is warming up or unavailable
- **WHEN** prediction readiness is false or the ML status reports unavailable data or model
- **THEN** the view displays the backend ML status and sample readiness without inventing a prediction

#### Scenario: Reservoir context is returned
- **WHEN** the flood payload includes reservoir configuration
- **THEN** its location, type, width, maximum height, and warning/danger thresholds are displayed in the decision context

### Requirement: Flood history supports all backend periods
The flood view SHALL display historical water voltage or level, rain voltage or state, and predicted water values supplied by `GET /api/history/dashboard/{period}` and SHALL allow only `24h`, `7d`, and `30d` period selection.

#### Scenario: User changes the flood history period
- **WHEN** the user selects 24 hours, 7 days, or 30 days
- **THEN** the dashboard requests the matching backend period and redraws flood history from returned sensor rows

#### Scenario: Flood history cannot be loaded
- **WHEN** the history request fails or contains no flood points
- **THEN** the history section shows a scoped error or empty state without hiding live flood data

### Requirement: Manual water-release alert is explicit and guarded
The flood view SHALL provide a manual water-release action that confirms user intent, posts to `/api/alerts/water-release` with the current device ID or established fallback, prevents duplicate submission, and displays success or failure feedback.

#### Scenario: User cancels confirmation
- **WHEN** the user declines the water-release confirmation
- **THEN** no alert request is sent

#### Scenario: Confirmed alert succeeds
- **WHEN** the user confirms and the backend accepts the alert request
- **THEN** the action remains disabled during submission and the view reports successful queueing after completion

#### Scenario: Confirmed alert fails
- **WHEN** the confirmed backend request fails
- **THEN** the action becomes available again and the view displays a failure message without claiming hardware activation

### Requirement: Overview flood summary is live and honest
The Overview flood card SHALL use the shared latest water-level payload rather than generated placeholder data and SHALL expose loading, unavailable, or stale state when appropriate.

#### Scenario: Overview receives current water data
- **WHEN** water level percent or physical height is present
- **THEN** the Overview flood card displays the backend value with its correct unit and status context

#### Scenario: Overview has no current water data
- **WHEN** no current water value has been received
- **THEN** the Overview flood card displays an unavailable state and does not retain the previous hard-coded river level

### Requirement: Flood presentation matches the current dashboard
The flood view SHALL reuse existing theme tokens, responsive panel/card patterns, icons, and Recharts while adapting only missing component layouts from the source frontend.

#### Scenario: Flood view is displayed at narrow width
- **WHEN** the viewport is narrow
- **THEN** metrics, intelligence cards, pipeline content, action controls, and charts stack without page-level horizontal overflow

#### Scenario: Assistive technology reads flood data
- **WHEN** flood content is navigated with assistive technology
- **THEN** readings, units, prediction readiness, decision state, errors, unavailable values, and alert feedback have meaningful text equivalents

### Requirement: Existing dashboard capabilities remain intact
The integration SHALL preserve existing traffic, fire/smoke, AI assistant, map, shell, and theme behavior and SHALL not copy whole source frontend files.

#### Scenario: User visits an unrelated view
- **WHEN** the user selects Overview, Traffic, Fire & smoke, or AI Assistant after the integration
- **THEN** that view retains its existing behavior except for the explicitly live air and flood Overview summaries
