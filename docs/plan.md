# Plan

In priority order, for iOS. Each numbered box is one small session: do the first open one, tick it, and move **Next**. For anything that draws, check frame time on the simulator in the same session; device numbers come in 8.

**Next: 1.3, contact with the room.**

Sections 1 to 7 need no device. Section 8 needs a person, mostly with a phone, and stays last.

## 1. Showdown depth

Make it plain where each entrant is, where it is going, and why two met or missed.

- [x] 1.1 See-through grid rooms for all six arenas: the core app's Lattice in each theme's colours, with the old scenery as a faint mural on the back wall. Solid painted rooms were tried and dropped: they hid the depth
- [x] 1.2 Depth cues on bubbles: haze, dimming and softer focus with distance (`AIR` in `config/arena`)
- [ ] 1.3 Contact with the room: shadows and reflections on floor and walls, light on a wall a bubble nears, ripples where it hits
- [ ] 1.4 Try a deeper arena (`TUNING.showdown.depth`) now that depth reads
- [ ] 1.5 Redraw the murals less like cartoons, still faint, to sit with the films

## 2. Trails

Behind moving bubbles, narrowing and fading with perspective. Explore, then reduce.

- [ ] 2.1 Trail system and its option, with None and Random, and None under Reduce Motion; first trail: a thin iridescent film ribbon
- [ ] 2.2 Light and afterimages: a soft thread of light; faint afterimages
- [ ] 2.3 Matter: mist or micro-bubbles that drift and sink; the bubble's own dye as ink in water
- [ ] 2.4 A wake that bends the background like heat
- [ ] 2.5 A themed trail per arena: embers, dust, stardust, sea foam, wisps, steam
- [ ] 2.6 Trails that tell the story: longer and brighter with speed, two that braid where bubbles merge, the winner's whole path drawn once at the end

## 3. Liquid-filled bubbles

Exploration: bubbles that hold a liquid with its own behaviour. Start from `scene/liquid` and `ring` in `core/duel`.

- [ ] 3.1 A fill level whose surface tilts and sloshes as the bubble moves and spins
- [ ] 3.2 Viscosity (water, oil, honey, mercury, slime, tar): sets sloshing, ringing and how fast bubbles merge
- [ ] 3.3 Colour: dyes that diffuse, pigments that swirl, colour that follows depth or speed
- [ ] 3.4 Density and mixing: liquids that mix, layer or stay apart (oil in water, lava lamp, ouzo clouding)
- [ ] 3.5 Temperature: hot rises, shimmers and steams; cold sinks, frosts and slows; colour follows heat
- [ ] 3.6 Heat exchange when bubbles meet: convection, boiling, freezing
- [ ] 3.7 Meeting effects by pair: fizz, freeze, ignite, curdle, change colour
- [ ] 3.8 Odd physics, struck or pulled: ferrofluid spikes, shear-thickening that stiffens when struck, surface-tension gradients
- [ ] 3.9 Odd physics, within: foam, carbonation, glowing plankton, liquid crystal, two-phase droplets

## 4. Bubble looks and touch

- [ ] 4.1 Background refraction
- [ ] 4.2 Style that shifts with speed or age
- [ ] 4.3 Pop pushes nearby bubbles, and has its own haptic
- [ ] 4.4 The two-finger swipe leaves a wake that pushes nearby bubbles
- [ ] 4.5 First-time hint: after the first bubble, quietly suggest the two-finger swipe, once
- [ ] 4.6 More ways to clear: double tap on empty space lets all go, pinch until it bursts, bubbles that age and pop

## 5. Showdown play

- [ ] 5.1 Arena apart from cast
- [ ] 5.2 Mixed casts from all 72, so more than 12 can enter without repeats
- [ ] 5.3 Rule options: growth, odds, pace, bubble size, depth, slow motion
- [ ] 5.4 Predict the winner: explore a step before each showdown for choosing a favourite to root for
  - A favourite selector, from the line-up or the roster; quick to skip, and never in the way of Again
  - Mark the favourite in the arena and roster if it can be subtle: a soft halo, a warmer rim, a small pennant or a faint thread of light; judge against trails and films
  - A moment when the favourite wins or falls, gentle either way; a title for calling it right, beside those of 5.5
  - A quiet tally of winners and right calls, without it becoming a score
- [x] 5.5 Special titles for unusual wins: shared by every arena, stacked when several fit (`config/feats`)
- [ ] 5.6 More archetypes, one per session: Olympus, dinosaurs, deep sea, robots, winter, insects

## 6. Effects

Everything here is selectable, with Random available and None as the default.

- [ ] 6.1 Wall-hit effects from the meet and pop system
- [ ] 6.2 Style-specific pop and meeting effects
- [ ] 6.3 Second round of weird: reaction-diffusion bloom, strange attractor threads, cymatics, smoke knots, a fractal that zooms as it fades

## 7. Sound

One audio decision for the whole app. Off with the silent switch. Synthesised, unless licensed audio is chosen.

- [ ] 7.1 Audio foundation: `expo-audio`, an ADR, a native rebuild
- [ ] 7.2 Optional soft tones, pitched by size
- [ ] 7.3 Showdown: coalescence and pop sounds pitched by size, a triumphant flourish for the winner
- [ ] 7.4 Showdown music per theme

## 8. Needs you

In order. 8.1 to 8.7 need a phone.

- [ ] 8.1 Install and note what feels wrong; confirm icon and splash
- [ ] 8.2 Frame time on the oldest phone to support: 10 bubbles; 10 glowing bubbles in Water; several bursts; the picker; showdown with 12; then trails and liquids
- [ ] 8.3 Tune the core: growth (start size, pace, largest size), launch (hold power, swipe strength, depth of the box), rebound, drift, wobble, haptics
- [ ] 8.4 Tune gestures: several fingers, `swipe`, `TUNING.sweep`, `spin`, `flick` (does it get in the way of launching from a crowd?), `tilt` (does it want its own setting?)
- [ ] 8.5 Judge looks: maker and patterns, merging (`TUNING.merge`), materials, day and wall light, the picker
- [ ] 8.6 Judge showdown: grid, mural and distance strength (`config/arena`), how often titles appear (`config/feats`), pace, merge and odds; tune `TUNING.showdown`
- [ ] 8.7 Live with Meet and Pop on Random; note loved and unloved effects
- [ ] 8.8 Reduce: keep 5 or 6 styles, the loved effects, trails and liquids; choose defaults
- [ ] 8.9 Store listing
- [ ] 8.10 (blocked) Finger pressure and size shape the growing bubble. Gesture Handler reports only positions, so this needs a small native module, an ADR and a phone; recent iPhones report size but not pressure

MVP is done when a stranger understands it without words, and it holds 60 fps with 10 bubbles.

## Built

- Foundation: project, docs, physics core with tests, hold, launch, walls, ripples, contacts, 12 styles, 4 environments, 5 feels, tray, glass ripple, tap to pop, defaults and Random ([settings](settings.md))
- Saved settings, Reduce Motion, first icon and splash
- Touch: curved-swipe spin, several fingers, flick, tilt, two-finger swipe to pop
- Effects: pops (film, droplets, mist, shatter, starlight, implode, brood, three fractal) and meetings (sparks, chiral, sunflower, frost, Kali, Julia, chord, Apollo)
- Preview picker for every category, on one canvas (simulator: 1 to 3 ms per frame, 60 fps)
- Box: frost, water, silk and stone walls, opacity and softness sliders, wall light, day and night
- Bubble: custom colour and pattern, merging
- Showdown: six arenas of twelve unique entrants, Absorb (size sways the odds) and Pop (always even), ray-marched coalescence, winner's glow, 2 to 12 entrants, chooser
