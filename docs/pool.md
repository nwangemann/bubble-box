# 8-ball in space

Design for section 1 of the [plan](plan.md). On paper only: nothing here has been drawn or played. Numbers marked _sim_ come from a throwaway simulation (equal frictionless balls, constant drag, no spin) and are starting points for 1.2. Units as in [architecture](architecture.md).

## The idea

A table is a rectangle twice as long as it is wide. In space it is a box as deep as it is wide. Along the screen's long side it still reads as a table seen from above: cue ball at the bottom, rack at the top, depth the one new thing.

## Table

- **Size**: 2 wide, 3.7 tall, 2 deep, set back so its near face is at z = 0.6. Near corners then clear the phone's rounded corners, and the strips above and below leave room for the dot and the potted balls. The near face is an invisible cushion.
- **Balls**: radius 0.1, so about 16 points at the front and 11 at the back on a 393 point wide phone. About twice as large against the table as real ones; smaller cannot be read or aimed at.
- **Pockets**: 12. The 8 corners, and the middles of the 4 long edges, as a table has 4 corners and 2 long sides. A ball drops when its centre comes within 0.32 of the point. It must be well over 0.173, as near as a ball's centre can get to a corner. Faces were rejected: a third of the open shots, and 1 layout in 10 with none (_sim_).
- **Cushions**: all six faces, keeping 0.8 of the speed into them. Nothing is nearer "down" than anything else.
- **Cloth**: the air. Drag is a constant slowing of about 0.4, as from cloth, not a share of speed, so balls truly stop and hang where they stop. Drift, buoyancy, tilt and the least speed of feels are all off.

## Rack

Fifteen balls fit neither a pyramid of 10 nor of 20. They do fit a body-centred cluster: the 8 in the middle, 8 around it as a cube's corners, 6 beyond its faces. The 14 make 7 opposite pairs, each a solid facing a stripe, so it is fair from every side. One of the 6 points at the cue ball.

Breaking is the weak spot (_sim_, 40 breaks each):

| Cue speed | Pocket | Potted | Scratch | 8 potted | Seconds |
| --------- | ------ | ------ | ------- | -------- | ------- |
| 8         | 0.28   | 0.25   | 10%     | 5%       | 6.0     |
| 12        | 0.28   | 0.78   | 17%     | 20%      | 6.8     |
| 12        | 0.32   | 1.15   | 23%     | 30%      | 6.8     |
| 16        | 0.32   | 1.43   | 17%     | 15%      | 7.2     |

So a break needs about 12, above the app's `maxSpeed` of 8; with a drag of 0.7 or more hardly anything drops. A flat triangle pots a little less; a pyramid pots about the same, and loses the 8 less often, but has no place for the 8 in the middle. The 8 dropping on the break is common enough that it is put back, not won or lost.

## Aiming and depth

Hardest question: a point on a flat screen is a line in space. Two ideas settle it.

1. **A touch means the first thing under it.** A ball or a wall; both have a depth, so any touch is one exact aim. Touch a ball to aim at its middle, a wall to play a kick shot.
2. **The cue's eye.** A round inset shows the target as the cue ball sees it, with a ghost of the cue ball overlapping it. Dragging anywhere slides the ghost across the target, slower than the finger. Which part is hit has only two directions, so nothing about depth is left to judge.

In the box itself: a line from the cue ball to the ghost, then a short one for the target and one for the cue ball. Without spin these leave at right angles, in any direction. Each ball drops a faint shadow on the back wall and the floor, so depth shows when nothing is moving (`roomContact` already does this).

The camera stays still for the trial. Standing behind the cue ball would be natural, but loses where everything is, and breaks "the near face is the screen". Try it only if the cue's eye fails.

How hard it is (_sim_, best open shot, 8 balls, 12 pockets of 0.32): 97% potted at 0.25 degrees of error, 95% at 0.5, 84% at 1, 60% at 2. Random directions pot 2.5% with pockets of 0.28. Half a degree over a distance of 2 is about 5 points in a 120 point inset showing four radii, within reach of a finger slowed down. Pocket size is the difficulty knob.

## Power and shooting

Pull back from the cue ball and let go; the line brightens and thickens with the pull. Sliding back to the ball cancels. Power and aim are separate touches, so letting go never spoils the aim. 1.2 may also try the app's own gesture: hold to charge, release to shoot.

## Spin

With no cloth, hitting above, below or beside the middle are all the same thing turned round: sideways spin, which only matters at cushions and, slightly, between balls. Real draw and follow need a cloth. So:

- **English** is real: spin is a full 3D vector that kicks off cushions.
- **Draw and follow** are a convention: up in the cue's eye is forward spin. It is kept along the shot's own line and spent after the first contact as a push ahead or back.

The trial needs only natural stop shots and cushion spin. Draw and follow are 1.4.

## Physics

A new `src/core/pool.ts` beside `world.ts`, reusing `Vec3`, `Box` and `projection`. Not `collide`: it eases overlap apart and has no exact contact time, right for soft bubbles and wrong here. At the app's 1/120 s step, a 30 degree cut leaves 2 degrees off at speed 3 and 5.5 degrees at 8 (_sim_), more than any aim error above. Collisions must be solved at their exact moment: within each step, find the earliest contact, move to it, resolve, repeat, up to a limit. This keeps ADR 1. The aim preview must use the same code as the shot.

Rest: under a small speed a ball stops; the turn ends when all have. About 6 to 7 s after a break; ordinary shots should be under 5 or drag rises at low speed.

## Rules kept

- Break, then the table is open until a legal pot chooses solids or stripes.
- A legal shot first hits your own group, then pots something or sends a ball to a cushion. Pot one of yours to go again.
- Scratch, or anything else illegal, gives the other player ball in hand. Depth has no finger, so it is placed on the plane midway back.
- The 8 last, in a pocket chosen by touching it. Early, in the wrong pocket, or with a scratch loses. On the break it is put back.

Dropped: calling other pockets, the three-foul rule, balls off the table, the push-out, a shot clock.

## Fit with the vision

A game with turns sits uneasily with "no scores, text or sound that asks for attention". It keeps to it this way:

- The balls are the score. Potted ones drift to a row at the edge; nothing is counted.
- No numbers on balls. Solids are plain films, stripes are banded, the 8 is nearly black, the cue ball clear. Told apart by pattern, not only colour.
- Whose turn it is: that side's balls glow softly. A foul is a slow dim and the cue ball coming loose, not a message.
- No timer. Waiting is calm.
- Words only where showdown has them, for who won.

It is a game, so like Showdown it is a stated exception. The vision changes only if 1.5 ships.

## What 1.2 must answer

1. Is the cue's eye understood, and is a pot satisfying?
2. Can you tell where everything is with nothing moving?
3. Is a break worth watching?
4. Is about 6 s of waiting calm or dull?

Build only: cue ball, five balls, 12 pockets, cue's eye, pull to shoot, exact collisions, cushion spin, put back when everything is gone. No rules, no turns, reached by a temporary entry. Keep if, on a phone, a new player pots a ball within their first five shots and wants another.
