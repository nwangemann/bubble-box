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
- [x] Tap a bubble to pop it, with a toggle

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

## Phase 2a: grow and pop without a mode

Goal: never open the tray to remove a bubble, and never need to know which mode is on.

Today, with Tap set to Pop: a quick tap on a bubble pops it; a tap on empty space, or a hold anywhere, grows one. The cost is that a full room leaves little empty space for small new bubbles.

- [ ] Live with the current rule on a phone; note each wrong result
- [ ] Tune `TUNING.tap` (time, movement, target size)
- [ ] Ignore far, small bubbles as tap targets when the room is full
- [ ] Try double tap on empty space to let every bubble go
- [ ] Try a two-finger swipe that pops what it crosses
- [ ] Try pinching a bubble until it bursts
- [ ] Try bubbles that age and pop by themselves, as a Feel field
- [ ] If the rule holds up, remove the Tap option

Prefer not to use: shake (clumsy, undo on iOS), a mode button (has to be remembered), a long press to pop (conflicts with growing).

## Phase 2b: pop effects

Explore after the first version is committed. Today a pop swells slightly while the film tears open from the middle.

- [ ] Make pop a selectable option, like Feel
- [ ] Try several: droplet burst, mist, shatter, dissolve into light, inward collapse, split into small bubbles
- [ ] Let each style have its own pop
- [ ] Pop haptic, and a push on nearby bubbles
- [ ] Compare on a phone and keep the best

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
