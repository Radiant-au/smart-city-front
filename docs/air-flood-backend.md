# Air and flood backend

Set `VITE_AIR_FLOOD_API_ORIGIN` when the FastAPI service is not at `http://127.0.0.1:8000`.
Its CORS configuration must allow this dashboard's browser origin. Tests verify mocked API states only; live values require the FastAPI service, Raspberry Pi telemetry, OpenWeather scheduler, flood model, and connected alert hardware.
