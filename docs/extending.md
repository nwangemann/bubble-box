# Extending

Everything below appears in the tray automatically.

## Bubble style

1. Write SkSL in `src/styles/`: `half4 style(vec2 p, vec3 n, float rim)` (premultiplied) and `half4 halo()` (rgb, strength).
2. Use the helpers in `prelude.ts`: `fbm`, `film`, `spectrum`, `shine`, `skin`, `rimPow`.
3. Register it in `src/styles/index.ts`, with the `tint` it lends to effects.

Keep to about 6 `fbm` calls per pixel: ten bubbles can overlap.

## Environment

Add to `src/config/environments.ts`. A new kind of wall texture (image, frost, shader) is a new field there plus drawing in `roomPicture`.

## Meet and pop effects

1. Write `vec3 fx(vec2 p, float t)` in `src/fx/meet.ts` or `pop.ts`. `x` runs along the contact normal; use `hand()` and `spin` for twist, `blend()` for the two bubbles' colours.
2. Register it in `src/fx/index.ts`. `on` says which rows it appears in; a pop also needs `body`.

![Effects at three ages, meetings left, pops right](effects.png)

## Glass

Add to `src/config/glass.ts`. Wave speed and life are in `TUNING.glass`; ring spacing and decay are in `src/scene/glassFilter.ts`.

## Feel

Add to `src/config/feels.ts`. A new force is a new `Feel` field plus a line in `step` in `core/world.ts`.

![All styles in the Lattice box](styles.png)

Shaders compile once at start, so relaunch the app after editing one.
