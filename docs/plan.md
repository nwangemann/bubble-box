# Plan

For iOS. Each numbered box is one small session. Sections are in order of priority: do the first open step, top to bottom, then move it to **Built** and move **Next**. Numbers of finished steps are not reused. For anything that draws, check frame time on the simulator in the same session; device numbers come in 2.2.

**Next: 1.2, judging 8-ball on a phone.** Without one, 3.2, mixed showdown casts.

Without a phone, skip 2 and 7.1 to 7.3, and pass over section 1: 1.2 decides whether it goes on. Start no liquids (6) before 2.2. Section 8 is parked until 7.4; section 9 is blocked.

## 1. 8-ball in space

A third mode beside Calm and Showdown: 8-ball pool in 3D, played rather than watched. As true to billiards as possible, in the calm room, with the cue ball made as a calm bubble is. The aim is that it feels fun and engaging; if it does not, drop it. The design is in [pool](pool.md). Order: see the balls, then make a shot and a pot worth it, then the game, then its looks. The rules wait for 1.2: go on past B only if a shot is fun on a phone.

**A. See and follow.** Done when depth and direction read at a glance, at rest and on a break, at 60 fps.

- [ ] 1.2 Judge on a phone, by the questions at the end of [pool](pool.md): ball size, placing a shot, `mouth`, side pockets drawn wider than they take, power. Tune before going on

**B. A pot worth it.** Built; 1.2 judges whether a pot feels like progress without stopping play.

**C. True 8-ball.** Done when two people can play a whole game on one phone and know whose turn it is, what is theirs and who won.

- [ ] 1.6 A ruleset on paper first: current standard 8-ball, adapted slightly where this table needs it (cue ball to hand, fouls, scratch, the break, calling pockets). Settles 1.7 to 1.12; replaces 1.3. To decide, with a first suggestion:
  - Turns: a shot waits for the table to be still (8 to 9 s after a break today, so perhaps stronger drag late on)
  - Every shot starts at the glass, so ball in hand is always had: a foul gives the opponent two shots instead
  - Calling: only the 8
  - Break: a pot keeps the turn and leaves the table open; the 8 potted is set back
  - Cue ball potted is a foul; with the 8, a loss
  - The vision has no scores or text: which exceptions the game needs
- [ ] 1.7 Player 1 and player 2: whose turn it is, when it passes, what a foul gives
- [ ] 1.8 Solids and stripes: the table is open until a first legal pot assigns them
- [ ] 1.19 Whose balls: each player's potted and remaining, and whose turn, on the layout of 1.9
- [ ] 1.10 True 8-ball mode: the 8 must be sunk last; early, or with a scratch, it loses. Scale the pot of 1.17 by meaning: more for a called or last ball, most for the 8, muted for a foul
- [ ] 1.11 Win conditions and a win screen, with play again
- [ ] 1.12 Win tracking: wins for each player, kept between games

**D. The table.** Options, so each can be left out without harm. Done when both hold to the first principle.

- [ ] 1.13 A felt, pool-table-like, opaque option among the environments (`config/environments`). Pool uses its own look (`POOL.look`), not the calm boxes, so decide whether calm gets it too. Recheck 1.15 and 1.16 on it
- [ ] 1.14 A stylized pool cue as a trajectory indicator, a setting for pool to toggle on; the present line stays the default

**E. Later.**

- [ ] 1.4 More from spin: draw and follow, if a swipe can say them
- [ ] 1.5 An opponent to play alone

## 2. First time on a phone

Needs you and a phone, so that feel and frame time are known before more is built.

- [ ] 2.1 Install and note what feels wrong; confirm icon and splash
- [ ] 2.2 Frame time on the oldest phone to support: 10 bubbles, without and with each trail; 10 glowing bubbles in Water; several bursts, with pops pushing neighbours; the picker; showdown with 12. Repeat after 6.2
- [ ] 2.3 Tune the core: growth (start size, pace, largest size), launch (hold power, swipe strength, depth of the box), rebound, drift, wobble, the push of a pop (`TUNING.puff`), haptics
- [ ] 2.4 Tune gestures: several fingers, `swipe`, `TUNING.sweep`, `spin`, `flick` (does it get in the way of launching from a crowd?), `tilt` (does it want its own setting?), the first-time hint (`TUNING.hint`; is it understood?)

## 3. Showdown play

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
- [ ] 4.2 Optional soft tones, pitched by size; one for a pot in 8-ball

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

### Web preview

- [ ] 8.22 Load faster. Measure first, on a phone in Safari, cold and repeat: first paint, downloads, Skia compiling, first frame. Are preloads used there? Then try, largest first: a smaller CanvasKit (3.3 of the 3.9 MB zipped; does the app need the full build?), Brotli (needs HTTPS), Skia cached for good under a name that changes with it, a service worker, a smaller app script (showdown, preview and 8-ball loaded when opened), running the app script sooner after Skia. Perhaps Home Screen launch images, and an error when the start script itself fails

## 9. Blocked

- [ ] 9.1 Finger pressure and size shape the growing bubble. Gesture Handler reports only positions, so this needs a small native module, an ADR and a phone; recent iPhones report size but not pressure

## Built

### Core

- A web preview, to try the app in a phone's browser without Xcode ([running](running.md), ADR 3). Safari on the simulator, on the Mac's own processor: 10 bubbles 53 to 60 fps, 8-ball 58 to 60, showdown with 12 at 60. A phone's is not known yet
- The preview's loading: a breathing bubble inlined in the page, Skia and the app fetched at once, all zipped (10.6 to 3.9 MB), scripts cached. Not timed on a phone

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

### 8-ball in space

- 1.1 on paper, then rebuilt to a new structure: the calm room and camera, six pockets on the far wall, a cue ball from the calm hold at any moment ([pool](pool.md))
- The trial of 1.2: exact contacts (`core/pool`), a pyramid of 15 whose break moves them all, a faint draw near pockets, a line straight ahead, opened with a third side of the mode switch. Simulator, release build, 15 balls: 60 fps, 1.4 ms a frame
- After first play of the trial: one ball size, long press to place the shot, narrower pockets with a fainter draw, judged by simulated shots. Seen in the web preview
- 1.15, seeing where balls are: shadows across to the walls, the light a moving ball throws on them, and stronger depth on balls (`scene/poolWalls`, `POOL.walls`, `POOL.far`). A halo, a line at each ball's depth and mirror images were tried and dropped ([pool](pool.md)). Development build, simulator, breaks of 15: 60 fps, 2.5 ms a frame, 2.5 to 3 before. Judged on stills, at rest, rolling and on a break, and with a green stone wall standing in for felt. Not yet judged in play or on a phone (1.2); recheck in 1.13

- 1.18, somewhere for pool's options: the dot opens a menu of its own with the mode switch, which leaves; tiles step through options over the live table, saved with the rest (`config/poolOptions`, `ui/Tray`). Empty until 1.16. Seen in the web preview with stand-in options; not on a simulator. Frame time not measured: nothing new is drawn per frame
- 1.16, short trails behind balls, pool's first option: All balls, Cue ball or None (`POOL.trail`, `core/pool`, `scene/trails`). All by default. Pieces hidden behind their own ball are skipped, calm trails too. Development build, simulator, break of 15: 60 fps, about 4 ms a frame, 2.5 in 1.15. Judged on stills; not yet in play or on a phone (1.2). Calm trails not looked at again
- 1.17, celebrating a pocketed ball: light from the pocket with a front that crosses the walls, a mote that carries it to its place in the row, a firm haptic as it drops and a soft one as it lands (`POOL.pot`, `scene/poolPots`). A wash of the whole room and a film at the pocket were tried and dropped ([pool](pool.md)). Cue ball unmarked. Reduce Motion: a dimmer light only. Development build, simulator: about 3 ms a frame on average with pots, up to five at once. Judged on frames of recordings; the 8's own pot not seen, haptics not felt, not yet judged in play or on a phone (1.2)
- 1.9, telling balls apart: new colours, the 8 with its figure, and a place at the top for each ball, solids, the 8, stripes (`POOL.looks`, `POOL.row`, `core/poolRow`). Development build, simulator, shots through 14 and 15 balls: 60 fps, about 3.2 ms a frame. Judged on stills at the far wall and on breaks; not yet in play or on a phone (1.2), by a colour-blind person, or the mode switch's 8-ball side, which draws the same balls. Recheck on felt in 1.13

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
- Arena apart from cast: any cast in any arena, its own by default, or a random one each time (`showdown/casts`). The winner's title and the verbs go with the cast; the colours, font and name with the arena. Nothing new is drawn per frame; frame time not measured again
- Murals redrawn as washes, light and mist (`showdown/scenery`), still faint, with a film's colours drifting over them (`ARENA.sheen`). Simulator: 60 fps with 12
