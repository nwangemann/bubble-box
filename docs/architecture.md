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

Each step: grow and move held bubbles, integrate free bubbles, resolve bubble contacts, then walls last so nothing ends outside. Bubbles have equal density; a held bubble has infinite mass, and held bubbles only press each other apart along the glass. Squash is a damped spring per axis, visual only.

A touch that starts on a bubble stays hidden and weightless while it is `undecided`. With tap to pop, releasing within `TUNING.tap.seconds` without moving pops that bubble. Setting off within `TUNING.flick.decide` and lifting within `flick.seconds` flicks it: the bubble beneath takes a share of the finger's velocity, scaled by depth to keep pace on the screen, and nothing is born. Anything else grows as usual. A two-finger sweep can still claim an undecided touch.

A curved swipe gives `spin` about the line of sight, from how far the finger's path bent in its last moments. Spin rotates the sideways velocity, kicks off side walls, fades, and turns the surface through the `turn` uniform.

`Tilt` listens to Reanimated's gravity sensor while the room runs and some feel has `tilt`. `core/tilt` turns it into one pull, measured from how the phone rests; that rest follows the hand over `TUNING.tilt.settle` seconds, and starts afresh in an empty room. A feel's `tilt` says how much it answers.

Each finger has its own `Held`, keyed by touch id. Two fingers down less than `TUNING.sweep.fresh` seconds that both travel start a sweep: what they began is taken back, and they pop what they cross, including the path so far. Other fingers keep their bubbles. Bubbles born or launched during the sweep are spared. `swipeOf` measures launch speed from the finger's last moments.

With Contact on Merge, two free bubbles that touch become one over `TUNING.merge.seconds`. The smaller (`join`) is drawn in, fades and passes its volume over bit by bit; momentum and centre of mass go with it, so nothing jumps. It passes through other bubbles, can be popped, and pops with the larger. `reach` bulges both edges towards each other in the style shader's `main`. A pair that would pass `maxRadius` bounces, and held bubbles never merge. `merges` on the world works like the other lists: each pair keeps one entry.

Meetings and pops add a `Burst`: contact normal, sideways rub (`spin`), strength and both styles. `drawBurst` draws it as one additive shader rect aimed along the normal.

Options reach the scene as lists: one entry, or all for Random. `feelOf` gives each bubble a feel from its id; `variant` on a wave and its ring picks the glass.

Past `maxBubbles`, the oldest pops.

## Picker

Each preview is a small `World` in its own box, driven by `preview/scripts` and drawn by `drawScene`, all on one canvas. Coordinates are absolute, so glass needs no transform. While it is open the main room's loop is paused. `scene/gpu` holds the shaders both share.

## Showdown

`Showdown` has its own `World` with a `duel`, in a shallower box, and its own loop while the room is paused. `direct` in `core/duel` runs each step: entrants line up at one size and depth, then turn towards the nearest rival, harder the longer nobody has met. The nearest pair always face each other, so it always ends. `paceOf` slows time for the last pair. React hears only of a clash, the start and the win.

`settle` in `core/world` decides a contact once. `oddsOf` is by volume to the power `edge`: Pop is 0, always even; Absorb is 1/3, in proportion to width, so equals are even and twice the width wins two times in three. Under Absorb the loser gets a `join` and `sink` drains it across. Under both rules the winner's `duel.sizes` entry is multiplied by `grow` up to `largest`, and `swell` grows it there; until `grown`, it only bounces; odds use those. `duel.log` keeps every knock-out; `core/feats` reads it once, at the win, for special titles. A winner may lose while still draining another: chains drain through.

`strike` sets a surface ringing in modes 2 and 3 about an axis, with Rayleigh's stiffness and damping, so large bubbles ring slow and long.

`scene/liquid` draws a bubble and whatever it is taking in as one smooth union, marched per pixel; a lone calm bubble is a plain sphere. The arena is `roomPicture` with a faint mural, both static. Films bend a picture of the arena painted once on the CPU. Figures are images painted once. An entrant's cast number picks one of twelve vapours.

## Maker

`ui/Maker` edits the Custom bubble while the room is paused. `customLook` turns the choices into plain numbers (`mine`) handed to every draw. Custom is the only style with extra uniforms; `drawBubble` adds them after the shared ones.

## Scene

- `roomPicture` records the room once per environment, shown on its own canvas.
- `walls` draws wall materials into the room once, and a moving light pass: glowing bubbles on the walls, and caustics in water. Both undo the perspective per pixel to find the wall. The light pass runs only with a glowing bubble or water; an empty Water room settles, then draws nothing.
- `dress` in `config/environments` turns a box, its light and the sliders into the `Environment` that gets drawn.
- A hit on the glass adds a `Wave` to the world. While any wave lives and the Glass option is on, the room and bubbles are drawn together through `glassFilter`, a full-screen refraction. Otherwise that pass does not run. It works in device pixels.
- `drawScene` draws ripples, then bubbles far to near. Each bubble is one rect with its style's shader, in local coordinates where the edge is at 1.
- Shader uniforms are positional. Their order is shared by `styles/prelude.ts` and `drawBubble`; for effects, by `fx/shell.ts` and `drawBurst`.
- The held bubble keeps the style it was born with, so styles mix in one room.
