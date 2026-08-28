# Smart AI City Dashboard

A React/Vite dashboard for monitoring smart-city operations in one place:

- live air-quality and flood telemetry
- traffic-camera monitoring
- fire and smoke surveillance
- city overview metrics
- AI assistant integration

## Run locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Environment

Copy `.env.example` to `.env` to connect the air-quality and flood panels to the FastAPI backend:

```bash
cp .env.example .env
```

The default backend is `http://127.0.0.1:8000`. Leave the variable unset to use that same default.

## Checks

```bash
npm run lint
npm test
npm run build
```
