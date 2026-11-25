# Plan

Each box is one small session. Tick it when done and move **Next**.

**Next: 1.1**

## Phase 0: foundation (built)

- [x] Project, stack decision, docs
- [x] Physics core with tests
- [x] Hold, grow, launch, swipe
- [x] Walls, rebound, squash, ripples, bubble contacts
- [x] 12 bubble styles, 4 environments, 5 feels, tray
- [x] Glass ripple on the screen side, with a toggle
- [x] Tap a bubble to pop it, as an option

## Phase 1: finish the MVP on a phone

- [ ] 1.1 Install on a phone and note what feels wrong
- [ ] 1.2 Tune growth: start size, pace, largest size
- [ ] 1.3 Tune launch: hold power, swipe strength, depth of the box
- [ ] 1.4 Tune rebound, drift and wobble
- [ ] 1.5 Tune haptics
- [ ] 1.6 Pick favourite styles; keep 5 or 6
- [ ] 1.7 Measure frame time with 10 bubbles on the oldest phone to support
- [ ] 1.8 Respect Reduce Motion
- [ ] 1.9 Remember the chosen options
- [ ] 1.10 App icon and splash

MVP is done when a stranger understands it without words, and it holds 60 fps with 10 bubbles.

## Phase 2: touch depth

- [ ] Finger pressure and size shape the growing bubble
- [ ] Curved swipes add spin
- [ ] Several fingers grow several bubbles
- [ ] Flick a bubble to nudge it
- [ ] Tilt adds a gentle gravity

## Phase 2a: clearing bubbles

Two-finger swipe is the way to clear bubbles; a single tap makes one. Tap to pop stays as an option.

- [x] Two-finger swipe pops what it crosses
- [ ] Tune `TUNING.sweep` on a phone
- [ ] First-time hint: after the first bubble, quietly suggest the two-finger swipe, once
- [ ] Investigate more ways, possibly several at once: double tap on empty space lets all go, pinch until it bursts, bubbles that age and pop
- [ ] Make the swipe leave a wake that pushes nearby bubbles

## Phase 2b: pop and meeting effects

Exploration. Everything below is selectable, with Surprise as the default; reduce at the end.

- [x] Pop as a selectable option: film, droplets, mist, shatter, starlight, implode, brood, plus three fractal ones
- [x] Bubble-to-bubble effects: sparks, chiral, sunflower, frost, Kali, Julia, chord, Apollo
- [ ] Live with Surprise on a phone; note loved and unloved effects
- [ ] Second round of weird: reaction-diffusion bloom, strange attractor threads, cymatics, smoke knots, a fractal that zooms as it fades
- [ ] Wall-hit effects from the same system
- [ ] Style-specific pop and meeting effects
- [ ] Pop pushes nearby bubbles, and has its own haptic
- [ ] Measure frame time with several bursts on screen
- [ ] Reduce to the preferred set and choose defaults

## Phase 2c: preview picker

Explore. Tapping a category title in the tray (such as Bubble) opens a modal showing a medium, gently moving preview of every option in that category. Tapping a preview selects it. The names in the row stay as the quick way to choose.

- [ ] Bubble first: a grid of live bubbles, drawn with the real style shaders and a slow breathing drift
- [ ] Decide how the modal looks and closes while staying calm (full screen or sheet; room still visible behind or not)
- [ ] Draw all previews on one canvas, only while open; pause the room behind and measure frame time
- [ ] Box: small rooms with a drifting bubble
- [ ] Meet and Pop: the effect looping, with a pause between plays
- [ ] Glass: a looping ripple
- [ ] Feel: a bubble moving in a small box with that physics
- [ ] Decide whether Tap needs previews, and what Surprise and None show
- [ ] Make titles look tappable without adding clutter; Reduce Motion shows stills

## Phase 3: box

- [ ] Frost, water, silk and stone walls
- [ ] Wall opacity and softness sliders
- [ ] Walls lit by nearby glowing bubbles
- [ ] Day and night backdrops

## Phase 4: bubble

- [ ] Custom colour and pattern
- [ ] Bubbles that merge
- [ ] Background refraction
- [ ] Style that shifts with speed or age

## Phase 5: sound and release

- [ ] Optional soft tones, pitched by size
- [ ] Android pass
- [ ] Store listing
