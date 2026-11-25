# Settings

The tray opens from the dot. Defaults live in `src/config/defaults.ts`; change them there and here together.

| Setting | Default    | Other options                                                                       | What Random does                              |
| ------- | ---------- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| Bubble  | Soap       | Glass, Pearl, Lantern, Aurora, Tide, Nebula, Ink, Mercury, Contour, Eclipse, Medusa | Each new bubble                               |
| Box     | Lattice    | Invisible, Whisper, Dusk                                                            | One box when chosen; choose again for another |
| Feel    | Drift      | Weightless, Lively, Syrup, Ascend                                                   | Each bubble, for life                         |
| Glass   | Ripple     | Still                                                                               | Each hit on the screen side                   |
| Tap     | New bubble | Pop                                                                                 | Each touch                                    |
| Meet    | None       | Sparks, Chiral, Sunflower, Frost, Kali, Julia, Chord, Apollo                        | Each meeting                                  |
| Pop     | None       | Film, Droplets, Mist, Shatter, Starlight, Implode, Brood, Chiral, Sunflower, Julia  | Each pop                                      |

Random never picks None. Pop None fades the bubble away quickly with no effect. Two-finger swipe always clears bubbles.

## Saving

Choices are saved as they change and restored at launch (`src/services/savedSettings.ts`). An option that no longer exists falls back to its default. A default only affects people who have no saved choice, so clear the app's data to see a new one.

## Reduce Motion

While the system setting is on, bubbles move slower and wobble less, Glass acts as Still, and Meet and Pop act as None. Saved choices are untouched. The amounts are in `calmFeel` in `src/config/defaults.ts`.
