# 8-ball in space

Design for section 1 of the [plan](plan.md), and the trial built for 1.2. Opened with the third side of the mode switch; the dot leaves. Units as in [architecture](architecture.md). Numbers marked _sim_ come from simulated shots, not play.

## Structure

- **The calm room.** Same box, same camera. The far wall is the table: a long rectangle seen face on.
- **Pockets**: 6, all on the far wall: its 4 corners, and the middles of its 2 long edges. Nothing on the near face, which is only a cushion.
- **Cue ball**: made as a calm bubble is. Hold anywhere and it grows under the finger, drag to move it, release to send it, a swipe steers and a curved swipe spins. Longer holds launch harder and make it larger and heavier (`POOL.cue.grows`; off keeps it the size of the rest, though a longer hold still launches harder). `ui/Pool` uses the calm code itself for what is in the hand.
- **Always**: a new one can be made at any moment, while balls roll too. There is one at a time: touching lets the last fade. So there are no turns to wait for, no ball in hand, and a potted cue ball costs nothing.

## Balls and the rack

Fifteen, radius 0.15, in a pyramid with its tip towards the viewer: 1, 4 and 9 balls in each other's hollows, all touching, and the 8 behind the middle. 7 solids and 7 stripes, alternating. Cleared, it is set again.

A break moves every ball. Collisions alone do not: pushes reach the middle ball and the 8 at right angles, so a light break left most of the rack still. So the first touch also springs the rack apart, at 0.18 of its speed (`POOL.rack.burst`). This is the one thing that is not true physics.

A ball drops when its middle comes within 0.55 of a pocket's point (it can come no nearer a corner than 0.26). Pockets draw faintly what is within 1.15 (`POOL.draw`): paths bend, and a ball that stops within about 0.7 drifts in. Drag is a constant slowing of 0.12, so others truly stop and hang where they stop. Cushions keep 0.8 of the speed into them and grip.

## Aiming

While the finger is still, a faint line runs straight ahead, as a release without a swipe would go, with a ring where the cue ball would touch and a line to where the ball it meets would land, bolder if that drops. A swipe fades it, as it no longer tells the truth. Because the shot starts at the finger and flies at the vanishing point, where you put your finger is how you cut the ball. The ball in the hand is translucent so as not to hide its target.

Depth shows by size, haze, and a shadow on the far wall straight behind each ball.

## How a break plays, simulated

40 breaks for each hold, straight, up to 0.1 off centre (_sim_).

| Hold  | Cue ball radius | Potted | 8 potted | Cue ball potted | Until still |
| ----- | --------------- | ------ | -------- | --------------- | ----------- |
| 0.1 s | 0.10            | 0      | 0%       | 0%              | 9 s         |
| 0.3 s | 0.15            | 0.2    | 0%       | 0%              | 9 s         |
| 0.8 s | 0.26            | 1.9    | 20%      | 7%              | 12 s        |
| 2 s   | 0.43            | 3.7    | 42%      | 0%              | 16 s        |

Every ball moved, but for 1 in 300 at the faintest tap. The 8 drops often on a hard break, which rules will have to allow for.

## Physics

`core/pool`, apart from `core/world`, whose soft contacts are wrong for this: at 1/120 s a 30 degree cut came out 2 to 5 degrees off. Each step finds the earliest contact among balls, cushions and pockets, moves to it, resolves it and goes on, up to a limit, so contacts are exact at any speed (ADR 1). The line uses the same contacts, but not the pockets' draw, so near a pocket it is a little off. Balls have equal density and push only along the line between them. The cue ball's spin bends its path and kicks off cushions.

## Rules

None in the trial. With the cue ball always to hand, pool's turns, fouls and ball in hand have nothing to act on, so 1.3 must be settled again after play: perhaps clear solids, then stripes, then the 8; perhaps two fingers, two players at once.

## Fit with the vision

The balls left are the score; potted ones rest in a row at the top. No numbers, timer or words.

## What the trial must answer, on a phone

1. Is a pot satisfying, and does placing the finger feel like aiming?
2. Should the cue ball grow?
3. Is the line a help, or does it play the game for you? (`POOL.aim.opacity` 0 hides it.)
4. Is depth clear when nothing moves?
5. What happens to balls that come to rest near the glass?
