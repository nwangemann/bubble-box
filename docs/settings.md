# Settings

The tray opens from the dot. Defaults live in `src/config/defaults.ts`; change them there and here together.

| Setting | Default    | Other options                                                                       | What Random does                                |
| ------- | ---------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| Bubble  | Soap       | Glass, Pearl, Lantern, Aurora, Tide, Nebula, Ink, Mercury, Contour, Eclipse, Medusa | Each new bubble                                 |
| Box     | Lattice    | Invisible, Whisper, Dusk, Frost, Water, Silk, Stone                                 | One box when chosen; choose again for another   |
| Light   | Night      | Day                                                                                 | One light when chosen; choose again for another |
| Feel    | Drift      | Weightless, Lively, Syrup, Ascend                                                   | Each bubble, for life                           |
| Glass   | Ripple     | Still                                                                               | Each hit on the screen side                     |
| Tap     | New bubble | Pop                                                                                 | Each touch                                      |
| Meet    | None       | Sparks, Chiral, Sunflower, Frost, Kali, Julia, Chord, Apollo                        | Each meeting                                    |
| Pop     | None       | Film, Droplets, Mist, Shatter, Starlight, Implode, Brood, Chiral, Sunflower, Julia  | Each pop                                        |

Random never picks None. Pop None fades the bubble away quickly with no effect. Two-finger swipe always clears bubbles.

## Previews

A white title button in the tray opens every option of that setting, alive. Tapping one chooses it and closes; the dot or empty space closes without choosing. Random shows one option after another. None plays the same scene without the effect. Previews use the other current settings. With Reduce Motion they are stills. Timing and sizes are in `TUNING.preview`.

## Walls

Two sliders under Box. Opacity fades lines and materials; its middle is the box as designed, and it never changes the backdrop. Softness blurs lines, quiets materials and makes walls bounce less. They apply to every box and are saved. Defaults are `DEFAULT_WALLS` in `src/config/environments.ts`.

## Saving

Choices are saved as they change and restored at launch (`src/services/savedSettings.ts`). An option that no longer exists falls back to its default. A default only affects people who have no saved choice, so clear the app's data to see a new one.

## Reduce Motion

While the system setting is on, bubbles move slower and wobble less, tilting does nothing, Glass acts as Still, and Meet and Pop act as None. Saved choices are untouched. The amounts are in `calmFeel` in `src/config/defaults.ts`.
