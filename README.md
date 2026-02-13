# wsim

Godhood Sim playable MVP with a thin simulation API layer, iterating toward the full product spec.

## What is implemented now

- Playable browser loop with pause/play, speed control, and time jump.
- Clickable 72x36 planetary grid visualization and region targeting.
- Free-text interventions with deterministic OB/ED economy and update application.
- API-backed SIMULATOR flow (`/api/simulate/intervention`) with narrative + structured update contract.
- API-backed ADVISOR suggestions (`/api/advisor`) and moderation gate (`/api/moderate`).
- Event queue progression, delayed consequences, milestone/era checks, and random disruptions.
- Early offworld loop (spacefaring unlock + colony launch + stability aging + win check).
- Local save/load.

## Run locally

```bash
npm install
npm run dev
```

- Web app: `http://localhost:4173`
- API: `http://localhost:8787`

## Validation

```bash
npm test
npm run build
npm run build:web
npm run lint
```

## API endpoints

- `POST /api/moderate`
- `POST /api/simulate/intervention`
- `POST /api/simulate/event`
- `POST /api/advisor`

## Current architecture

- `src/*`: deterministic simulation engine modules.
- `ui/*`: browser MVP client.
- `server/server.mjs`: thin API proxy/mock server, moderation, and rate limiting.
- `tests/*`: core deterministic unit tests.

## Next steps toward full spec

- Replace mock API logic with provider-backed LLM calls and repair parsing pass.
- Move from 2D preview map to interactive WebGL globe with brush selection.
- Add compressed map cell storage + export/import saves.
- Expand species templates and full offworld node/resource simulation.
