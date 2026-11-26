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

`attract` in `core/pull` draws pairs together before each step, with equal and opposite force, rising from nothing at `reach`. It bends fast bubbles but speeds none past `TUNING.pull.fastest`. `weary` holds how tired each pair is: closeness tires it, touching at once, and time apart restores it. So none clump, circle for ever or gain speed without end. Held, joining and shy bubbles feel nothing. In a showdown it acts only during the fight, beneath the hunting.

With a Trail chosen, `layTrails` in `core/trail` ends each step by laying points behind free bubbles: every so often on straights, exactly at turns. Each point keeps the way a ribbon lies there, which faces the eye, never flips, and holds when flying straight away. A trail outlives its bubble and fades where it hangs. `scene/trails` draws it as triangle strips cut into short pieces, sorted among the bubbles by depth. A strip's texture coordinates are age and place across, so colours stay where they were laid; it is hidden where it would cross its own bubble's disc. A look with a `gap` is drawn as separate discs instead (`imagesOf`), placed by distance travelled in radii (`along`), so they stay where they were set down.

A pop leaves a `Puff` where it was. Its front spreads, and `feelPuffs` in `core/puff` gives each bubble it reaches a push that swells and passes, less when far or large, speeding nothing past `TUNING.puff.fastest`. Bubbles born after the pop, its own pieces among them, feel nothing; held ones only shiver; showdowns have none. `popped` keeps the largest pop until the scene takes it for the haptic, which outranks a wall's.

`Hint` in `core/hint` is its own shared value beside the world: it waits, plays and fades, and reports once when told, so React can save it. `scene/hint` draws it last, unbent by glass, as one shader rect in the box's ink, only while it plays.

Meetings and pops add a `Burst`: contact normal, sideways rub (`spin`), strength and both styles. `drawBurst` draws it as one additive shader rect aimed along the normal.

Options reach the scene as lists: one entry, or all for Random. `feelOf` and `trailOf` give each bubble a feel and a trail from its id; `variant` on a wave and its ring picks the glass.

Past `maxBubbles`, the oldest pops.

## Picker

Each preview is a small `World` in its own box, driven by `preview/scripts` and drawn by `drawScene`, all on one canvas. Coordinates are absolute, so glass needs no transform. While it is open the main room's loop is paused. `scene/gpu` holds the shaders both share.

## Showdown

`Showdown` has its own `World` with a `duel`, in a shallower box, and its own loop while the room is paused. `direct` in `core/duel` runs each step: entrants line up at one size and depth (`lineup`, nearer than the middle), then turn towards the nearest rival, harder the longer nobody has met. The nearest pair always face each other, so it always ends. `paceOf` slows time for the last pair. React hears only of a clash, the start and the win.

`ui/Showdown` hands touches in the line-up to the frame loop as shared values: `hold` keeps it waiting and `choose` in `core/showdown` sets `duel.favourite` and `rage`, only before the start. `rampage` in `core/duel` steers a raging favourite in place of the hunting, and `oddsOf` weighs it. The line-up's swelling in runs on the world's clock, as the duel's is held back. `drawHalo` draws the light from two gradients made once, beneath its film.

`settle` in `core/world` decides a contact once. `oddsOf` is by volume to the power `edge`: Pop is 0, always even; Absorb is 1/3, in proportion to width, so equals are even and twice the width wins two times in three. Under Absorb the loser gets a `join` and `sink` drains it across. Under both rules the winner's `duel.sizes` entry is multiplied by `grow` up to `largest`, and `swell` grows it there; until `grown`, it only bounces; odds use those. `duel.log` keeps every knock-out; `core/feats` reads it once, at the win, for special titles. A winner may lose while still draining another: chains drain through. An emptied bubble stops sinking, as two empty ones have no mass to share.

`strike` sets a surface ringing in modes 2 and 3 about an axis, with Rayleigh's stiffness and damping, so large bubbles ring slow and long.

`scene/liquid` draws a bubble and whatever it is taking in as one smooth union, marched per pixel; a lone calm bubble is a plain sphere. The arena is `roomPicture` with a faint mural under a film's colours, both static. Distance (`AIR`, `awayAt`) hazes, dims and softens: in the film's shader for each part of a surface by its own depth, and for figures by fading to a second painting as seen at the back wall. `scene/roomContact` is one full-screen pass beneath the bubbles: it finds the wall behind each pixel, as `walls` does, and adds every bubble's shadow, thrown light and mirror image; `drawRipple` then rings the walls. Films bend a picture of the arena painted once on the CPU. Figures are images painted once. An entrant's place in its cast picks one of twelve vapours; in a mixed cast of more, vapours repeat but colours do not.

## 8-ball

`ui/Pool` covers the room, in the same box and view. What is in the hand is a small `World` with one hold, advanced by the calm code at one size (`World.steady`); on release its bubble becomes the cue ball (`enter`) of a `Pool`, whose contacts `core/pool` solves exactly. `traceAhead` runs the same contacts for the line. Trails are `core/trail`'s points, laid by `core/pool` with two at each contact so strips join cleanly, and cut and drawn by `scene/trails` with pool's own look. Turns are `core/poolGame`: `beginShot` as a cue ball enters, then once `stillTable`, `judge` gives the shot's verdict (pots, the first ball struck, a foul) and `endShot` passes the turn or keeps it, by `config/poolRules`. A finger down before then waits, and gets its cue ball as the turn is settled. A still table with no finger draws nothing. With Opponent on Computer, `core/opponent` plays player 2: each frame of its turn on a still table, `opponentTurn` looks at one ball for pots or plays the likeliest shots out on a copy of the table (`advancePool` with a longer step), then says what its hand does (hold, move, send), which `ui/Pool` acts out through the same hand as a finger, under its own id. Its menu is `ui/Tray` with `config/poolOptions`; choices reach `ui/Pool` as `settings`. See [pool](pool.md).

## Mode switch

`ui/ModeSwitch` shows the calm room, a showdown and 8-ball as three static pictures, drawn by the real bubble shaders and kept for a width. It sits at the same place in both trays and the chooser, so it reads as one switch.

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
