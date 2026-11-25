import { fill, glow, line, n, oval, poly, rect, type Shape } from './shapes';

/** What murals are painted with: washes, light and mist. Nothing here has an outline. */

/** Filled from one colour at its top to another at its bottom. */
export const wash = (d: string, top: string, bottom: string, blur = 0): Shape => ({
  d,
  fill: top,
  to: bottom,
  blur,
});

/** `#rrggbb` with an opacity from 0 to 1. */
export const tint = (c: string, a: number) =>
  c.slice(0, 7) +
  Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');

/** Something that shines: a soft-edged body in a wide halo. `r` is the body. */
export const lamp = (x: number, y: number, r: number, c: string): Shape[] => [
  glow(oval(x, y, r * 2), tint(c, 0.16), r * 1.1),
  glow(oval(x, y, r * 1.25), tint(c, 0.3), r * 0.4),
  glow(oval(x, y, r), c, r * 0.06),
];

/** A level bank of mist. */
export const mist = (x: number, y: number, w: number, h: number, c: string): Shape =>
  glow(oval(x, y, w, h), c, h * 0.8);

/** Far hills, standing in `c` and fading out `deep` below. `seed` gives a different skyline. */
export const ridge = (y: number, rise: number, deep: number, seed: number, c: string): Shape => {
  const xy: number[] = [];
  for (let x = -1.05; x < 1.06; x += 0.05) {
    const up =
      Math.sin(x * 2.1 + seed * 1.7) +
      Math.sin(x * 4.7 + seed * 2.9) * 0.45 +
      Math.sin(x * 11 + seed * 5.3) * 0.12;
    xy.push(x, y - rise * (0.5 + up * 0.32));
  }
  return wash(poly(...xy, 1.05, y + deep, -1.05, y + deep), c, tint(c, 0));
};

/** A beam of light falling from (x, y), leaning by `lean` and widening to `w`. */
export const shaft = (x: number, y: number, long: number, lean: number, w: number, c: string) =>
  wash(
    poly(x - w * 0.2, y, x + w * 0.2, y, x + lean + w, y + long, x + lean - w, y + long),
    c,
    tint(c, 0),
    w * 0.25,
  );

/** Light broken on water: a path beneath x, widening from `w` towards the viewer. */
export const glitter = (x: number, y: number, long: number, w: number, c: string): Shape[] =>
  Array.from({ length: 22 }, (_, i) => {
    const t = (i + 0.5) / 22;
    const side = ((i * 0.61803) % 1) - 0.5;
    const half = w * (0.35 + t) * (0.35 + ((i * 0.75488) % 1) * 0.65);
    const at = x + side * w * (0.4 + t);
    return glow(
      oval(at, y + long * t * t, half, 0.004 + t * 0.008),
      tint(c, 0.8 - t * 0.55),
      0.004 + t * 0.006,
    );
  });

/** A bare tree growing from (x, y), leaning by `lean`. Twigs thin out to nothing. */
export const tree = (x: number, y: number, size: number, lean: number, c: string): Shape[] => {
  const levels: string[] = ['', '', '', '', '', ''];
  const grow = (px: number, py: number, angle: number, long: number, level: number, id: number) => {
    const bend = angle + Math.sin(id * 12.9) * 0.28;
    const mx = px + Math.sin(angle) * long * 0.5;
    const my = py - Math.cos(angle) * long * 0.5;
    const ex = mx + Math.sin(bend) * long * 0.5;
    const ey = my - Math.cos(bend) * long * 0.5;
    levels[level] += `M${n(px)} ${n(py)}Q${n(mx)} ${n(my)} ${n(ex)} ${n(ey)}`;
    if (level === levels.length - 1) return;
    const spread = 0.34 + ((id * 0.61803) % 1) * 0.3;
    grow(ex, ey, bend - spread, long * 0.76, level + 1, id * 2);
    grow(ex, ey, bend + spread * 0.9, long * 0.68, level + 1, id * 2 + 1);
  };
  grow(x, y, lean, size, 0, 1);
  return levels.map((d, i) => line(d, c, size * 0.13 * 0.6 ** i));
};

/** A slender tower with a pointed roof, dissolving at its foot. */
export const spire = (x: number, y: number, w: number, tall: number, c: string): Shape[] => [
  wash(
    poly(x - w * 0.42, y - tall, x + w * 0.42, y - tall, x + w * 0.5, y, x - w * 0.5, y),
    c,
    tint(c, 0),
  ),
  fill(poly(x - w * 0.5, y - tall, x, y - tall - w * 2.1, x + w * 0.5, y - tall), c),
];

/** A clear vessel: a body of light, brighter at the rim, with one highlight. */
export const glass = (d: string, c: string, shineX: number, top: number, long: number): Shape[] => [
  wash(d, tint(c, 0.28), tint(c, 0.85), 0.006),
  { ...line(d, tint(c, 0.55), 0.01), blur: 0.004 },
  glow(rect(shineX, top, 0.016, long), '#ffffffb0', 0.008),
];
