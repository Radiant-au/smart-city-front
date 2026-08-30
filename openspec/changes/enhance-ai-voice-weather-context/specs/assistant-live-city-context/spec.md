## ADDED Requirements

### Requirement: Weather questions use current backend weather data
The AI backend SHALL resolve a user's current-weather intent using the existing backend weather-data source and SHALL provide the model only normalized current facts, including available condition, temperature, humidity, location, and observation time. Provider credentials MUST remain outside the browser.

#### Scenario: Current weather is available
- **WHEN** a typed or realtime user asks for the current weather and the backend returns a fresh weather observation
- **THEN** the assistant answers from that observation and includes the important available values and freshness

#### Scenario: Weather data is unavailable
- **WHEN** current weather retrieval fails or contains no usable observation
- **THEN** the assistant says current weather is unavailable and does not invent a condition or value

### Requirement: Air-quality questions use current backend air data
The AI backend SHALL resolve a user's air-quality intent using the existing current air payload and SHALL provide the model the available AQI, AQI status, pollutant values, location, and observation time. It MUST distinguish measured current data from unavailable fields.

#### Scenario: Current air quality is available
- **WHEN** a typed or realtime user asks about current air quality and the backend returns a fresh AQI observation
- **THEN** the assistant states the AQI and status and includes the most relevant available pollutant or health warning in a concise response

#### Scenario: A pollutant value is absent
- **WHEN** current AQI is available but a requested pollutant is null or absent
- **THEN** the assistant reports that pollutant as unavailable without substituting or estimating a value

### Requirement: Current-data freshness and failures are explicit
The backend SHALL apply its configured freshness policy to weather and air observations, use bounded upstream timeouts, and return a safe current-data-unavailable or stale-data result without failing the rest of the assistant conversation.

#### Scenario: Observation is stale
- **WHEN** the latest weather or air observation is older than the configured freshness window
- **THEN** the assistant identifies it as stale and states its observation time instead of presenting it as current

#### Scenario: City-data backend times out
- **WHEN** the city-data request exceeds its bounded timeout
- **THEN** the assistant gives a short unavailable response and remains ready for another request

### Requirement: Typed and realtime modes share the same city-data behavior
Typed chat and realtime voice SHALL use the same intent rules, normalized backend facts, freshness policy, and unavailable-state wording for current weather and air quality.

#### Scenario: Equivalent question is asked in both modes
- **WHEN** equivalent current-air or current-weather questions are submitted through typed chat and realtime voice against the same observation
- **THEN** both answers are grounded in the same backend values and freshness status
