## ADDED Requirements

### Requirement: Configurable backend origin
The traffic integration SHALL derive its HTTP camera-status and MJPEG URLs from one configurable public backend HTTP origin and SHALL derive its traffic WebSocket URL from the same origin. The implementation SHALL not hard-code a production backend host in UI components.

#### Scenario: Configured production origin
- **WHEN** a deployment supplies the traffic backend origin configuration
- **THEN** requests target that origin's `/api/cameras`, `/stream/{camera_id}`, and `/ws/traffic` endpoints with the appropriate HTTP(S) or WS(S) protocol

#### Scenario: Origin has a trailing slash
- **WHEN** the configured traffic backend origin ends in a slash
- **THEN** generated endpoint URLs contain exactly one separator before their endpoint path

### Requirement: Initial and live status synchronization
The client SHALL retrieve an initial camera-status snapshot from `GET /api/cameras`, then consume valid `traffic_update` payloads from `WS /ws/traffic` to update displayed statuses. It SHALL reconnect after an unexpected WebSocket close and SHALL use lower-frequency REST refreshes while real-time updates are unavailable.

#### Scenario: Initial status succeeds
- **WHEN** the Traffic panel mounts and the status endpoint responds with camera statuses
- **THEN** the displayed camera slots reflect that snapshot before or independently of the next WebSocket message

#### Scenario: WebSocket traffic update arrives
- **WHEN** the client receives a valid `traffic_update` message containing camera statuses
- **THEN** the displayed registered-camera telemetry updates from that message

#### Scenario: WebSocket disconnects
- **WHEN** the traffic WebSocket closes unexpectedly
- **THEN** the client exposes a disconnected/stale state, schedules bounded reconnection, and refreshes status through the REST endpoint until real-time updates resume

### Requirement: Browser-safe traffic communication
The traffic integration SHALL initiate network communication only after client-side mount and SHALL safely ignore malformed or unrecognized backend data without crashing dashboard rendering.

#### Scenario: Server-side render
- **WHEN** the dashboard is rendered on the server
- **THEN** it does not attempt to construct a browser WebSocket or contact the traffic backend

#### Scenario: Malformed backend payload
- **WHEN** a REST or WebSocket payload lacks the expected camera status structure
- **THEN** the dashboard preserves its current safe state and records a recoverable connection error rather than throwing during render
