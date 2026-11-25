# Plan

Each box is one small session. Tick it when done and move **Next**.

**Next: Phase 4, background refraction.** Phases are in priority order, not number order: 4, 5 and 2b first, then the rest. Phase 6 was built out of turn. Phase 1 sits last because it needs a person with a phone.

## Phase 4: bubble

- [x] Custom colour and pattern
- [ ] On a phone: judge the maker and its patterns
- [x] Bubbles that merge
- [ ] On a phone: judge merging and tune `TUNING.merge`
- [ ] Background refraction
- [ ] Style that shifts with speed or age

## Phase 6: showdown

Twelve unique themed bubbles meet; one of each pair survives; the last one wins.

- [x] Six arenas of twelve unique entrants: Medieval, Western, Space, Pirates, Haunted, Food Fight
- [x] Absorb (the winner takes the loser in, and size sways the odds) and Pop (always even)
- [x] Coalescence drawn as one ray-marched surface; winner persists under a soft glow
- [x] 2 to 12 entrants, chosen with the rule in the showdown chooser
- [ ] On a phone: judge pace, the merge and the odds; tune `TUNING.showdown`; measure frame time with 12
- [ ] Depth and motion paths: make it plain where each entrant is in the arena, where it is going and why two met or missed
  - [ ] Keep the depth of the box in every arena: walls, floor and ceiling that recede to a back wall in the theme's own materials (castle hall, main street, hangar, ship's hold, crypt, kitchen), instead of a flat backdrop
  - [ ] Depth cues on bubbles: haze, dimming and softer focus with distance, shadows and reflections on floor and walls, light from a bubble on a wall it nears, ripples where it hits
  - [ ] Judge whether the arena should be deeper than `TUNING.showdown.depth` once depth reads well
  - [ ] Trails behind moving bubbles, narrowing and fading with perspective so they show depth too. Explore, then reduce: a thin iridescent film ribbon; a wake that bends the background like heat; fine mist or micro-bubbles that drift and sink; a soft thread of light; the bubble's own dye as ink in water; faint afterimages; a themed trail per arena (embers, dust, stardust, sea foam, wisps, steam)
  - [ ] Trails that tell the story: longer and brighter with speed, two that braid where bubbles merge, the winner's whole path drawn once at the end
  - [ ] Trails as a choice with None and Random; None under Reduce Motion; measure frame time with 12
- [ ] Paint the arenas less like cartoons, to sit with the films
- [ ] Full customisation: arena apart from cast, mixed casts (all 72, so more than 12 can enter without repeats), share absorbed, odds, pace, bubble size, depth, slow motion
- [ ] Pick a favourite before the start; keep a quiet tally of winners
- [ ] More archetypes: Olympus, dinosaurs, deep sea, robots, winter, insects
- [ ] Showdown sound: music per theme, coalescence and pop sounds pitched by size, a triumphant flourish for the winner. Needs `expo-audio`, an ADR, a native rebuild and licensed or synthesised audio; off with the silent switch

## Phase 7: liquid-filled bubbles

Exploration: bubbles that hold a liquid with its own behaviour. Start from `scene/liquid` and `ring` in `core/duel`.

- [ ] A fill level whose surface tilts and sloshes as the bubble moves and spins
- [ ] Viscosity: water, oil, honey, mercury, slime, tar. Sets sloshing, ringing and how fast bubbles merge
- [ ] Temperature: hot rises, shimmers and steams; cold sinks, frosts and slows; meeting ones exchange heat, with convection, boiling and freezing
- [ ] Density and mixing: liquids that mix, layer, or stay apart (oil in water, lava lamp, ouzo clouding)
- [ ] Colour: dyes that diffuse, pigments that swirl, colour that follows heat, depth or speed
- [ ] Odd physics: ferrofluid spikes, shear-thickening that stiffens when struck, surface-tension gradients, foam, carbonation, glowing plankton, liquid crystal, two-phase droplets
- [ ] Meeting effects by pair: fizz, freeze, ignite, curdle, change colour
- [ ] Measure frame time; pick the few that are loved

## Phase 5: sound and release

- [ ] Optional soft tones, pitched by size
- [ ] Android pass
- [ ] Store listing

## Phase 2b: pop and meeting effects

Everything here is selectable, with Random available and None as the default. What is built, and what needs a phone, is under Phase 2b, continued.

- [ ] Second round of weird: reaction-diffusion bloom, strange attractor threads, cymatics, smoke knots, a fractal that zooms as it fades
- [ ] Wall-hit effects from the same system
- [ ] Style-specific pop and meeting effects
- [ ] Pop pushes nearby bubbles, and has its own haptic
- [ ] Measure frame time with several bursts on screen

## Phase 0: foundation (built)

- [x] Project, stack decision, docs
- [x] Physics core with tests
- [x] Hold, grow, launch, swipe
- [x] Walls, rebound, squash, ripples, bubble contacts
- [x] 12 bubble styles, 4 environments, 5 feels, tray
- [x] Glass ripple on the screen side, with a toggle
- [x] Tap a bubble to pop it, as an option
- [x] Chosen defaults, and Random for every setting ([settings](settings.md))

## Phase 2: touch depth

- [ ] (blocked) Finger pressure and size shape the growing bubble. Gesture Handler reports only positions, so this needs a small native module, an ADR and a phone; recent iPhones report size but not pressure
- [x] Curved swipes add spin
- [ ] Tune `TUNING.spin` on a phone
- [x] Several fingers grow several bubbles
- [ ] On a phone: judge several fingers, swipe strength and telling a sweep from growing (`TUNING.sweep`, `swipe`)
- [x] Flick a bubble to nudge it
- [ ] Tune `TUNING.flick` on a phone, and judge whether it gets in the way of launching from a crowd
- [x] Tilt adds a gentle gravity
- [ ] Tune `TUNING.tilt` on a phone (simulators have no sensor), and judge whether it wants its own setting

## Phase 2a: clearing bubbles

Two-finger swipe is the way to clear bubbles; a single tap makes one. Tap to pop stays as an option.

- [x] Two-finger swipe pops what it crosses
- [ ] Tune `TUNING.sweep` on a phone
- [ ] First-time hint: after the first bubble, quietly suggest the two-finger swipe, once
- [ ] Investigate more ways, possibly several at once: double tap on empty space lets all go, pinch until it bursts, bubbles that age and pop
- [ ] Make the swipe leave a wake that pushes nearby bubbles

## Phase 2b, continued: pop and meeting effects

Exploration. Everything below is selectable, with Random available and None as the default; reduce at the end.

- [x] Pop as a selectable option: film, droplets, mist, shatter, starlight, implode, brood, plus three fractal ones
- [x] Bubble-to-bubble effects: sparks, chiral, sunflower, frost, Kali, Julia, chord, Apollo
- [ ] Live with Meet and Pop on Random on a phone; note loved and unloved effects
- [ ] Reduce to the preferred set and choose defaults

## Phase 2c: preview picker

Tapping a category title in the tray (such as Bubble) opens a modal showing a medium, gently moving preview of every option in that category. Tapping a preview selects it. The names in the row stay as the quick way to choose.

- [x] Bubble first: a grid of live bubbles, drawn with the real style shaders and a slow breathing drift
- [x] Decide how the modal looks and closes while staying calm (full screen or sheet; room still visible behind or not)
- [x] Draw all previews on one canvas, only while open; pause the room behind and measure frame time (simulator: 1 to 3 ms of work per frame, 60 fps)
- [x] Box: small rooms with a drifting bubble
- [x] Meet and Pop: the effect looping, with a pause between plays
- [x] Glass: a looping ripple
- [x] Feel: a bubble moving in a small box with that physics
- [x] Decide whether Tap needs previews, and what Random and None show
- [x] Make titles look tappable: raised white buttons, pinned beside the names; Reduce Motion shows stills
- [ ] On a phone: judge the picker and measure its frame time

## Phase 3: box

- [x] Frost, water, silk and stone walls
- [x] Wall opacity and softness sliders
- [x] Walls lit by nearby glowing bubbles
- [x] Day and night backdrops
- [ ] On a phone: judge materials, day and wall light; measure frame time with 10 glowing bubbles in Water

## Phase 1: finish the MVP on a phone

- [ ] 1.1 (needs you; 1.2 to 1.7 too) Install on a phone and note what feels wrong
- [ ] 1.2 Tune growth: start size, pace, largest size
- [ ] 1.3 Tune launch: hold power, swipe strength, depth of the box
- [ ] 1.4 Tune rebound, drift and wobble
- [ ] 1.5 Tune haptics
- [ ] 1.6 Pick favourite styles; keep 5 or 6
- [ ] 1.7 Measure frame time with 10 bubbles on the oldest phone to support
- [x] 1.8 Respect Reduce Motion
- [x] 1.9 Remember the chosen options
- [x] 1.10 App icon and splash (first version; confirm on a phone)

MVP is done when a stranger understands it without words, and it holds 60 fps with 10 bubbles.
