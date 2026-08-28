## Purpose

Define the dashboard assistant's integration with the configured FastAPI AI API.

## Requirements

### Requirement: Assistant tab uses the configured FastAPI AI API
The dashboard SHALL derive `GET /api/ai/health`, `POST /api/ai/chat`, and `POST /api/ai/tts` from the existing `VITE_TRAFFIC_API_ORIGIN` resolution. It MUST NOT expose provider credentials, add a provider SDK, or use rotating mock responses.

#### Scenario: Local default is used
- **WHEN** no valid `VITE_TRAFFIC_API_ORIGIN` is configured
- **THEN** the assistant requests the AI endpoints from `http://127.0.0.1:8000`

#### Scenario: Configured backend is used
- **WHEN** `VITE_TRAFFIC_API_ORIGIN` is a valid HTTP or HTTPS origin
- **THEN** the assistant requests the AI endpoints from that origin with the `/api/ai` path

### Requirement: Typed and recognized messages are sent to backend chat
The assistant SHALL send each non-empty submitted input to `POST /api/ai/chat` as JSON with `text`, a maximum of the latest 20 prior user/assistant messages as `{role, content}`, and the current voice-output preference as `generateVoice`. Final browser speech-recognition text MUST continue to populate the existing input before the user submits it. The UI MUST show the returned reply as an assistant message only after a successful response.

#### Scenario: Typed chat succeeds
- **WHEN** a user submits non-empty text and the backend returns `success: true` with a non-empty `reply`
- **THEN** the assistant displays the user message followed by the returned reply instead of a simulated response

#### Scenario: Conversation context is bounded
- **WHEN** more than 20 messages precede a newly submitted message
- **THEN** the request contains no more than the latest 20 valid prior messages and sends the new message in `text`

#### Scenario: Browser-recognized speech is submitted
- **WHEN** browser speech recognition produces final text and the user submits the populated input
- **THEN** the assistant sends that text through the same typed-chat request path

### Requirement: Assistant request state and failures remain usable
The assistant MUST permit at most one pending chat request, present an accessible pending state, and prevent duplicate sends while pending. It MUST display a frontend-safe error when the health check, request, network, abort, or response validation fails, retain the conversation, and allow a later retry. It MUST NOT display an assistant reply for a failed request.

#### Scenario: Backend chat returns a safe error
- **WHEN** the backend responds with `success: false` and its frontend-safe error message
- **THEN** the assistant shows that error and leaves the user able to retry without creating a mock reply

#### Scenario: Request is pending
- **WHEN** a chat request has not completed
- **THEN** the send control is disabled and the UI exposes that the assistant is responding

### Requirement: Optional backend speech output is controllable
When a successful chat response includes `ttsAvailable: true`, `audioMimeType: "audio/mpeg"`, and a valid `audioBase64`, the assistant SHALL provide a play/replay control. It MUST attempt playback only when the user has enabled voice output, preserve the text reply if decoding or playback fails, and expose the voice-output preference. It MUST revoke replaced and unmounted object URLs and MUST NOT persist returned audio.

#### Scenario: Chat returns usable speech
- **WHEN** a successful chat response contains valid MP3 audio and voice output is enabled
- **THEN** the assistant keeps the text reply and makes the response available for playback

#### Scenario: Text-only chat succeeds
- **WHEN** a successful response has `ttsAvailable: false` or no usable audio fields
- **THEN** the assistant displays the text reply without treating the chat as failed

#### Scenario: User retries speech output
- **WHEN** the user selects replay for a text reply without currently usable audio
- **THEN** the assistant posts that reply text to `POST /api/ai/tts` and plays the valid returned MP3 if available
