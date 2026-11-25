# Bubble Box

A zen toy. Hold the screen to grow a bubble; release to send it into a box whose near face is the screen. Expo + React Native + Skia. Portrait, iOS tested first.

## Where things are

| To change                                | Open                         |
| ---------------------------------------- | ---------------------------- |
| Any feel number (growth, launch, wobble) | `src/config/tuning.ts`       |
| Physics presets                          | `src/config/feels.ts`        |
| Box looks and bounce                     | `src/config/environments.ts` |
| Bubble looks                             | `src/styles/`                |
| Motion, collisions, launch               | `src/core/world.ts`          |
| Perspective                              | `src/core/projection.ts`     |
| Frame loop, touch, haptics               | `src/scene/Scene.tsx`        |
| Drawing bubbles and ripples              | `src/scene/drawScene.ts`     |
| Drawing the room                         | `src/scene/roomPicture.ts`   |
| Screen-side ripple strength and options  | `src/config/glass.ts`        |
| Screen-side ripple shader                | `src/scene/glassFilter.ts`   |
| What a tap on a bubble does              | `src/config/taps.ts`         |
| Options tray                             | `src/ui/Tray.tsx`            |

## Read before working

1. [docs/plan.md](docs/plan.md): next step. Do one step per session.
2. [docs/architecture.md](docs/architecture.md): only when touching core or scene.
3. [docs/extending.md](docs/extending.md): when adding a style, box or feel.
4. [docs/vision.md](docs/vision.md): for any visible change.
5. [docs/running.md](docs/running.md): before running npm, pod or simulator commands.

## Rules

- `src/core` imports no React, Skia or Expo. Every function there starts with `'worklet'`.
- Tunable numbers live in `src/config`, not inline.
- Nothing in the frame loop goes through React state.
- No new dependency without an ADR in `docs/adr`. No physics or 3D engine (ADR 1).
- Update the matching doc in the same change, and tick the step in `docs/plan.md`.
- Run `npm run check` before finishing. Look at shader changes on a simulator; tests cannot see them.
- Expo changes every SDK. Read installed types in `node_modules` before using an API. Add packages with `npx expo install`.
- `ios/` and `android/` are generated. Configure through `app.json`.
