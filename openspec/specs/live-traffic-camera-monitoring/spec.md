## Purpose

Define the Traffic panel camera-slot layout and displayed monitoring states.

## Requirements

### Requirement: Four camera monitoring slots
The dashboard SHALL render exactly four traffic-camera slots in the Traffic panel. It SHALL populate registered backend cameras in deterministic order, up to four cameras, and SHALL reserve every remaining slot for a future camera without inventing a stream or telemetry value.

#### Scenario: Two backend cameras are available
- **WHEN** the backend returns statuses for two registered cameras
- **THEN** the first two slots display those cameras and the remaining two slots state that they are awaiting backend registration

#### Scenario: A future camera is registered
- **WHEN** the backend returns a third or fourth registered camera
- **THEN** the dashboard replaces the corresponding reserved slot with that camera's live status and stream

#### Scenario: More than four cameras are registered
- **WHEN** the backend returns more than four registered cameras
- **THEN** the dashboard displays four deterministic camera slots and indicates that additional camera feeds are not shown in this release

### Requirement: Live camera telemetry and stream presentation
For every displayed registered camera, the dashboard SHALL request the backend MJPEG stream for that camera and SHALL display its name, connection state, vehicle count, traffic level, FPS, and backend error when those values are available. The dashboard SHALL render safe fallback text for optional or unknown values.

#### Scenario: Connected car-detection camera
- **WHEN** a camera status reports `connected: true` with car-detection telemetry
- **THEN** its card displays the `/stream/{camera_id}` feed, connected state, vehicle count, traffic level, and FPS

#### Scenario: Offline camera
- **WHEN** a camera status reports `connected: false` or includes an error
- **THEN** its card keeps the camera identity visible and presents an offline/error state instead of implying that its feed is live

#### Scenario: MJPEG image fails to load
- **WHEN** the browser cannot load a registered camera's MJPEG image
- **THEN** the card presents a stream-unavailable state while retaining the most recent valid camera status

### Requirement: Resilient monitor states
The Traffic panel SHALL distinguish loading, backend-unavailable, camera-offline, and reserved-future-camera states and SHALL not cause the dashboard to fail when traffic data cannot be retrieved.

#### Scenario: Backend is unavailable before first status
- **WHEN** the initial traffic status request fails
- **THEN** the Traffic panel displays a backend-unavailable state with no fabricated camera data and remains able to retry updates

#### Scenario: Backend becomes unavailable after a status
- **WHEN** traffic communication fails after valid camera status has been displayed
- **THEN** the panel retains the last valid status, labels it as stale or disconnected, and continues recovery attempts
