# Plan

For iOS. Each numbered box is one small session. Sections are in order of priority: do the first open step, top to bottom, then move it to **Built** and move **Next**. Sections keep their numbers when reordered. Numbers of finished steps are not reused. For anything that draws, check frame time on the simulator in the same session; device numbers come in 2.2, in section 10.

**Next, when a new phase starts: 5.1, a themed trail per arena.**

Where things stand (2026-11-26, phase 1 complete): the calm room, showdowns, 8-ball and sound are built and checked in tests, on the simulator and in the web preview. Phase 1 is tagged `v0.1.0`, and the web preview is live at https://nwangemann.github.io/bubble-box/ ([ADR 5](adr/0005-github-pages-demo.md)). None of it has been judged on a phone yet; that is section 10. Open work for a later phase is showdown trails (5), then liquid-filled bubbles (6), then the store listing (7). The latest review is [reviews/2026-11-25](reviews/2026-11-25.md).

Manual verification, whatever needs a person or a phone to judge, waits in section 10, at the very end. Nothing else waits for it. Build and check on tests and the simulator, go on, and add what is left to judge to section 10. Section 8 is parked and section 9 is blocked: neither is picked up as a next step.

## 5. Showdown trails

Build on the trails in **Built**. Explore, then reduce.

- [ ] 5.1 A themed trail per arena: embers, dust, stardust, sea foam, wisps, steam
- [ ] 5.2 Trails that tell the story: longer and brighter with speed, two that braid where bubbles merge, the winner's whole path drawn once at the end

## 6. Liquid-filled bubbles

A trial of bubbles that hold a liquid with its own behaviour. Start from `scene/liquid` and `ring` in `core/duel`. Unpark the rest (8.4 to 8.10) only if these look good and hold 60 fps: on the simulator at first, on the phone in 2.2.

- [ ] 6.1 A fill level whose surface tilts and sloshes as the bubble moves and spins
- [ ] 6.2 Viscosity (water, oil, honey, mercury, slime, tar): sets sloshing, ringing and how fast bubbles merge

## 7. Release

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

Unblocked: the audio foundation (4.1) and tones (4.2) are built, so these need only `VOICING` and a call where a showdown merges, pops or ends.

- [ ] 8.20 Coalescence and pop sounds pitched by size, a triumphant flourish for the winner
- [ ] 8.21 Music per theme

### Web preview

- [ ] 8.22 Load faster. Measure first, on a phone in Safari, cold and repeat: first paint, downloads, Skia compiling, first frame. Are preloads used there? Then try, largest first: a smaller CanvasKit (3.3 of the 3.9 MB zipped; does the app need the full build?), Brotli (needs HTTPS), Skia cached for good under a name that changes with it, a service worker, a smaller app script (showdown, preview and 8-ball loaded when opened), running the app script sooner after Skia. Perhaps Home Screen launch images, and an error when the start script itself fails

### 8-ball

Wait for 1.2: tune or drop 8-ball on a phone first.

- [ ] 8.23 Aiming near the top and bottom of the screen: shots there are hard to place, as the finger runs out of glass. Explore a stretch near those edges, so a little more finger travel there reaches further across the glass, and whether it should apply to placing the cue ball, its line or both. Judge on a phone

## 9. Blocked

- [ ] 9.1 Finger pressure and size shape the growing bubble. Gesture Handler reports only positions, so this needs a small native module, an ADR and a phone; recent iPhones report size but not pressure

## 10. Manual verification

Always last: start only when no step outside 8 and 9 is open. Needs a person, most of it with a phone. Steps keep their numbers. Add to it whatever a session could not check.

**First time on a phone**

- [ ] 2.1 Install and note what feels wrong; confirm icon and splash
- [ ] 7.6 Open the live demo (ADR 5) in Safari on a phone: it loads, a hold grows a bubble, and Add to Home Screen works under `/bubble-box/`. Checked by the agent only in a desktop browser
- [ ] 2.2 Frame time on the oldest phone to support: 10 bubbles, without and with each trail; 10 glowing bubbles in Water; several bursts, with pops pushing neighbours; the picker; showdown with 12, and a mixed one with 24; whether the chooser is slow to open the first time after installing (about a second on the simulator, development build). Repeat after 6.2

**8-ball**

- [ ] 1.2 Judge on a phone, by the questions at the end of [pool](pool.md): ball size, placing a shot, `mouth`, side pockets drawn wider than they take, power. Tune, or drop 8-ball. Also what was only seen in stills, or not felt:
  - 1.15 to 1.17 in play: depth, trails, and whether a pot feels like progress without stopping play
  - 1.17: the haptics as a ball drops and lands
  - 1.4, draw and follow: whether a flick at lifting is natural, found without being told, and told from a drag that places the shot (`POOL.roll.least`, `full`); whether it moves the shot on a phone; how far it should carry (`most`, `take`, `fade`)
  - 1.7: does waiting with a finger down for the table to still feel natural, or should the cue ball show at once and wait to be sent; is the cue ball moving aside from a ball at the glass clear
  - 1.19: is the line under a half read as whose turn, and the shorter one beneath as a second shot, without being told; while the table is open, do players take the solids on the left for player 1's; does the swap of groups catch the eye without distracting
  - 1.10: is the ring at the called pocket, shown only once the shot is sent, read as calling it; is calling without seeing it while aiming fair, and a swiped shot calling none; are the brighter and muted pots felt as meaning without words; is the 8 easing back onto its spot followed
  - 1.11: is the winner read from their lit half of the row and their line, without words, and a loss as the line crossing to the other player; is the round arrow read as play again, and is 1.6 s before it shows right; does the rack swelling back in, with the other player's line, say whose break it is
  - 1.12: is the count of wins quiet enough yet found when wanted, and read as whose without words; should it outlive leaving 8-ball
  - 1.13: does Felt read as a pool table, and should it, not Space, be what 8-ball starts with; are shadows, the light of moving balls and trails as easy to follow on it, in play; can the green solid be told from the cloth at the far wall, and the row's rings against the cloth; is Felt too bright for a calm room at night
  - 1.14: does the cue make aiming clearer or only busier; does its pull read as power without hiding balls near the glass; is a cue on the glass, behind a ball going into the screen, natural, or would players rather it lay along the line; should it, not the line, be what 8-ball starts with
  - 1.5, the computer opponent: is it fair (it pots half its shots), too strong or too weak, and should it have levels; is its turn read without words, from the line under its half and a ball that appears by itself; does its ball easing onto the shot read as aiming, and is 0.6 s before it and 1.1 s holding right, or slow; should Computer, not Friend, be what 8-ball starts with; should the count of wins start again when the opponent changes; does a second row of tiles cover too much of the table; with VoiceOver, are "You" and "The computer" right
  - 1.6, the rules in play: is the wait between shots short enough, and late drag unnoticed; do two shots after a foul sting enough; is the early 8 set back (not lost) right, or should the WPA loss return; is calling the 8 by the aim line understood

**Sound**

- [ ] 4.1 On a phone: is the silent switch respected and music left playing; is 70 ms from touch to tone felt; does the Chime sound soft, without a click at its start or end (`TONES.chime`)
- [ ] 4.2 On a phone, with Sound on Tones: are wall tones calm with ten Lively bubbles, or a rattle (`VOICING.bubble.gap`); is lower-for-larger heard, and is the range right (`radius`, `per`); is the pop tone light enough beside the haptic; does the pot sound like a ball settling, and are a foul, the last of a group and the 8 told apart; should Sound start on Tones rather than Off; should 8-ball's knocks between balls sound too

**Tune the calm room**

- [ ] 2.3 Tune the core: growth (start size, pace, largest size), launch (hold power, swipe strength, depth of the box), rebound, drift, wobble, the push of a pop (`TUNING.puff`), haptics
- [ ] 2.4 Tune gestures: several fingers, `swipe`, `TUNING.sweep`, `spin`, `flick` (does it get in the way of launching from a crowd?), `tilt` (does it want its own setting?), the first-time hint (`TUNING.hint`; is it understood?)

**Judge and reduce**

- [ ] 7.1 Judge looks: maker and patterns, merging (`TUNING.merge`), materials, day and wall light, the picker
- [ ] 7.2 Judge showdown: grid, mural, distance and wall contact strength (`config/arena`), how often titles appear (`config/feats`), a mixed crowd of 24 (`TUNING.showdown.crowd`: too busy, too small?), pace, merge and odds; tune `TUNING.showdown`. The favourite (3.3): is it found and quick to skip, is its light subtle (`HALO`), does its fall or win please, is rage fun (`TUNING.showdown.rage`) and reached by a second tap, does the tally stay quiet; also with VoiceOver
- [ ] 7.3 Live with Meet and Pop on Random; note loved and unloved effects
- [ ] 7.4 Reduce: keep 5 or 6 styles, the loved effects, trails and liquids; choose defaults

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

A third mode beside Calm and Showdown: 8-ball pool in 3D, played rather than watched, in the calm room, with the cue ball made as a calm bubble is. Design and rules in [pool](pool.md). Built in five parts: see and follow, a pot worth it, true 8-ball (two players on one phone, or against the computer), the table, and later touches. Kept only if it feels fun on a phone (1.2).

- 1.1 on paper, then rebuilt to a new structure: the calm room and camera, six pockets on the far wall, a cue ball from the calm hold at any moment ([pool](pool.md))
- The trial of 1.2: exact contacts (`core/pool`), a pyramid of 15 whose break moves them all, a faint draw near pockets, a line straight ahead, opened with a third side of the mode switch. Simulator, release build, 15 balls: 60 fps, 1.4 ms a frame
- After first play of the trial: one ball size, long press to place the shot, narrower pockets with a fainter draw, judged by simulated shots. Seen in the web preview
- 1.15, seeing where balls are: shadows across to the walls, the light a moving ball throws on them, and stronger depth on balls (`scene/poolWalls`, `POOL.walls`, `POOL.far`). A halo, a line at each ball's depth and mirror images were tried and dropped ([pool](pool.md)). Development build, simulator, breaks of 15: 60 fps, 2.5 ms a frame, 2.5 to 3 before. Judged on stills, at rest, rolling and on a break, and with a green stone wall standing in for felt. Not yet judged in play or on a phone (1.2); recheck in 1.13

- 1.18, somewhere for pool's options: the dot opens a menu of its own with the mode switch, which leaves; tiles step through options over the live table, saved with the rest (`config/poolOptions`, `ui/Tray`). Empty until 1.16. Seen in the web preview with stand-in options; not on a simulator. Frame time not measured: nothing new is drawn per frame
- 1.16, short trails behind balls, pool's first option: All balls, Cue ball or None (`POOL.trail`, `core/pool`, `scene/trails`). All by default. Pieces hidden behind their own ball are skipped, calm trails too. Development build, simulator, break of 15: 60 fps, about 4 ms a frame, 2.5 in 1.15. Judged on stills; not yet in play or on a phone (1.2). Calm trails not looked at again
- 1.17, celebrating a pocketed ball: light from the pocket with a front that crosses the walls, a mote that carries it to its place in the row, a firm haptic as it drops and a soft one as it lands (`POOL.pot`, `scene/poolPots`). A wash of the whole room and a film at the pocket were tried and dropped ([pool](pool.md)). Cue ball unmarked. Reduce Motion: a dimmer light only. Development build, simulator: about 3 ms a frame on average with pots, up to five at once. Judged on frames of recordings; the 8's own pot not seen, haptics not felt, not yet judged in play or on a phone (1.2)
- 1.9, telling balls apart: new colours, the 8 with its figure, and a place at the top for each ball, solids, the 8, stripes (`POOL.looks`, `POOL.row`, `core/poolRow`). Development build, simulator, shots through 14 and 15 balls: 60 fps, about 3.2 ms a frame. Judged on stills at the far wall and on breaks; not yet in play or on a phone (1.2), by a colour-blind person, or the mode switch's 8-ball side, which draws the same balls. Recheck on felt in 1.13
- 1.7, player 1 and player 2 (`config/poolRules`, `core/poolGame`): turns with two shots after a foul (scratch, nothing struck, an 8 after the break), the first ball struck recorded, the wait for a still table (a finger down meanwhile gets its cue ball once all have stopped), late drag after the break that lets a ball on a lip still tip in, and the cue ball starting clear of a ball against the glass. Groups, setting the 8 back and losing with it come in 1.8 to 1.11; the early 8 switch is there, unused but for a verdict's `lost`. Nothing shows whose turn it is until 1.19. Tested in core (turns, fouls, two shots, first ball, late drag, the lip, where the cue ball fits). Development build, simulator (iPhone 17): a break, then a tap while balls rolled did nothing, and a finger held from then got its cue ball and line once all had stopped, and shot on release; 60 fps throughout. Turns themselves not seen, as nothing shows them yet; the cue ball moved aside by a ball at the glass not seen
- 1.8, solids and stripes (`core/poolGame`): the table open until a shot after the break legally pots balls of one group only, which becomes the shooter's (`PoolGame.groups`, `Verdict.takes`); a new rack opens it again. A foul, `wrong`, for first striking the other group, the 8 while open, or the 8 before one's group is cleared and anything else after; only one's own pot keeps the turn, the opponent's stays down for nothing; the 8 legal once the group was cleared before the shot, so with the last of it is still early. Tested in core. Development build, simulator (iPhone 17): a break and three shots after it played and judged without error; groups not seen, as nothing shows them until 1.19. Frame time not measured: nothing new is drawn
- 1.19, whose balls: player 1's half of the row is the left, player 2's the right; once the table is taken each group moves under its owner, solids passing below the 8 and stripes above, and a line under the shooter's half slides across as the turn passes, with a shorter one beneath while they have two shots (`POOL.row.swap`, `POOL.row.turn`, `core/poolRow`). A mote flies to its place as it is now. Reduce Motion: both at once. Tested in core. Development build, simulator (iPhone 17): each state stepped by a probe (open, two shots, taken by either player, turn passing), the swap seen halfway with the 8 and the Dynamic Island clear (`bow` raised from 13, which covered the 8), and a real break that potted nothing passing the line to player 2. 60 fps, median 2.6 ms a frame, at most 3.8. The groups taken in real play not seen; Reduce Motion not seen
- 1.6, the ruleset on paper ([pool](pool.md), Rules): WPA 8-ball of 2025, with Blackball's open table, two shots after a foul in place of ball in hand, late drag after the break, the 8 called by the aim line and set back when potted early. Chosen with simulated games of a player aiming at their own group (40 a case, misses of 0.02 to 0.08); nothing built
- 1.20, what 1.17 and 1.18 left unseen, on a simulator (iPhone 17, development build); nothing needed a fix. The 8's own pot, its ball placed by a probe: pale light and front, a pale mote, its figure legible in the row. Reduce Motion switched in the system's Settings while 8-ball was open: followed both ways without a restart; on, trails stop, a pot is only a dimmer light and its place fills. The menu: tiles step and act at once, a tap on the table closes it without playing, both other sides leave, Trail survives a restart. Breaks of 15: 60 fps, about 3.5 ms a frame with trails, the menu open or closed, under 2 with none. Pots and breaks were set off by the probe, not by a finger
- 1.10, the 8 (`core/poolGame`, `spotBall` in `core/pool`): called by the aim line, a ring round the pocket it marks once the shooter's group is cleared; a straight shot calls that pocket at release, a swiped one none. Won with it legally in the called pocket, lost on a foul, in another pocket or with none called (`PoolGame.winner`; the turn stays, the win itself is 1.11). On the break or early, set back on its spot once its pot has played out, easing in as its place in the row empties; the next shot waits for it. Pots weighed as they drop: muted on a foul, brighter for the last of a group, brightest for the 8 called (`POOL.pot.meaning`). Tested in core. Development build, simulator (iPhone 17), tables set by a probe: the ring at a side pocket, the 8 potted there with the brightest light and widest bloom and the turn kept, an early 8 muted, its place filled then emptied, the turn passed with two shots, and the 8 easing back in. 60 fps, about 2.5 ms a frame through shot, pot and set-back, at most 11. Not seen: a loss, the break's 8, Reduce Motion; a spot straight behind a ball nearer the glass hides the 8
- 1.11, win and loss (`core/poolGame`, `clearTable` in `core/pool`, `POOL.row.win`, `ui/Pool`): once over, the table holds as it ended and ignores touches; the turn line goes to the winner and brightens, and a ring lights round each of their places and the 8's, from the 8 outwards (`RowTurn.won`, `crownAt`). After 1.6 s a round arrow above the dot plays again (VoiceOver: "Player 1 won. Play again", announced as it ends): what is left on the table fades where it rests, the rack swells back in as potted balls' places empty (`Ball.emptying`), and the other player breaks (`PoolGame.breaker`, `nextGame`); the first shot waits for the rack (`racking`). A cleared table no longer sets itself again while a game is over (`Pool.over`). Tested in core. Development build, simulator (iPhone 17), tables set by a probe: a win with the 8 in the called pocket, a touch on the table doing nothing, play again, the rack swelling in with player 2's line, and player 2's break; a loss (no pocket called, forced by the probe) crossing the line to player 2 and lighting the stripes. A first version filled the places of balls left on the table as the rack came back; fixed. 61 fps, 2.3 to 3.2 ms a frame, at most 5.4. Not seen: Reduce Motion, VoiceOver, a loss by a scratch on the 8
- 1.12, wins: a count for each player, kept between games while 8-ball is open (`PoolGame.wins`, `nextGame`), a faint figure under the outer end of each half of the row once anyone has won, the new one fading in as the rings finish (`POOL.row.tally`, `ui/Pool`); VoiceOver hears it with who won. Tested in core. Development build, simulator (iPhone 17), every shot made a win by a probe: 1 and 0 after the first game, then player 2's figure fading in to 1 and 1 after the second, player 1's staying. Frame time not measured: nothing is drawn per frame. Not seen: Reduce Motion, VoiceOver, leaving and coming back, counts of two figures
- 1.13, felt: Felt, an opaque cloth under a lamp, a fine nap and faint mottle, darker at the cushions (`felt` in `scene/walls`), is a calm box (`ENVIRONMENTS.felt`, bouncing a little less) and 8-ball's second table, chosen by Cloth in its menu: Space, as before and the default, or Felt (`POOL.tables`, `tableOf` in `config/poolOptions`). Each table has its own room, the air far balls haze into, a colour for the row's lines and rings, the count and play again, cream on felt, and the pockets' edges (`rim`), leather on felt, seen on the simulator. Tested in config. Development build, simulator (iPhone 17): Felt in the Box picker and full screen in the calm room; in 8-ball, Cloth switching the table at once; a break on felt with shadows on the far wall and floor, the cue ball's light beneath it and its trail (rechecking 1.15 and 1.16). 60 fps, about 3 ms a frame, at most 5.4. Not seen: day light, softness and opacity on Felt, a calm bubble's ripples on it, pots on felt, Reduce Motion
- 1.4, draw and follow: while placing, a flick as the finger lifts says them, up the screen follows and down draws, and the shot goes from where the finger rested before it (`rollOf` in `core/pool`, `POOL.roll`, `ui/Pool`). Not in flight: it fades on the way, and once the cue ball strikes a ball it runs on or comes back along the way it was going, as a cloth would make it ([pool](pool.md), Physics). The computer does not use it. Tested in core. Development build, simulator (iPhone 17), by touch: a full break with draw brought the cue ball back to the glass; a straight shot with follow ran it on into a pocket, a foul. Frame time not measured: nothing new is drawn, and a few sums a step. Not seen: a cut with either, Reduce Motion. Once, entering 8-ball right after a reload showed an empty room until the menu was opened; not seen again
- 1.14, a cue: Aim in 8-ball's menu, Line (the default) or Cue (`cueAim` in `config/poolOptions`). With Cue, a stylized cue lies on the glass behind the ball in the hand, pointing through it at where the line meets a ball: blue tip, ferrule, maple shaft, a brass join and a dark butt, wider towards the butt, with a sheen on the lit side, faded as one with the line (`core/cue`, `scene/poolCue`, `POOL.aim.cue`). Its tip draws back from the ball as the shot charges; aimed straight at the far wall it points up the screen. The line, its ring and the target's line stay. A first version lay along the line, from the ball to the ring: in perspective that is short on screen and was lost under the ball in the hand, so it was moved behind. Tested in core and config. Development build, simulator (iPhone 17): straight and cut shots on Space and Felt, full and partial charge, the tile stepping and kept across reopening the menu. Frame time not measured. Not seen: Reduce Motion, a swipe fading it, the cue near a screen edge
- 1.5, playing alone: Opponent in 8-ball's menu, Friend (the default) or Computer, a fourth tile on a second row (`computerPlays` in `config/poolOptions`). The computer plays player 2 (`core/opponent`, `POOL.opponent`): on a still table it looks at each ball it may strike for straight pots, one ball a frame, scores each by how far its start can be off and still pot, plays the likeliest four and two safe shots out on a copy of the table at 1/30 s steps (`advancePool` takes a step), judged by the real rules, then holds a cue ball beside the shot, eases it on so its line swings in, and sends it at full power, off by 0.03 each way. Against itself it pots 50% of shots with 8% fouls (_sim_, [pool](pool.md), Playing alone). A friend's touch does nothing on its turn; VoiceOver says "You" and "The computer". Tested in core and config. Development build, simulator (iPhone 17): a game played by the computer on both sides, by a probe, to a win and play again; then by touch, Computer chosen in the menu, a break and a foul, and the computer aiming (its line and ring on a stripe) and potting it with two shots. Thinking at most 8 ms a frame, after spreading it over frames (31 before). `advancePool`'s step first came as a default parameter, which a worklet does not capture: tests passed and the UI thread failed; moved into the body, and the rule noted in AGENTS. Not seen: Reduce Motion, VoiceOver, choosing Friend while it holds
- The aim tells less, so a shot takes skill: the line to where the struck ball goes no longer turns bold when it would drop, and the ring at the 8's called pocket shows only once the shot is sent, not while aiming (`ui/Pool`, `scene/drawPool`, [pool](pool.md), Aiming and Rules). A pocket is called only once the shooter's group is cleared. Tests pass; seen in the web preview with the line thin. The ring after a cleared group not seen

### Sound

One audio decision for the whole app: synthesised tones, off with the silent switch, Off by default.

- 4.1, audio foundation: `expo-audio` ([ADR 4](adr/0004-sound.md)). Tones are synthesised at start from sine partials (`config/sound`, `services/synth`), written to the cache as WAVs and loaded into four players each, so they overlap; `playTone(id, volume, rate)` pitches by playback rate, an octave each way. Ambient session: mixes with other apps, silenced by the silent switch. No microphone permission or background audio. Web preview is silent. Nothing plays yet: one tone, Chime, waits for 4.2. Tested in services (samples, WAV header). Development build, simulator (iPhone 17), by a probe: four players loaded, 1.2 s; two at rates 1.5 and 0.75 played together, about 70 ms from `playTone` to sound. Not heard (the simulator plays through the Mac), nor the silent switch
- 4.2, tones (`services/tones`, `VOICING` in `config/sound`): Sound, Off (the default) or Tones, one saved choice with a tile in the calm menu and in 8-ball's, stepping on a tap. In the calm room a wall or the glass sounds Chime, pitched by the radius of the bubble that hit hardest (`World.impactR`), lower for larger, an octave each way, and as loud as the hit, at most one each 0.14 s; a pop sounds Pop, a short airy tone pitched the same way. In 8-ball a pot sounds Pot, a low round tone, by what it means (`newestPot` in `core/pool`): a fourth lower and quieter for a foul, a third higher for the last of a group, a fifth for the 8. Pitches snap to a major pentatonic scale, so tones that overlap agree. Tested in services, config and core. Development build, simulator (iPhone 17), by a probe: three tones loaded, four players each; walls sounding at rate 1.12 for a bubble of radius 0.17 and 0.5 for one of 0.63; a pop of 0.65; two of the computer's pots, plain. Frame time not measured: nothing new is drawn. Not heard (the simulator plays through the Mac); not seen: a foul's or the 8's pot, Reduce Motion

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
- 3.2, mixed casts: the Mixed cast draws from all 72, dealt evenly by theme, nobody twice and no two alike in colour (`crewOf` in `showdown/casts`, `CAST`), and lets up to 24 enter, with a roster of two rows. Title and verbs are the winner's own. More than 12 start smaller and closer (`TUNING.showdown.crowd`); simulated fights of 24 take about 12 s at the median on a phone, 8 to 11 on a tablet, with half out in about 1.4: a flurry, then a duel, to judge in 7.2. Development build, simulator, 24: 60 fps, at most 4 ms a frame. Judged on stills; taps in the chooser, tablets and the play itself not seen
- 3.3, a favourite to root for: tap one in the line-up or roster, again to enrage it, again for none; kept for the next showdown it enters. A soft halo marks it, opens and rises when it falls, and spreads in waves when it wins (`HALO`). Titles You Called It and All the Rage; a saved tally shows only crowns and right calls (`config/tally`). Rage: six times likelier at equal size, charging in surges (`TUNING.showdown.rage`); simulated with 12 on a phone it wins 63% in Absorb and 38% in Pop, against about 8 to 10%. A pennant and a thread of light were not tried: the halo read at once. Development build, simulator, 12 with a favourite: 60 fps, at most 2.6 ms a frame on average. Choosing, fights, called wins and the tally after a restart seen there; rage only in the web preview, its frame time not measured (it draws no more). Not seen: the light of a fall as it opens, 24, tablets, Reduce Motion, VoiceOver
