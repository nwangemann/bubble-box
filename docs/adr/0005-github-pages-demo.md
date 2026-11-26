# 5. A live demo on GitHub Pages

Status: accepted, 2026-11-26

## Decision

The `deploy` job in `.github/workflows/check.yml` publishes the web preview (ADR 3) to GitHub Pages at https://nwangemann.github.io/bubble-box/, on every push to `main` once `check` passes.

A project site lives under `/bubble-box/`. `app.config.ts` sets Expo's `experiments.baseUrl` from `BUBBLE_BOX_BASE_URL`, which only the deploy job sets, so local builds still serve from the root. Skia is located beside the page (`src/start.web.ts`) and the preloads added by `scripts/web-finish.mjs` are relative, so both work at the root and under the base path. The deploy drops the `.gz` copies, since Pages compresses on its own.

## Why

A reader can try the app without cloning, building or installing anything. The preview is a static site, and Pages is free for a public repository.

## Consequences

- Every green push to `main` updates the demo. A red build never deploys.
- It is the web preview, with its limits: no haptics on an iPhone, Glass always still, tilt only where the browser allows it. Frame time and feel are judged on a native build.
- Saved settings live in the visitor's own browser storage.

## Drop it if

The web preview is dropped (ADR 3), or the demo misrepresents the app.
