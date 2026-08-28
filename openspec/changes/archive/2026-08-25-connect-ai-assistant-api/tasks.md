## 1. Restore a Verifiable Dashboard Baseline

- [x] 1.1 Resolve the existing `Sidebar.tsx` merge conflict, preserving state-based AI Assistant, Overview, and Traffic views in the current Vite application.
- [x] 1.2 Add or update the smallest focused navigation test to cover the preserved AI Assistant and Traffic view behavior.

## 2. Connect the Existing Assistant UI

- [x] 2.1 Add a small AI API helper that derives health, chat, and TTS URLs from the existing traffic API origin and validates documented backend success/error envelopes.
- [x] 2.2 Add focused helper tests for origin derivation, bounded chat history, safe error parsing, and valid MP3 base64 handling.
- [x] 2.3 Replace mock replies in `AiAssistantView` with one abortable pending `POST /api/ai/chat` request using typed or browser-recognized input and the latest 20 display messages.
- [x] 2.4 Display backend health, pending, safe error, and retry states while keeping browser speech recognition and accessible form controls usable.

## 3. Optional Speech Output

- [x] 3.1 Add a voice-output preference plus play/replay control for valid returned MP3 audio, including object-URL cleanup and text-first fallback.
- [x] 3.2 Add retry-TTS behavior for an assistant reply that lacks usable current audio.
- [x] 3.3 Remove simulated/demo wording from the AI Assistant route and panel after real backend wiring is complete.

## 4. Verify

- [x] 4.1 Add focused UI tests for successful chat, safe backend failure, pending-send prevention, speech-transcript submission, and text-only/TTS-success replies.
- [x] 4.2 Run `npm test`, `npm run lint`, `npm run build`, `openspec validate --changes`, and `git diff --check`; report frontend-only checks separately from credentialed backend, browser speech, and audio-playback validation.
