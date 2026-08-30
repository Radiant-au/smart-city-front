## ADDED Requirements

### Requirement: Realtime voice capture remains usable near ordinary background noise
The assistant SHALL request mono microphone capture with browser echo cancellation, noise suppression, and automatic gain control, and the realtime backend SHALL use finite, configurable server-side turn detection. The existing manual stop control MUST remain available, and capture or turn-detection failures MUST leave the user able to retry.

#### Scenario: User speaks near low-level background noise
- **WHEN** a user starts realtime voice and speaks a complete request near steady low-level noise
- **THEN** supported browser audio processing is requested and the backend completes the turn after its configured silence interval

#### Scenario: Browser ignores an audio constraint
- **WHEN** the browser or microphone does not support one requested processing constraint
- **THEN** realtime voice continues with the available track instead of treating the unsupported preference as a fatal error

#### Scenario: Automatic turn completion is unsuitable
- **WHEN** noise or a quiet voice prevents a useful automatic boundary
- **THEN** the user can stop listening manually and start another session without reloading the page

### Requirement: Assistant responses are optimized for voice comprehension
The AI backend SHALL instruct typed and realtime models to answer in short, plain sentences suitable for speech. Current city-data replies MUST include the key value, unit where applicable, status, and freshness in a compact form, and MUST include a warning only when the data indicates one.

#### Scenario: User asks a simple question
- **WHEN** the assistant has enough information to answer a simple request
- **THEN** it returns a direct, easy-to-understand response without an unnecessary long explanation

#### Scenario: Current data indicates a warning
- **WHEN** a weather or air-quality value has a backend warning or unhealthy status
- **THEN** the concise reply states the warning and the most relevant safe next action

### Requirement: Realtime voice playback is louder and failure-safe
The dashboard SHALL route realtime PCM replies through the existing Web Audio pipeline with a conservative gain increase and SHALL play generated MP3 replies at the browser audio element's maximum valid volume. It MUST preserve the text reply and replay controls if audio decoding, scheduling, or playback fails.

#### Scenario: Realtime audio is returned
- **WHEN** the realtime backend sends valid 24 kHz PCM audio
- **THEN** the dashboard schedules it through the gain-adjusted output path in order

#### Scenario: Louder playback fails
- **WHEN** the browser rejects or cannot play assistant audio
- **THEN** the text reply remains visible and the user can continue using the assistant
