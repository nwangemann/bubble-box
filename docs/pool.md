# 8-ball in space

Design for 8-ball, as built. Opened and left with the mode switch. Units as in [architecture](architecture.md). Numbers marked _sim_ come from simulated shots, not play.

## First principle: always know where a ball is

How and where balls move must be intuitive, natural and fluid to follow. Keep this ahead of every other improvement to pool: judge each change first by whether a player can say how deep a ball is and where it is going, at rest and in motion, without effort. Prefer cues that carry depth (perspective, what a ball casts on the walls, what passes in front of what) to ones that only make a ball brighter, and never let one clutter the table.

## Structure

- **The calm room.** Same box, same camera. The far wall is the table: a long rectangle seen face on.
- **Pockets**: 6, all on the far wall: its 4 corners, and the middles of its 2 long edges. Nothing on the near face, which is only a cushion.
- **Cue ball**: made as a calm bubble is, but at one size, the size of the rest. Hold anywhere and it swells into the hand, release to send it. A quick swipe steers and a curved one spins. After 0.35 s the finger is placing the shot (a soft tick): drag to move it, the line follows, and lifting sends it along the line, however the finger moves. A flick as it lifts says draw or follow (1.4): up the screen, through the ball, follows; down, back towards you, draws. The shot still goes from where the finger rested. Power rises with the hold for 0.8 s and no more (`POOL.cue.charge`), so taking time to aim costs nothing.
- **One at a time**: touching lets the last fade. A shot waits for a still table (Rules); a finger put down before then gets its cue ball once all have stopped, where it is by then.

## Balls and the rack

Fifteen, radius 0.22 as the cue ball, about a third of the largest calm bubble, in a pyramid with its tip towards the viewer: 1, 4 and 9 balls in each other's hollows, all touching, and the 8 behind the middle. 7 solids and 7 stripes, alternating. Cleared, it is set again.

A break moves every ball. Collisions alone do not: pushes reach the middle ball and the 8 at right angles, so a light break left most of the rack still. So the first touch also springs the rack apart, at 0.18 of its speed (`POOL.rack.burst`). This is the one thing that is not true physics.

A ball drops when its middle comes within 0.2 of where it would sit snug in a pocket, touching every wall there (`POOL.mouth`), so corners and middles allow the same. The drawn corners follow from it; the middles are drawn wider than they take (`POOL.holes.side`), as true ones looked too small beside the corners. Pockets draw faintly what is within 0.75 (`POOL.draw`): only a ball stopped on the lip, within 0.25, tips in. Drag is a constant slowing of 0.12, so others truly stop and hang where they stop. Cushions keep 0.8 of the speed into them and grip.

## Telling balls apart

- **Colour**: yellow, blue, red, purple, orange, green, pink, one solid and one stripe of each. Pink stands for maroon, which looked red when far. Chosen by distance between colours (OKLab) as hazed at the far wall, in normal sight and two kinds of colour-blindness: the closest pair is 8.7 apart and 3.9 to the colour-blind, from 4.9 and 0.1.
- **Solids and stripes**: a stripe has white caps, which stay pale in the haze, so it is told by shape as well as colour. Marks never turn with the ball.
- **The 8**: black, with a pale rim and its figure on a white spot that always faces the viewer and hazes less. Its lines, in the aim and the row, are pale.
- **Potted and remaining**: 15 places at the top, solids, the 8, stripes, each colour in the same order. A ball still on the table is a faint ghost in a ring of its colour; potted, it fills in. The row shrinks on a narrow screen.
- **Whose** (1.19, `core/poolRow`): player 1's half of the row is the left, player 2's the right. While open, solids sit left and stripes right. Once the table is taken, each group moves under its owner in 0.8 s, keeping its colour order, solids bowing below the 8 and stripes above so nothing crosses (`POOL.row.swap`); a new rack moves them back. A pale line under the shooter's half, in the room's own ink, is whose turn: it slides across, shortening as it passes the 8, and a shorter one beneath it shows a second shot after the opponent's foul (`POOL.row.turn`). A mote flies to its ball's place as it is at that moment. With Reduce Motion, all of it at once.

## Aiming

A faint line runs straight ahead, as a release without a swipe would go, with a ring where the cue ball would touch and a line to where the ball it meets would land. That line is the same whether the ball would drop or not: it was once bolder for a pot, which told the player too much and took the skill out of a shot. A quick swipe fades it, as it no longer tells the truth; once placing, it always shows. Because the shot starts at the finger and flies at the vanishing point, where you put your finger is how you cut the ball. The ball in the hand is translucent so as not to hide its target.

**As a cue** (1.14, Aim in the menu): a stylized cue lies on the glass behind the ball in the hand, pointing through it at where the line meets a ball, and fades with the line. Its tip draws back from the ball as the shot charges, up to `POOL.aim.cue.pull`; aimed straight at the far wall, it points up the screen. Geometry in `core/cue`, drawing in `scene/poolCue`. It lay along the line at first, from the ball to the ring, but in perspective that stretch is short on screen and hid under the ball in the hand.

## How depth shows

- **Shadows**, straight across from each ball. The far wall's carry all the way, so how far one sits from its ball is how deep the ball is. The rest show only on walls within 1.1, firmest where a ball presses.
- **Light** of its own colour that a moving ball throws on walls within 1.1, brighter as it nears them. It follows the ball's speed, eased (`lively`), so a break does not flash and a resting ball throws none.
- **Distance**: far balls are hazier, dimmer and without shine; near ones have a lit rim. Kept mild, so colours can still be told apart.
- **Trails**, a soft streak of a moving ball's colour along its path, lasting 1.2 s (`POOL.trail`), so its length is the ball's speed. It narrows and hazes with depth, lies among the balls, and bends exactly where a ball bounces. All balls by default: even a break stays uncluttered, as most balls move slowly and slow ones show next to nothing. One flying straight away hides its own.

Tried and dropped: a halo round each ball (easy to track, no depth, and it hides neighbours); a line on the walls at each ball's depth (thin ones cannot be placed, thick ones repeat the light); mirror images on the walls, as showdowns have (they read as ghost balls); light that reaches further (it greys the room and belongs to no ball). Shadows on all walls from anywhere give each ball five marks, too many to pair with their balls.

All of it holds on felt (1.13), the light more weakly than the shadows. Each table has its own air for balls to haze into: blue in Space, a dark green near the cloth's on Felt.

## How forgiving a pocket is, simulated

A shot aimed to pot, then moved aside by this much at the glass; and a contact at random. 250 shots each, hold of about 0.8 s (_sim_).

| Off by      | Before | Now |
| ----------- | ------ | --- |
| 0.02, 4 px  | 81%    | 85% |
| 0.04, 8 px  | 43%    | 27% |
| 0.08, 15 px | 14%    | 4%  |
| At random   | 23%    | 10% |

So a careful shot drops as often as before, and a careless one seldom. Before: balls of 0.15, a reach of 0.55 from the pocket's point, a draw of 0.3 over 1.15. `mouth` 0.18 to 0.22 is the range worth trying.

## How a break plays, simulated

40 breaks for each hold, straight, up to 0.1 off centre (_sim_). Neither the 8 nor the cue ball dropped in any.

| Hold             | Potted | Until still |
| ---------------- | ------ | ----------- |
| 0.1 s            | 0.4    | 8 s         |
| 0.3 s            | 0.4    | 9 s         |
| 0.8 s and longer | 0.6    | 9 s         |

## A pot

Marked as a step, without stopping play (`POOL.pot`, `scene/poolPots`). Its light spills from the pocket over the walls, beneath the balls, and a front of it runs out across them, bending at each edge, so it shows where the pocket is. Then a small mote carries it to its place in the row, which fills as a ring blooms round it, about a second after it dropped. A firm haptic as it drops, a soft one as it lands. The 8's light is pale. A cue ball only sinks. With Reduce Motion, only a dimmer light, and the place fills once the ball has sunk. All is over before a cleared table is set again, and it keeps no state but the ball's own (`sunk`).

Tried and dropped: a wash of the whole room (hides colours and depth); a film swelling from the pocket (too small to see there). Not tried: bursts from `src/fx`.

**By meaning** (1.10): a pot is weighed as it drops, by what the shot has done so far (`weigh` in `core/poolGame`, `POOL.pot.meaning`): muted on a foul (a cue ball already down, a wrong first ball, an early 8, the 8 in another pocket), brighter as the last of a group, brightest for the 8 in the called pocket. The weight scales the light on the walls, the mote, and how wide its place blooms.

## Options

The dot opens pool's own menu, as it does the calm room's: a tile for each option, and the mode switch, whose other sides leave. The table keeps playing behind and is the preview: a tap on a tile moves to the next option, seen at once, so nothing covers the balls. A touch on the table closes it without playing. Keep to four options, two rows at most, so the far wall stays mostly clear. They are in `config/poolOptions`, saved together: Trail, Cloth, Aim and Opponent (Playing alone). Aim is Line, as above, or Cue, the line with a cue behind the ball (Aiming). Cloth is the table (`POOL.tables`): Space, the see-through room, or Felt, the calm box of that name, its pockets edged in leather (`rim`: a dark band, its body and a sheen) and the row's lines and the count in cream rather than the room's blue.

## Physics

`core/pool`, apart from `core/world`, whose soft contacts are wrong for this: at 1/120 s a 30 degree cut came out 2 to 5 degrees off. Each step finds the earliest contact among balls, cushions and pockets, moves to it, resolves it and goes on, up to a limit, so contacts are exact at any speed (ADR 1). The line uses the same contacts, but not the pockets' draw, so near a pocket it is a little off. Balls have equal density and push only along the line between them. The cue ball's spin bends its path and kicks off cushions.

**Draw and follow** (1.4, `POOL.roll`). Here no cloth grips a ball, so this is the one other thing that is not true physics: it acts as a table's cloth would. A flick at lifting while placing, faster than `least`, gives the cue ball a roll of -1 to 1, all of it at `full` (`rollOf`); a slower lift gives none, so placing by dragging is unchanged. The roll does nothing in flight but fade, over `fade` seconds, so a long shot keeps less of it. When the cue ball first strikes a ball, the roll is spent along the way it was going: struck straight it stops, then within about `take` seconds runs on (follow) or comes back (draw) at up to `most` of the speed it struck at; on a cut, follow bends it towards the object ball's path and draw away from it. Its spin about the line of flight, from a curved swipe, is apart and unchanged. The line does not show it, as it is said only at lifting. The computer plays without it. Tested in core: a straight hit stopping plain, running on, coming back; a cut with draw; the roll fading. On the simulator a full break with draw brought the cue ball back to the glass.

## Rules

Settled in 1.6, for 1.7 to 1.12. The base is the WPA Rules of Play for 8-ball, effective 2025-09-15 (section 4), changed only where this table leaves a rule nothing to act on or makes it a lottery. Where WPA's own Blackball (section 8) already fits, it is used instead: its cue ball in hand in baulk is this table's glass. Two players on one phone, taking turns, or one against the phone (Playing alone). Numbers marked _sim_ come from 40 simulated games for each case: a player who aims at a ball of their group, a pot where one is offered, and misses by 0.02 to 0.08 at the glass.

**Turns.** A shot waits for the table to be still. Holding while balls roll does nothing yet; the cue ball comes once all have stopped. The shooter stays on while each shot legally pots a ball of their own group (or, on an open table, any ball). A shot that pots none passes the turn. A foul passes it with two shots: the opponent's turn ends at their second shot that pots nothing, or at once on a foul of their own. This stands in for ball in hand, which is always had here, as two visits did in older pub and league blackball; WPA Blackball's free shot only forgives a wrong ball first, which is rare here (2 to 3% of shots, _sim_), so it would cost nothing.

**Waiting.** Shots after the break slow harder once they have run 3 s: drag 4 times as strong, back to `POOL.drag` once all have stopped, so a ball resting on a lip still tips in. A shot then takes 5.3 s on average and 6.8 at most, against 10.3 and 16 (_sim_), and pots barely fewer (44% of shots against 47%). The break keeps plain drag: its pots come late, as balls creep into pockets, and any stronger drag after 3 to 7 s left 0 to 0.3 pots a break instead of 0.4 to 0.7. So a break takes about 9 s.

**The break.** From anywhere on the glass, any strength; no ball is called and any may be struck first. A pot keeps the turn and the table stays open (WPA 4.3c). WPA's four balls to a cushion always happens (at least 10, _sim_), so every break is legal. The 8 potted on the break is set back on its spot and play goes on (4.3e, the first choice, taken always: no choices to ask). A cue ball potted on the break is a foul, the 8 too then set back. Breaks alternate between games (1.3), the first to player 1. Leaving 8-ball and coming back starts again with player 1.

**Open table, groups.** As Blackball 8.6, since nothing is called: the table is open until a shot after the break legally pots balls of one group only, which then is the shooter's, and the other the opponent's. Pots from both leave it open. While open, any ball but the 8 may be struck first (4.4).

**Fouls**, each passing the turn with two shots, balls potted staying down:

- The cue ball potted (3.1)
- No ball struck, or first a ball not the shooter's: the other group, or the 8 before the group is cleared (3.2)
- The 8 potted before its turn: set back on its spot, see below

Potting the opponent's ball is no foul (WPA, not Blackball); it stays down and does not keep the turn. The rest of WPA's fouls cannot happen here or are met by design: no ball leaves the box, nothing jumps, there is no cue to push, double hit or touch with, and a cue ball sent at least 2.7 per second runs about 30 before it stops, so it always reaches a cushion after any contact (3.3). A table still moving cannot be played (3.9) since the cue ball waits.

**The 8.** It is the last ball, called by the aim line: the pocket the line marks as the 8's at release is the called one (nothing shows it while aiming, as that would say whether the 8 drops; a ring marks the called pocket once the shot is sent). The shooter whose group is cleared wins by legally potting the 8 in it. They lose if the 8 drops on a foul (a cue ball potted with it, or another ball struck first), in another pocket, or with no pocket marked (4.8a and c). Once a group is cleared, its owner's first ball is the 8.

The one rule changed: **an 8 potted early** (before its owner's group is cleared, including with the last of it) **is set back on its spot as a foul**, not lost (WPA 4.8b). Here the cue ball keeps going for seconds after its target, through the whole rack, so it can rarely be kept off the 8: with the WPA rule 8 to 17 of 40 games ended that way (_sim_). The end keeps its risk in the called pocket and the scratch. To revert if play asks for it, a switch in the rules config.

**Setting the 8 back**: on its place in the rack, or, if a ball is there, the nearest free place on the line from there to the far wall (1.5), once the table is still, and it eases in, not appearing at once.

**Where a shot starts.** A ball resting against the glass would overlap a cue ball held over it: the cue ball begins at the nearest place it fits. Half a ball rests that close per shot on average (_sim_).

**As built** (1.7, `config/poolRules`, `core/poolGame`): a shot is judged once the table is still, by what dropped since it was sent and the first ball the cue ball struck (`Pool.first`). The verdict passes the turn or keeps it; `PoolGame.shots` counts the shots left that may pot nothing. Late drag is `Pool.hurry`, seconds since a shot after the break was sent, reset once all have stopped; a ball at rest that a pocket draws harder than plain drag keeps the table from being still, so it tips in. Where the cue ball fits is searched outwards from the finger in rings (`POOL_RULES.fit`), and the held ball and its line show it there. Groups (1.8) are `PoolGame.groups`, null while open, given by a verdict's `takes`; a new rack opens the table again. A wrong first ball is the foul `wrong`. The 8 (1.10): the aim line's trace knows the pocket a target would drop in (`Trace.pocket`). Once the shooter's group is cleared, a straight shot whose line runs to the 8 and drops it calls that pocket at release (`PoolGame.called`); a swiped one, whose line has faded, calls none. A ring marks the called pocket round where the 8 would sit while the shot plays (`POOL.aim.call`). It showed while aiming at first, which told the shooter whether the 8 would drop, so it waits for the shot. A verdict `won` it with the 8 legally in the called pocket and `lost` it on a foul, in another pocket or with none called; either sets `PoolGame.winner` and leaves the turn where it was until the next game. On the break or early, `spot`: once the table is still and the 8's pot has played out (`spotting`, the next shot waits), it is set back on its place in the rack, or the nearest free place on from there to the far wall (towards the glass if none is), easing in over `POOL.spot.ease` as its place in the row empties (`spotBall`, `Ball.back`). A set-back spot straight behind a ball nearer the glass is hidden by it.

**The end** (1.11, `nextGame`, `clearTable`, `POOL.row.win`): once a game is over the table holds as it ended (`Pool.over`, so a cleared one is not set again) and touches on it do nothing. The turn line goes to the winner and brightens, and a ring of the room's ink lights round each of their places and the 8's, from the 8 outwards, so who won is read from the row, not told. After `win.after` seconds a round arrow above the dot plays again. What is left on the table then fades where it rests, never filling its place; the rack swells back in as potted balls' places empty (`Ball.emptying`); and the other player breaks (`PoolGame.breaker`), the first shot waiting for the rack (`racking`). VoiceOver hears who won, and the arrow is "Play again". With Reduce Motion the light and the arrow come at once.

**Wins** (1.12, `PoolGame.wins`, `POOL.row.tally`): each game won adds one to the winner's count, whichever way it was won or lost, and `nextGame` keeps it. Once anyone has won, a small faint figure of the room's ink sits under the outer end of each half of the row, player 1's left and player 2's right; a new one fades in as the winner's rings finish lighting (at once with Reduce Motion). Kept only while 8-ball is open: leaving it starts again at nothing, as it starts again with player 1, since nothing says the same two will play next time. VoiceOver hears the count with who won.

**Left out**: calling other balls and safeties (4.6), the incoming player's choices after a break foul (4.3d, f to h), three fouls, stalemate (no position here blocks every shot), lagging, the shot clock. The old cue ball fades at the next touch, so it never blocks a shot.

**No words.** Players are told apart by side, not name: player 1's balls fill the left of the row, player 2's the right, each group moving under its owner once taken; whose turn is a line under the shooter's half (1.19, Telling balls apart). Who won is the winner's half lit, and play again a round arrow. The exceptions to having no text and no numbers stay the 8's figure and, as in showdowns, a quiet count of wins (1.12).

## Playing alone

Built in 1.5 (`core/opponent`, `POOL.opponent`). Opponent in the menu: Friend, as before, or Computer, which plays player 2. Nothing else changes: same rules, same row, same line under whose turn it is, same count of wins (VoiceOver says "You" and "The computer").

**How it chooses.** Once the table is still on its turn, it looks at each ball it may strike first, one a frame: for each pocket, the straight shot whose cue ball touches that ball on the line from the pocket through it, kept if the aim line's trace says it drops there, cut no thinner than `cut`. Each is scored by how many of eight starts moved by `margin` (0.015 and 0.03, four ways) still drop it. The four most forgiving, then two safe shots (a ball of its own struck full, nearest the glass first), are played out on a copy of the table at steps of 1/30 s (contacts stay exact) until still, and judged by the real rules: a win, then a legal pot, then no foul, then a foul, then a loss. The first to keep the turn is taken. On the break it goes straight at the rack. It only plays straight shots at full power: power barely changes speed here (2.7 to 3.5 per second), and a straight shot is what its line shows truly.

**How it plays.** It waits `pause` (0.6 s) from the table stilling, so its turn is seen to begin. A cue ball swells in `drift` (0.16) from where it will shoot, eases there over `settle` (0.6 s), so its line swings onto the shot as a finger's would, and is sent once held `hold` (1.1 s). Its start is off by a normal error of `miss` (0.03) each way, 0.04 on the break. With Reduce Motion it appears where it shoots. A friend's touch on its turn does nothing; one held through the last shot gets no ball if the turn then passes to it. Choosing Friend while it holds lets its ball go without a shot.

**How well it plays**, against itself (_sim_, 12 games each):

| `miss` | Shots that keep the turn | Fouls | Shots a game |
| ------ | ------------------------ | ----- | ------------ |
| 0.02   | 69%                      | 8%    | 18           |
| 0.025  | 57%                      | 8%    | 21           |
| 0.03   | 50%                      | 8%    | 26           |
| 0.035  | 44%                      | 6%    | 31           |

0.03 is a little better than the careful player of Rules (44% of shots pot): beatable by someone who takes care. Played out, its choice agrees with the real 1/120 s shot 340 times in 342. Looking at each ball in a frame of its own and playing out `steps` (15) steps a frame, thinking took 13 to 24 frames, within the pause, and at most 8 ms in any frame, on a still table that otherwise draws nothing (development build, simulator). Looking at every ball in one frame cost up to 31 ms.

## Fit with the vision

The balls left are the score, shown one by one at the top. No timer or words, and no number but the 8's own and the quiet count of wins.

## What the trial must answer, on a phone

1. Is a pot satisfying, and does placing the finger feel like aiming?
2. Is a pocket narrow enough, and the top power of a hold enough for a break?
3. Is the line a help, or does it play the game for you? (`POOL.aim.opacity` 0 hides it.)
4. Is depth clear when nothing moves?
5. What happens to balls that come to rest near the glass?
