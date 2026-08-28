## ADDED Requirements

### Requirement: Air quality navigation opens a dedicated live view
The dashboard SHALL provide an Air quality navigation action that opens a dedicated air monitoring view within the existing dashboard shell.

#### Scenario: User selects Air quality
- **WHEN** the user selects Air quality in the sidebar
- **THEN** the dashboard marks that item current and displays the air monitoring view without changing unrelated shell elements

### Requirement: Live sensor and connection data is complete
The air view SHALL display backend connection state, device identity, last successful update, MQ135 raw and voltage readings, temperature, and humidity from the latest dashboard response.

#### Scenario: Complete live telemetry arrives
- **WHEN** `GET /api/dashboard/latest` returns sensor data
- **THEN** the view displays each available live air field with its correct label and unit

#### Scenario: Optional sensor field is absent
- **WHEN** temperature, humidity, or another live field is null or absent
- **THEN** the affected component displays an unavailable or waiting state instead of zero

#### Scenario: Refresh fails after prior success
- **WHEN** a latest-data refresh fails after data was displayed
- **THEN** the view identifies the connection as stale or offline and retains the last-known values with their prior update time

### Requirement: Current atmospheric pollution is fully represented
The air view SHALL display current AQI, AQI status, and separate labeled values for PM2.5, PM10, CO, NO, NO2, O3, SO2, and NH3 from the `openweather` dashboard payload.

#### Scenario: Current OpenWeather data is available
- **WHEN** the latest dashboard response includes `openweather`
- **THEN** the AQI summary and all eight pollutant components show the corresponding backend values and chemical meanings

#### Scenario: Current OpenWeather data is unavailable
- **WHEN** the dashboard response has no current OpenWeather data
- **THEN** all current API-backed fields show an explicit waiting or unavailable state without fabricated readings

### Requirement: Four-day forecast uses backend forecast data
The air view SHALL obtain `GET /api/air/forecast`, derive up to four daily summaries from returned forecast entries, and show their timestamps, AQI/status, and available pollutant values.

#### Scenario: Forecast data is returned
- **WHEN** forecast entries are available
- **THEN** the view displays up to four chronological daily forecast cards and the backend forecast update time

#### Scenario: Forecast is empty or fails
- **WHEN** the forecast endpoint returns no entries or cannot be reached
- **THEN** the forecast section reports its own empty or error state while live sensor and current pollution sections remain visible

### Requirement: Air history supports all backend periods
The air view SHALL display historical MQ135 voltage, temperature, humidity, AQI, and pollutant series supplied by `GET /api/history/dashboard/{period}` and SHALL allow only `24h`, `7d`, and `30d` period selection.

#### Scenario: User changes the history period
- **WHEN** the user selects 24 hours, 7 days, or 30 days
- **THEN** the dashboard requests the matching backend period and redraws the air history from returned sensor and API rows

#### Scenario: Air history cannot be loaded
- **WHEN** the history request fails or contains no air points
- **THEN** the history section shows a scoped error or empty state without hiding current air data

### Requirement: Overview air summary is live and honest
The Overview air card SHALL use the shared latest air payload rather than generated placeholder data and SHALL expose loading or unavailable state when no live value exists.

#### Scenario: Overview receives current AQI
- **WHEN** current AQI is present
- **THEN** the Overview air card displays that AQI and an appropriate backend-derived status

#### Scenario: Overview has no current AQI
- **WHEN** no current AQI has been received
- **THEN** the Overview air card displays an unavailable state and does not retain the previous hard-coded value

### Requirement: Air requests are configurable and cleaned up
The frontend SHALL derive the air/flood backend origin from Vite configuration with a documented local fallback, poll latest data at the established five-second cadence, refresh forecast at the established 30-minute cadence, and cancel owned requests or timers when no longer needed.

#### Scenario: A custom backend origin is configured
- **WHEN** `VITE_AIR_FLOOD_API_ORIGIN` is set
- **THEN** all air requests target that normalized origin without exposing backend credentials

#### Scenario: Monitoring unmounts
- **WHEN** the component owning air requests unmounts
- **THEN** its timers and in-flight abortable requests are cleaned up without later state updates

### Requirement: Air presentation matches the current dashboard
The air view SHALL reuse existing theme tokens, responsive panel/card patterns, icons, and Recharts, adding no new UI or chart dependency.

#### Scenario: Air view is displayed at narrow width
- **WHEN** the viewport is narrow
- **THEN** metrics, pollutant cards, forecast cards, and charts stack or scroll intentionally without page-level horizontal overflow

#### Scenario: Assistive technology reads air data
- **WHEN** air content is navigated with assistive technology
- **THEN** connection state, measurements, units, chart purpose, errors, and unavailable values have meaningful text equivalents
