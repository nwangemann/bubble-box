# Extending

Everything below appears in the tray and its previews, and joins Random, automatically. List new options in [settings](settings.md).

## Bubble style

1. Write SkSL in `src/styles/`: `half4 style(vec2 p, vec3 n, float rim)` (premultiplied) and `half4 halo()` (rgb, strength).
2. Use the helpers in `prelude.ts`: `fbm`, `film`, `spectrum`, `shine`, `skin`, `rimPow`.
3. Register it in `src/styles/index.ts`, with the `tint` it lends to effects.

Add `turn` to the rotation of anything on the surface so spin shows (`skin` already does). Leave highlights still: the light does not spin.

Keep to about 6 `fbm` calls per pixel: ten bubbles can overlap.

### Custom pattern

Add a branch to `motif` in `src/styles/custom.ts` and a name in the same place in `PATTERNS` in `src/config/custom.ts`: their orders must match.

## Environment

Add to `src/config/environments.ts`. Give it a `day` palette. For a material, write `vec4 wall(vec2 t)` (colour, opacity) in `MATERIALS` in `src/scene/walls.ts`, honour `soft`, and name it in `wall`. `lit` is how well walls catch light from bubbles; a style casts light with `glow`.

## Meet and pop effects

1. Write `vec3 fx(vec2 p, float t)` in `src/fx/meet.ts` or `pop.ts`. `x` runs along the contact normal; use `hand()` and `spin` for twist, `blend()` for the two bubbles' colours.
2. Register it in `src/fx/index.ts`. `on` says which rows it appears in; a pop also needs `body`.

![Effects at three ages, meetings left, pops right](effects.png)

## Glass

Add to `src/config/glass.ts`. Wave speed and life are in `TUNING.glass`; ring spacing and decay are in `src/scene/glassFilter.ts`.

## Contact

Add to `src/config/contacts.ts`. What merging does is `startMerge` and `sink` in `core/world.ts`.

## Showdown theme

Write a `Theme` in `src/showdown/` and register it in `index.ts`. A cast is twelve; `npm test` fails if two share a name, colours, face or hat. Draw a `Fighter` on a ball of radius 1 with the helpers in `shapes.ts` and `parts.ts`, staying within 2.2. Place scenery from `horizon` up, so it fits any screen. A new rule is an entry in `src/config/rules.ts`.

## Feel

Add to `src/config/feels.ts`. A new force is a new `Feel` field plus a line in `step` in `core/world.ts`.

![All styles in the Lattice box](styles.png)

Shaders compile once at start, so relaunch the app after editing one.
