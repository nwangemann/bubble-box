# Bubble Box

A zen toy. Hold the screen to grow a bubble; release to send it into a box whose near face is the screen. Expo + React Native + Skia. Portrait, iOS tested first.

## Where things are

| To change                                | Open                                                               |
| ---------------------------------------- | ------------------------------------------------------------------ |
| Any feel number (growth, launch, wobble) | `src/config/tuning.ts`                                             |
| Physics presets                          | `src/config/feels.ts`                                              |
| Box looks and bounce                     | `src/config/environments.ts`                                       |
| Bubble looks                             | `src/styles/`                                                      |
| Motion, collisions, launch               | `src/core/world.ts`                                                |
| Gravity from tilting the phone           | `src/core/tilt.ts`                                                 |
| Perspective                              | `src/core/projection.ts`                                           |
| Frame loop, touch, haptics               | `src/scene/Scene.tsx`                                              |
| Drawing bubbles and ripples              | `src/scene/drawScene.ts`                                           |
| Drawing the room                         | `src/scene/roomPicture.ts`                                         |
| Wall materials and light on walls        | `src/scene/walls.ts`                                               |
| Screen-side ripple strength and options  | `src/config/glass.ts`                                              |
| Screen-side ripple shader                | `src/scene/glassFilter.ts`                                         |
| What a tap on a bubble does              | `src/config/taps.ts`                                               |
| Whether touching bubbles merge           | `src/config/contacts.ts`                                           |
| How bubbles draw each other              | `src/config/pulls.ts`, `src/core/pull.ts`                          |
| How a pop pushes its neighbours          | `src/core/puff.ts`                                                 |
| First-time hint of the two-finger swipe  | `src/core/hint.ts`, `src/scene/hint.ts`                            |
| Trails bubbles leave                     | `src/config/trails.ts`, `src/core/trail.ts`, `src/scene/trails.ts` |
| Meet and pop effects                     | `src/fx/`                                                          |
| Default settings, menu tiles, Random     | `src/config/defaults.ts`                                           |
| Web preview: start, storage, page        | `src/start.web.ts`, `src/services/store.web.ts`, `public/`         |
| Web preview: after the build, serving    | `scripts/`                                                         |
| Saved settings, Reduce Motion            | `src/services/`                                                    |
| Options menu and its tiles               | `src/ui/Tray.tsx`                                                  |
| Calm, Showdown and 8-ball switch         | `src/config/modes.ts`, `src/ui/ModeSwitch.tsx`                     |
| Preview picker                           | `src/ui/Picker.tsx`                                                |
| Custom bubble: choices, then its screen  | `src/config/custom.ts`, `src/ui/Maker.tsx`                         |
| What each preview acts out               | `src/preview/`                                                     |
| Showdown casts and arenas                | `src/showdown/`                                                    |
| What murals are painted with             | `src/showdown/scenery.ts`                                          |
| Showdown grid, mural, haze, wall contact | `src/config/arena.ts`                                              |
| Whose cast fights in an arena            | `src/showdown/casts.ts`                                            |
| Showdown rules and entrant count         | `src/config/rules.ts`                                              |
| Showdown titles for unusual wins         | `src/config/feats.ts`, `src/core/feats.ts`                         |
| Showdown favourite: its light, tally     | `HALO` in `src/config/arena.ts`, `src/config/tally.ts`             |
| Showdown physics: odds, hunting, ringing | `src/core/duel.ts`                                                 |
| Showdown bubble and merge shader         | `src/scene/liquid.ts`                                              |
| Drawing a showdown                       | `src/scene/drawShowdown.ts`                                        |
| Showdown shadows, reflections on walls   | `src/scene/roomContact.ts`                                         |
| Showdown screen, and its chooser         | `src/ui/Showdown.tsx`, `src/ui/Lobby.tsx`                          |
| 8-ball trial: numbers, physics           | `src/config/pool.ts`, `src/core/pool.ts`                           |
| 8-ball: potted, remaining, whose turn    | `src/core/poolRow.ts`                                              |
| 8-ball trial: light of a pot             | `src/scene/poolPots.ts`                                            |
| 8-ball trial: options                    | `src/config/poolOptions.ts`                                        |
| 8-ball: the cue that aims                | `POOL.aim.cue`, `src/core/cue.ts`, `src/scene/poolCue.ts`          |
| 8-ball rules: turns, fouls, the wait     | `src/config/poolRules.ts`, `src/core/poolGame.ts`                  |
| 8-ball trial: shadows, light on walls    | `src/scene/poolWalls.ts`                                           |
| 8-ball trial: drawing, screen            | `src/scene/drawPool.ts`, `src/ui/Pool.tsx`                         |

## Read before working

1. [docs/plan.md](docs/plan.md): next step. Do one step per session.
2. [docs/architecture.md](docs/architecture.md): only when touching core or scene.
3. [docs/extending.md](docs/extending.md): when adding a style, box or feel.
4. [docs/vision.md](docs/vision.md): for any visible change.
5. [docs/running.md](docs/running.md): before running npm, pod or simulator commands.
6. [docs/settings.md](docs/settings.md): when touching options or defaults.
7. [docs/pool.md](docs/pool.md): when working on 8-ball (section 1 of the plan).

## Rules

- `src/core` imports no React, Skia or Expo. Every function there starts with `'worklet'`, and is defined above anything that calls it: worklets capture what exists when they are defined, so no forward calls or mutual recursion.
- Tunable numbers live in `src/config`, not inline.
- Nothing in the frame loop goes through React state.
- No new dependency without an ADR in `docs/adr`. No physics or 3D engine (ADR 1).
- Update the matching doc in the same change.
- Manual verification (anything a person or phone must judge) goes last, in all work: put it in section 10 of `docs/plan.md`, rank every other step above it, and never wait for it or name it **Next** while another step is open. What you can check yourself, with tests or a simulator, is not manual: do it in the same session.
- Look at shader changes on a simulator; tests cannot see them.
- Expo changes every SDK. Read installed types in `node_modules` before using an API. Add packages with `npx expo install`.
- `ios/` and `android/` are generated. Configure through `app.json`.

## Finishing a session

1. Remove temporary probes and logging, then run `npm run check`.
2. Delete the simulators, servers and scratch files this session made. Leave any it did not make: other sessions may be using them. Need a simulator while all are in use? Create one, and delete it here.
3. Move the step to **Built** in `docs/plan.md`, add what only a person can verify to section 10, and move **Next**.
4. End with one line to start the next session, such as "Execute step 1.1 from docs/plan.md", with one short sentence on what that step is and its phase, and say what is uncommitted, unfinished or unverified.
