# How Bubble Box was built with an AI agent

Most of Bubble Box was written by an AI coding agent (Claude Code), steered by a person who chose the direction, judged the results and decided what to keep. This page describes the files that steer the agent, the loop the work followed, and which checks the agent ran itself versus which are left to a person.

## The files that steer the agent

The agent reads these at the start of every session, so each session can start cold instead of relying on chat history.

- [`AGENTS.md`](../AGENTS.md) (loaded through `CLAUDE.md`): a table of where every kind of change lives, the docs to read before working, the house rules and the routine for finishing a session. The rules include: `src/core` imports no React, Skia or Expo; tunable numbers live in `src/config`; nothing in the frame loop goes through React state; no new dependency without an ADR; docs change with the code.
- [The plan](plan.md): the roadmap as numbered, session-sized steps, with a **Next** marker. Its **Built** section records, step by step, what was checked, how (tests, simulator, web preview), the frame time measured, and what was not seen. It is the project's memory between sessions.
- [Decision records](adr/): four short ADRs, for the stack, saved settings, the web preview and sound. A later session reads the decision instead of making it again.
- [Vision](vision.md) and [settings](settings.md): what the interaction should feel like, and every option with its default, so visible changes stay consistent.
- `npm run check`: types, lint, formatting and unit tests, run before a session is called done. [CI](../.github/workflows/check.yml) runs the same check on every push to `main` and every pull request.

## The loop

1. **Plan a step.** Each step is small enough for one session and names what done looks like. Ideas that are not next go under **Parked** rather than into the current step.
2. **Build it.** The agent writes the code and its tests, and updates the matching doc in the same change.
3. **Check what can be checked.** Tests for the rules; the iOS simulator or the web preview for anything visible, with frame time measured for anything that draws. Shader changes are always looked at, since tests cannot see them.
4. **Record it.** The step moves to **Built** with what was verified and what was not, and anything only a person can judge is added to the manual section at the end of the plan.
5. **Explore, then reduce.** Many looks and effects were tried and dropped (solid painted arenas, a halo and mirror images for depth in 8-ball, a cue along the aim line). The plan records why, so they are not tried again.

## What the agent verified

- **Unit tests** for the physics, showdown odds and titles, 8-ball contacts and rules, the computer opponent, trails, synthesised tones, and the cleaning of saved options: 234 tests in 22 suites.
- **The simulator.** Each visible step was run in a development build on the iOS simulator, often with a temporary probe to set up a table or a fight, and frame times were recorded in the plan.
- **The web preview.** The same code built for a browser, used to check layouts and to take the screenshots in the README.
- **Simulation for design choices.** The 8-ball ruleset, the opponent's strength and showdown pacing were chosen from simulated games and fights, and the plan marks those numbers as simulated.

## What is left to a person

Section 10 of the [plan](plan.md) collects everything a simulator cannot judge: feel and tuning on a phone, haptics, sound through a speaker and the silent switch, frame time on the oldest supported phone, whether gestures are found without being told, and VoiceOver. It is deliberately last and never blocks other work.
