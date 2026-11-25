# Architecture

```
touch ─▶ Scene (UI thread) ─▶ core/world ─▶ drawScene ─▶ one Skia picture per frame
              ▲                  ▲              ▲
           App state       config/tuning   styles (SkSL)
```

The whole loop (touch, physics, drawing) runs on the UI thread. React renders only when an option changes.

## Coordinates

1 unit is half the screen width. Origin is the centre of the glass; x right, y down, z away. `scaleAt(z) = focal / (focal + z)`, so z = 0 lines up exactly with the screen edges.

## Core

`World` is plain mutable data in one shared value. `advance` runs fixed 1/120 s steps, so motion is the same at 60 and 120 Hz. Frames longer than 1/20 s are shortened.

Each step: grow and move the held bubble, integrate free bubbles, resolve bubble contacts, then walls last so nothing ends outside. Bubbles have equal density; a held bubble has infinite mass. Squash is a damped spring per axis, visual only.

A touch that starts on a bubble stays hidden and weightless for `TUNING.tap.seconds`. Released sooner without moving, it pops that bubble; held longer, it grows as usual.

A second finger starts a sweep: the first finger's new bubble is taken back, and fingers pop what they cross. Bubbles born during the sweep are spared.

Meetings and pops add a `Burst`: contact normal, sideways rub (`spin`), strength and both styles. `drawBurst` draws it as one additive shader rect aimed along the normal.

Options reach the scene as lists: one entry, or all for Random. `feelOf` gives each bubble a feel from its id; `variant` on a wave and its ring picks the glass.

Past `maxBubbles`, the oldest pops.

## Picker

Each preview is a small `World` in its own box, driven by `preview/scripts` and drawn by `drawScene`, all on one canvas. Coordinates are absolute, so glass needs no transform. While it is open the main room's loop is paused. `scene/gpu` holds the shaders both share.

## Scene

- `roomPicture` records the room once per environment, shown on its own canvas.
- A hit on the glass adds a `Wave` to the world. While any wave lives and the Glass option is on, the room and bubbles are drawn together through `glassFilter`, a full-screen refraction. Otherwise that pass does not run. It works in device pixels.
- `drawScene` draws ripples, then bubbles far to near. Each bubble is one rect with its style's shader, in local coordinates where the edge is at 1.
- Shader uniforms are positional. Their order is shared by `styles/prelude.ts` and `drawBubble`; for effects, by `fx/shell.ts` and `drawBurst`.
- The held bubble keeps the style it was born with, so styles mix in one room.
