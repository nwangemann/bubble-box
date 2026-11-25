# Plan

For iOS. Each numbered box is one small session. Sections are in order of priority: do the first open step, top to bottom, then move it to **Built** and move **Next**. Numbers of finished steps are not reused. For anything that draws, check frame time on the simulator in the same session; device numbers come in 2.2.

**Next: 1.1, 8-ball on paper.**

Without a phone, skip 2 and 7.1 to 7.3, and leave 1.3 to 1.5 until 1.2 has been judged on one. Start no liquids (6) before 2.2. Section 8 is parked until 7.4; section 9 is blocked.

## 1. 8-ball in space

A third mode beside Calm and Showdown: 8-ball pool in 3D, played rather than watched. As true to billiards as possible, in a weightless box. The aim is that it feels fun and engaging; if it does not, drop it. 1.1 and 1.2 are a trial: go on to 1.3 to 1.5 only if a shot is fun.

- [ ] 1.1 Explore on paper: where pockets go in a box (corners, edges, faces), how the rack forms in space, what cushions and cloth become, how a ball comes to rest, and how to aim and judge depth through a flat screen. Settle the rules to keep, and how a game with scores and turns fits [vision](vision.md)
- [ ] 1.2 Trial: cue ball, a few balls and pockets; aim, set power, shoot. True collisions, spin and rails, our own physics (ADR 1). Find the aim and camera that make a shot readable and satisfying, then judge on a phone
- [ ] 1.3 The full game: rack and break, solids and stripes, calling the 8, scratches and fouls, ball in hand, two players passing the phone
- [ ] 1.4 English, draw and follow, chosen by where the cue strikes
- [ ] 1.5 The mode itself: a third side to the mode switch, looks for table and balls, an opponent to play alone

## 2. First time on a phone

Needs you and a phone, so that feel and frame time are known before more is built.

- [ ] 2.1 Install and note what feels wrong; confirm icon and splash
- [ ] 2.2 Frame time on the oldest phone to support: 10 bubbles, without and with each trail; 10 glowing bubbles in Water; several bursts, with pops pushing neighbours; the picker; showdown with 12. Repeat after 6.2
- [ ] 2.3 Tune the core: growth (start size, pace, largest size), launch (hold power, swipe strength, depth of the box), rebound, drift, wobble, the push of a pop (`TUNING.puff`), haptics
- [ ] 2.4 Tune gestures: several fingers, `swipe`, `TUNING.sweep`, `spin`, `flick` (does it get in the way of launching from a crowd?), `tilt` (does it want its own setting?), the first-time hint (`TUNING.hint`; is it understood?)

## 3. Showdown play

- [ ] 3.1 Arena apart from cast
- [ ] 3.2 Mixed casts from all 72, so more than 12 can enter without repeats
- [ ] 3.3 Predict the winner: explore a step before each showdown for choosing a favourite to root for
  - A favourite selector, from the line-up or the roster; quick to skip, and never in the way of Again
  - Mark the favourite in the arena and roster if it can be subtle: a soft halo, a warmer rim, a small pennant or a faint thread of light; judge against trails and films
  - A moment when the favourite wins or falls, gentle either way; a title for calling it right, beside the titles for unusual wins (`config/feats`)
  - A possible variant, roid rage: the favourite is far likelier to win each collision, at the cost of wild swings in intensity, speed and path; it may veer at other bubbles rather than hold an organic course
  - A quiet tally of winners and right calls, without it becoming a score

## 4. Sound

One audio decision for the whole app. Off with the silent switch. Synthesised, unless licensed audio is chosen.

- [ ] 4.1 Audio foundation: `expo-audio`, an ADR, a native rebuild
- [ ] 4.2 Optional soft tones, pitched by size

## 5. Showdown trails

Build on the trails in **Built**. Explore, then reduce.

- [ ] 5.1 A themed trail per arena: embers, dust, stardust, sea foam, wisps, steam
- [ ] 5.2 Trails that tell the story: longer and brighter with speed, two that braid where bubbles merge, the winner's whole path drawn once at the end

## 6. Liquid-filled bubbles

A trial of bubbles that hold a liquid with its own behaviour. Start from `scene/liquid` and `ring` in `core/duel`. Unpark the rest (8.4 to 8.10) only if these look good and hold 60 fps on the phone.

- [ ] 6.1 A fill level whose surface tilts and sloshes as the bubble moves and spins
- [ ] 6.2 Viscosity (water, oil, honey, mercury, slime, tar): sets sloshing, ringing and how fast bubbles merge

## 7. Judge, reduce, release

Needs you; 7.1 to 7.3 need a phone.

- [ ] 7.1 Judge looks: maker and patterns, merging (`TUNING.merge`), materials, day and wall light, the picker
- [ ] 7.2 Judge showdown: grid, mural, distance and wall contact strength (`config/arena`), how often titles appear (`config/feats`), pace, merge and odds; tune `TUNING.showdown`
- [ ] 7.3 Live with Meet and Pop on Random; note loved and unloved effects
- [ ] 7.4 Reduce: keep 5 or 6 styles, the loved effects, trails and liquids; choose defaults
- [ ] 7.5 Store listing

MVP is done when a stranger understands it without words, and it holds 60 fps with 10 bubbles.

## 8. Parked

### Trails

- [ ] 8.1 Matter: mist or micro-bubbles that drift and sink; the bubble's own dye as ink in water
- [ ] 8.2 A wake that bends the background like heat
- [ ] 8.3 Investigate, once the trails are in: does a fluid filling the box make motion easier to follow? Try a visible medium that bubbles push, drag and swirl, with drifting specks to show the flow; compare it with trails alone and with both, and check frame time. Keep it, fold it into trails or drop it

### Liquids

- [ ] 8.4 Colour: dyes that diffuse, pigments that swirl, colour that follows depth or speed
- [ ] 8.5 Density and mixing: liquids that mix, layer or stay apart (oil in water, lava lamp, ouzo clouding)
- [ ] 8.6 Temperature: hot rises, shimmers and steams; cold sinks, frosts and slows; colour follows heat
- [ ] 8.7 Heat exchange when bubbles meet: convection, boiling, freezing
- [ ] 8.8 Meeting effects by pair: fizz, freeze, ignite, curdle, change colour
- [ ] 8.9 Odd physics, struck or pulled: ferrofluid spikes, shear-thickening that stiffens when struck, surface-tension gradients
- [ ] 8.10 Odd physics, within: foam, carbonation, glowing plankton, liquid crystal, two-phase droplets

### Bubble looks and touch

- [ ] 8.11 Background refraction
- [ ] 8.12 Style that shifts with speed or age
- [ ] 8.13 The two-finger swipe leaves a wake that pushes nearby bubbles
- [ ] 8.14 More ways to clear: double tap on empty space lets all go, pinch until it bursts, bubbles that age and pop

### Showdown

- [ ] 8.15 Rule options: growth, odds, pace, bubble size, depth, slow motion
- [ ] 8.16 More archetypes, one per session: Olympus, dinosaurs, deep sea, robots, winter, insects

### Effects

Selectable, with Random available and None as the default.

- [ ] 8.17 Wall-hit effects from the meet and pop system
- [ ] 8.18 Style-specific pop and meeting effects
- [ ] 8.19 Second round of weird: reaction-diffusion bloom, strange attractor threads, cymatics, smoke knots, a fractal that zooms as it fades

### Showdown sound

- [ ] 8.20 Coalescence and pop sounds pitched by size, a triumphant flourish for the winner
- [ ] 8.21 Music per theme

## 9. Blocked

- [ ] 9.1 Finger pressure and size shape the growing bubble. Gesture Handler reports only positions, so this needs a small native module, an ADR and a phone; recent iPhones report size but not pressure

## Built

### Core

- Foundation: project, docs, physics core with tests, hold, launch, walls, ripples, contacts, 12 styles, 4 environments, 5 feels, tray, glass ripple, tap to pop, defaults and Random ([settings](settings.md))
- Saved settings, Reduce Motion, first icon and splash
- Touch: curved-swipe spin, several fingers, flick, tilt, two-finger swipe to pop
- A pop pushes nearby bubbles (`core/puff`, `TUNING.puff`), not in showdowns, and has its own haptic, crisp or only a tick when small. Adds no drawing; frame time not measured. Feel and haptic to judge in 2.3
- First-time hint: two faint fingertips act out the two-finger swipe, once (`core/hint`, `scene/hint`, `TUNING.hint`). Simulator, one bubble: 60 fps with and without. Whether a stranger reads it is for 2.4
- Effects: pops (film, droplets, mist, shatter, starlight, implode, brood, three fractal) and meetings (sparks, chiral, sunflower, frost, Kali, Julia, chord, Apollo)
- Preview picker for every category, on one canvas (simulator: 1 to 3 ms per frame, 60 fps)
- Box: frost, water, silk and stone walls, opacity and softness sliders, wall light, day and night
- Bubble: custom colour and pattern, merging
- Attraction between bubbles: the Pull option (None, Near, Far, Heavy; Near by default; `config/pulls`) and a gentler one in showdowns (`ARENA_PULL`), with hunting held back (`patience` 2.4, was 1.6) so fights of 12 take about 12 to 16 s, going by nearby settings. Pairs tire when close or touching. Simulated Drift rooms: about 10 to 35% more near meetings, no faster, no clumps. Simulator: 60 fps with 9 fighting
- A Calm and Showdown switch at the foot of the menu and the chooser, each side a window onto its own (`ui/ModeSwitch`). The Showdown row went; Random moved to the chooser
- The menu as tiles: each shows a setting and what is chosen, and opens its previews (`ui/Tray`, `TUNING.menu`). Box's sliders moved under its previews

### Trails

Behind moving bubbles, narrowing and fading with perspective. Frame times are a development build on the simulator with 10 Lively bubbles; check on the phone in 2.2.

- The Trail option (None, Ribbon, Random; None by default and under Reduce Motion; `config/trails`), in the calm room and previews; showdowns come with 5.1. 60 fps, 3.9 ms a frame with Ribbon, 1.5 ms without
- Light, a soft thread of light, and Echo, faint afterimages (`config/trails`), also in Random. 60 fps; about 5 ms a frame with either, 4.2 with Ribbon, 2.3 without

### Showdown

- Six arenas of twelve unique entrants, Absorb (size sways the odds) and Pop (always even), ray-marched coalescence, winner's glow, 2 to 12 entrants, chooser
- Special titles for unusual wins: shared by every arena, stacked when several fit (`config/feats`)
- See-through grid rooms for all six arenas: the core app's Lattice in each theme's colours, with the old scenery as a faint mural on the back wall. Solid painted rooms were tried and dropped: they hid the depth
- Depth cues on bubbles: haze, dimming and softer focus with distance (`AIR` in `config/arena`)
- Contact with the room: shadows and reflections on floor and walls, light on a wall a bubble nears, ripples where it hits (`ROOM_CONTACT` in `config/arena`). Simulator: 60 fps with 12, the same with the pass on or off
- A deeper arena: `TUNING.showdown.depth` 3.6, was 2.4, with the line-up kept at its old depth (`lineup`). Shows more floor and wall; simulated fights of 12 take about 15 s, were 13. Simulator: 60 fps with 12
- Murals redrawn as washes, light and mist (`showdown/scenery`), still faint, with a film's colours drifting over them (`ARENA.sheen`). Simulator: 60 fps with 12
