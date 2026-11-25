# Settings

The tray opens from the dot. Defaults live in `src/config/defaults.ts`; change them there and here together.

| Setting | Default    | Other options                                                                               | What Random does                                |
| ------- | ---------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Bubble  | Soap       | Glass, Pearl, Lantern, Aurora, Tide, Nebula, Ink, Mercury, Contour, Eclipse, Medusa, Custom | Each new bubble                                 |
| Box     | Lattice    | Invisible, Whisper, Dusk, Frost, Water, Silk, Stone                                         | One box when chosen; choose again for another   |
| Light   | Night      | Day                                                                                         | One light when chosen; choose again for another |
| Feel    | Drift      | Weightless, Lively, Syrup, Ascend                                                           | Each bubble, for life                           |
| Glass   | Ripple     | Still                                                                                       | Each hit on the screen side                     |
| Tap     | New bubble | Pop                                                                                         | Each touch                                      |
| Contact | Bounce     | Merge                                                                                       | Each pair, every time they touch                |
| Meet    | None       | Sparks, Chiral, Sunflower, Frost, Kali, Julia, Chord, Apollo                                | Each meeting                                    |
| Pop     | None       | Film, Droplets, Mist, Shatter, Starlight, Implode, Brood, Chiral, Sunflower, Julia          | Each pop                                        |

Random never picks None. Pop None fades the bubble away quickly with no effect. Two-finger swipe always clears bubbles.

## Previews

A white title button in the tray opens every option of that setting, alive. Tapping one chooses it and closes; the dot or empty space closes without choosing. Random shows one option after another. None plays the same scene without the effect. Previews use the other current settings. With Reduce Motion they are stills. Timing and sizes are in `TUNING.preview`.

## Showdown

Not a setting: a name in its row starts that showdown, and its white button opens the chooser, with the rule and how many enter. Both are saved. Fewer than 12 are drawn at random from the cast; nobody appears twice.

| Rule   | Default | What happens                                                                   |
| ------ | ------- | ------------------------------------------------------------------------------ |
| Absorb | Yes     | The winner takes in 80% of the loser. Odds follow volume; equal sizes are even |
| Pop    |         | The loser pops. Every clash is even and nobody grows                           |

With Reduce Motion it runs slower and motes, swaying and rising titles are still.

## Custom

Choosing Custom, or choosing it again, opens the maker: one large bubble with a pattern and four sliders. The dot or empty space closes it. Colour and Second are places on the colour wheel, Vivid runs from pale to full, and Size scales the pattern. Every Custom bubble, even one already in the room, follows the latest choice. Random includes it. Defaults are `DEFAULT_CUSTOM` in `src/config/custom.ts`.

Patterns: Plain, Bands, Swirl, Dots, Cells, Marble, Petals.

## Walls

Two sliders under Box. Opacity fades lines and materials; its middle is the box as designed, and it never changes the backdrop. Softness blurs lines, quiets materials and makes walls bounce less. They apply to every box and are saved. Defaults are `DEFAULT_WALLS` in `src/config/environments.ts`.

## Saving

Choices are saved as they change and restored at launch (`src/services/savedSettings.ts`). An option that no longer exists falls back to its default. A default only affects people who have no saved choice, so clear the app's data to see a new one.

## Reduce Motion

While the system setting is on, bubbles move slower and wobble less, tilting does nothing, Glass acts as Still, and Meet and Pop act as None. Saved choices are untouched. The amounts are in `calmFeel` in `src/config/defaults.ts`.
