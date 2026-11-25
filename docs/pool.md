# 8-ball in space

Design for section 1 of the [plan](plan.md), and the trial built for 1.2. Opened with the third side of the mode switch; the dot leaves. Units as in [architecture](architecture.md). Numbers marked _sim_ come from simulated shots, not play.

## First principle: always know where a ball is

How and where balls move must be intuitive, natural and fluid to follow. Keep this ahead of every other improvement to pool: judge each change first by whether a player can say how deep a ball is and where it is going, at rest and in motion, without effort. Prefer cues that carry depth (perspective, what a ball casts on the walls, what passes in front of what) to ones that only make a ball brighter, and never let one clutter the table.

## Structure

- **The calm room.** Same box, same camera. The far wall is the table: a long rectangle seen face on.
- **Pockets**: 6, all on the far wall: its 4 corners, and the middles of its 2 long edges. Nothing on the near face, which is only a cushion.
- **Cue ball**: made as a calm bubble is, but at one size, the size of the rest. Hold anywhere and it swells into the hand, release to send it. A quick swipe steers and a curved one spins. After 0.35 s the finger is placing the shot (a soft tick): drag to move it, the line follows, and lifting sends it along the line, however the finger moves. Power rises with the hold for 0.8 s and no more (`POOL.cue.charge`), so taking time to aim costs nothing.
- **Always**: a new one can be made at any moment, while balls roll too. There is one at a time: touching lets the last fade. So there are no turns to wait for, no ball in hand, and a potted cue ball costs nothing.

## Balls and the rack

Fifteen, radius 0.22 as the cue ball, about a third of the largest calm bubble, in a pyramid with its tip towards the viewer: 1, 4 and 9 balls in each other's hollows, all touching, and the 8 behind the middle. 7 solids and 7 stripes, alternating. Cleared, it is set again.

A break moves every ball. Collisions alone do not: pushes reach the middle ball and the 8 at right angles, so a light break left most of the rack still. So the first touch also springs the rack apart, at 0.18 of its speed (`POOL.rack.burst`). This is the one thing that is not true physics.

A ball drops when its middle comes within 0.2 of where it would sit snug in a pocket, touching every wall there (`POOL.mouth`), so corners and middles allow the same. The drawn corners follow from it; the middles are drawn wider than they take (`POOL.holes.side`), as true ones looked too small beside the corners. Pockets draw faintly what is within 0.75 (`POOL.draw`): only a ball stopped on the lip, within 0.25, tips in. Drag is a constant slowing of 0.12, so others truly stop and hang where they stop. Cushions keep 0.8 of the speed into them and grip.

## Aiming

A faint line runs straight ahead, as a release without a swipe would go, with a ring where the cue ball would touch and a line to where the ball it meets would land, bolder if that drops. A quick swipe fades it, as it no longer tells the truth; once placing, it always shows. Because the shot starts at the finger and flies at the vanishing point, where you put your finger is how you cut the ball. The ball in the hand is translucent so as not to hide its target.

Depth shows by size, haze, and a shadow on the far wall straight behind each ball.

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

## Physics

`core/pool`, apart from `core/world`, whose soft contacts are wrong for this: at 1/120 s a 30 degree cut came out 2 to 5 degrees off. Each step finds the earliest contact among balls, cushions and pockets, moves to it, resolves it and goes on, up to a limit, so contacts are exact at any speed (ADR 1). The line uses the same contacts, but not the pockets' draw, so near a pocket it is a little off. Balls have equal density and push only along the line between them. The cue ball's spin bends its path and kicks off cushions.

## Rules

None in the trial. Planned (part C of section 1 in the [plan](plan.md)): standard 8-ball for two players, adapted slightly where a cue ball always to hand leaves a rule nothing to act on. Turns, then, must be brought back: a shot waits for the table to be still.

## Fit with the vision

The balls left are the score; potted ones rest in a row at the top. No numbers, timer or words.

## What the trial must answer, on a phone

1. Is a pot satisfying, and does placing the finger feel like aiming?
2. Is a pocket narrow enough, and the top power of a hold enough for a break?
3. Is the line a help, or does it play the game for you? (`POOL.aim.opacity` 0 hides it.)
4. Is depth clear when nothing moves?
5. What happens to balls that come to rest near the glass?
