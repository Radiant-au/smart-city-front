## ADDED Requirements

### Requirement: Surveillance-first fire and smoke feed
The Fire & smoke tab SHALL present a matching fire/smoke camera as the dominant annotated surveillance feed while retaining the dashboard shell and navigation.

#### Scenario: Connected hazard camera
- **WHEN** the traffic monitor returns a connected fire/smoke camera
- **THEN** the tab displays its annotated stream prominently with its camera name and a live monitoring indicator

#### Scenario: Stream unavailable
- **WHEN** the matching camera is disconnected or its stream cannot load
- **THEN** the surveillance stage displays a clear offline or unavailable state instead of a broken image

### Requirement: Hazard state is immediately visible
The Fire & smoke tab SHALL display the camera's fire count, smoke count, and hazard state with destructive emphasis only when a hazard is reported.

#### Scenario: Hazard detected
- **WHEN** the camera reports `hazardDetected` as true
- **THEN** the tab prominently identifies the hazard and displays the reported fire and smoke counts

#### Scenario: Area clear
- **WHEN** the camera reports `hazardDetected` as false
- **THEN** the tab identifies the monitored area as clear without destructive emphasis

### Requirement: Connection states remain informative
The Fire & smoke tab SHALL preserve loading, live-update, reconnecting, backend-error, and no-camera feedback from the existing traffic monitor integration.

#### Scenario: Backend connection in progress
- **WHEN** fire/smoke camera status is loading
- **THEN** the tab communicates that it is connecting to the backend

#### Scenario: Backend error
- **WHEN** the traffic monitor reports an error
- **THEN** the tab displays the error without hiding any last-known camera data

#### Scenario: No registered fire or smoke camera
- **WHEN** no returned camera matches the fire/smoke criteria
- **THEN** the tab displays an empty state explaining that a hazard camera is awaiting backend registration

### Requirement: Responsive and accessible presentation
The Fire & smoke surveillance view SHALL remain usable on narrow and wide screens and SHALL expose meaningful text for feed, state, and metrics.

#### Scenario: Narrow viewport
- **WHEN** the tab is viewed on a narrow screen
- **THEN** the surveillance stage and supporting metrics stack without horizontal overflow

#### Scenario: Assistive technology reads the view
- **WHEN** a user navigates the view with assistive technology
- **THEN** the camera image, monitoring state, hazard state, and metrics have meaningful text equivalents
