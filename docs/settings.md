# Settings

The menu opens from the dot: a tile for each setting, with its name and what is chosen. The last tile, Clear, is an action: it lets every bubble go. Defaults live in `src/config/defaults.ts`; change them there and here together.

| Setting | Default    | Other options                                                                               | What Random does                                |
| ------- | ---------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Bubble  | Soap       | Glass, Pearl, Lantern, Aurora, Tide, Nebula, Ink, Mercury, Contour, Eclipse, Medusa, Custom | Each new bubble                                 |
| Box     | Lattice    | Invisible, Whisper, Dusk, Frost, Water, Silk, Stone, Felt                                   | One box when chosen; choose again for another   |
| Light   | Night      | Day                                                                                         | One light when chosen; choose again for another |
| Feel    | Drift      | Weightless, Lively, Syrup, Ascend                                                           | Each bubble, for life                           |
| Glass   | Ripple     | Still                                                                                       | Each hit on the screen side                     |
| Tap     | New bubble | Pop                                                                                         | Each touch                                      |
| Contact | Bounce     | Merge                                                                                       | Each pair, every time they touch                |
| Pull    | Near       | None, Far, Heavy                                                                            | Each pair, for life                             |
| Trail   | None       | Ribbon, Light, Echo                                                                         | Each bubble, for life                           |
| Meet    | None       | Sparks, Chiral, Sunflower, Frost, Kali, Julia, Chord, Apollo                                | Each meeting                                    |
| Pop     | None       | Film, Droplets, Mist, Shatter, Starlight, Implode, Brood, Chiral, Sunflower, Julia          | Each pop                                        |

Pull draws bubbles towards each other: Near is strong but short, Far is soft and long, Heavy grows with size. Trail shows where a bubble has been: Ribbon is a sliver of film, Light a glowing thread in the bubble's colour, Echo faint images of the bubble that thin to rings. Random never picks None for either. Pop None fades the bubble away quickly with no effect. Every pop, even None, gently pushes bubbles near it. Two-finger swipe always clears bubbles.

## Previews

Tapping a tile opens every option of that setting, alive. Tapping one chooses it and closes; the dot or empty space closes without choosing. Either way leads back to the tiles. Random shows one option after another. None plays the same scene without the effect. Previews use the other current settings. With Reduce Motion they are stills. Timing and sizes are in `TUNING.preview`.

## Showdown

Not a setting: the switch at the foot of the menu turns from Calm to Showdown, which opens the chooser, with the rule, how many enter, the cast and every arena. The same switch there turns back to the calm menu. Its third side opens 8-ball, whose own menu has the switch too. Random arena starts any of them. Up to 12 enter, or 24 from a mixed cast; fewer are drawn at random, and nobody appears twice. The cast is the arena's own by default; the arrows choose any one theme's for every arena, Random cast, a theme's drawn anew for each showdown, or Mixed cast, some of every theme. Again keeps the cast, but deals a mixed one anew. A count over 12 is kept for when Mixed is chosen again. Rule, how many and cast are saved.

During the line-up a tap on an entrant, there or in the roster, roots for it; the line-up waits while a finger is down, and a moment after a choice. Doing nothing skips it. A second tap enrages the favourite: it charges about in surges and is far likelier to win. A third lets it go. The favourite, but not its rage, is kept for the next showdown it enters, until the app closes. A win shows how many crowns the winner has, and a right call how many there have been; wrong calls are not counted and a raging win is not a call. Both are saved.

| Rule   | Default | What happens                                                                                |
| ------ | ------- | ------------------------------------------------------------------------------------------- |
| Absorb | Yes     | The winner takes the loser in and doubles in width. Odds follow width; equal sizes are even |
| Pop    |         | The loser pops. The winner doubles in width. Every clash is even                            |

With Reduce Motion it runs slower and motes, swaying, rising titles and a favourite's light are still.

## 8-ball

Its options are its own, apart from the calm room's: tiles in its menu, opened from its dot. A tap moves to the next option; the table is the preview. They are in `src/config/poolOptions.ts`. They have no Random.

| Setting | Default   | Other options  | What it does                                |
| ------- | --------- | -------------- | ------------------------------------------- |
| Trail   | All balls | Cue ball, None | A short streak shows which way and how fast |
| Cloth   | Space     | Felt           | The table: the see-through room, or felt    |

## Custom

Choosing Custom, or choosing it again, opens the maker: one large bubble with a pattern and four sliders. The dot or empty space closes it. Colour and Second are places on the colour wheel, Vivid runs from pale to full, and Size scales the pattern. Every Custom bubble, even one already in the room, follows the latest choice. Random includes it. Defaults are `DEFAULT_CUSTOM` in `src/config/custom.ts`.

Patterns: Plain, Bands, Swirl, Dots, Cells, Marble, Petals.

## Walls

Two sliders under Box's options, whose previews follow them. Opacity fades lines and materials; its middle is the box as designed, and it never changes the backdrop. Softness blurs lines, quiets materials and makes walls bounce less. They apply to every box and are saved. Defaults are `DEFAULT_WALLS` in `src/config/environments.ts`.

## Saving

Choices are saved as they change and restored at launch (`src/services/savedSettings.ts`). An option that no longer exists falls back to its default. A default only affects people who have no saved choice, so clear the app's data to see a new one.

## First-time hint

With a bubble loose and the screen untouched a few seconds, the two-finger swipe is acted out once. A touch or the menu sends it away, and cut short it tries again later. It never shows to someone who has already popped with two fingers. `hinted` is saved with the settings; clear the app's data to see it again.

## Reduce Motion

While the system setting is on, bubbles move slower and wobble less, tilting does nothing, Glass acts as Still, and Pull, Trail (8-ball's too), Meet and Pop act as None. The first-time hint stands still. Saved choices are untouched. The amounts are in `calmFeel` in `src/config/defaults.ts`.
