import { both, fill, INK, line, oval, poly, rect, shape, star, type Shape } from './shapes';

/** Eyes and mouths shared by the casts. Hats are drawn by each theme, so none repeat. */
const W = '#ffffff';
const brow = (tilt: number, c = INK, y = -0.36) =>
  both(line(`M.14 ${y + tilt}L.46 ${y - tilt}`, c, 0.09));

export const eyes = {
  dots: both(fill(oval(0.28, -0.08, 0.1, 0.14), INK), fill(oval(0.25, -0.13, 0.035), W)),
  wide: both(
    shape(oval(0.27, -0.1, 0.21, 0.23), W),
    fill(oval(0.23, -0.07, 0.1, 0.12), INK),
    fill(oval(0.19, -0.12, 0.035), W),
  ),
  small: both(fill(oval(0.2, -0.06, 0.07), INK)),
  sleepy: both(
    shape(oval(0.27, -0.08, 0.2), W),
    fill(oval(0.25, 0, 0.1), INK),
    shape('M.06-.06A.21.21 0 0 1 .48-.06Z', '#00000088'),
  ),
  happy: both(line('M.14-.04Q.28-.3.42-.04', INK, 0.075)),
  shut: both(line('M.14-.1Q.28.06.42-.1', INK, 0.07)),
  angry: [
    ...both(shape(oval(0.27, -0.08, 0.19), W), fill(oval(0.22, -0.05, 0.09), INK)),
    ...brow(0.09),
  ],
  worried: [
    ...both(shape(oval(0.27, -0.06, 0.2, 0.22), W), fill(oval(0.25, 0, 0.07), INK)),
    ...brow(-0.08),
  ],
  dizzy: both(line('M.16-.2L.38.04M.38-.2L.16.04', INK, 0.075)),
  cyclops: [
    shape(oval(0, -0.12, 0.36), W),
    fill(oval(0, -0.1, 0.2), '#e0a020'),
    fill(oval(0, -0.1, 0.11), INK),
    fill(oval(-0.07, -0.18, 0.05), W),
  ],
  three: [
    ...both(shape(oval(0.36, -0.02, 0.17), W), fill(oval(0.34, 0, 0.08), INK)),
    shape(oval(0, -0.24, 0.19), W),
    fill(oval(0, -0.22, 0.09), INK),
  ],
  shades: [
    shape('M-.55-.2H.55L.48.06Q.3.2.12.04L.06-.08H-.06L-.12.04Q-.3.2-.48.06Z', '#15131f'),
    line('M-.42-.1L-.3.02M.18-.1L.3.02', '#ffffff88', 0.05),
  ],
  patch: [
    shape(oval(-0.27, -0.1, 0.2), W),
    fill(oval(-0.23, -0.08, 0.1), INK),
    line('M-.85-.45L.9-.1', INK, 0.07),
    shape('M.06-.3H.5Q.52.06.28.12Q.04.06.06-.3Z', '#15131f'),
  ],
  sockets: both(fill(oval(0.28, -0.06, 0.2, 0.24), INK)),
};
/** Eyes that shine from the dark. */
export const embers = (c: string): Shape[] =>
  both(
    { ...fill(poly(0.1, -0.02, 0.46, -0.2, 0.42, 0.06), c), blur: 0.04 },
    fill(poly(0.12, -0.02, 0.44, -0.17, 0.4, 0.04), c),
  );
export const cateyes = (c: string): Shape[] =>
  both(shape(oval(0.28, -0.1, 0.19, 0.2), c), fill(oval(0.28, -0.1, 0.05, 0.16), INK));

export const mouths = {
  smile: [line('M-.28.26Q0 .54.28.26', INK, 0.07)],
  grin: [
    shape('M-.34.24H.34Q.28.62 0 .62Q-.28.62-.34.24Z', '#5a1228'),
    fill('M-.28.26H.28V.36H-.28Z', W),
  ],
  smirk: [line('M-.16.4Q.16.46.32.26', INK, 0.07)],
  frown: [line('M-.24.46Q0 .22.24.46', INK, 0.07)],
  grit: [
    shape('M-.34.26H.34V.5H-.34Z', W),
    line('M-.17.26V.5M0 .26V.5M.17.26V.5M-.34.38H.34', INK, 0.03),
  ],
  oh: [shape(oval(0, 0.4, 0.12, 0.16), '#5a1228')],
  gap: [
    shape('M-.34.26H.34Q.26.58 0 .58Q-.26.58-.34.26Z', '#5a1228'),
    fill(rect(-0.2, 0.27, 0.15, 0.13), W),
    fill(rect(0.1, 0.27, 0.13, 0.13), W),
  ],
  fangs: [
    shape('M-.34.24H.34Q.26.54 0 .54Q-.26.54-.34.24Z', '#5a1228'),
    ...both(fill(poly(0.08, 0.25, 0.24, 0.25, 0.16, 0.46), W)),
  ],
  tongue: [
    shape('M-.32.24H.32Q.26.56 0 .56Q-.26.56-.32.24Z', '#5a1228'),
    shape('M-.12.46Q0 .36.12.46V.66Q0 .82-.12.66Z', '#ff6b81'),
  ],
  flat: [line('M-.22.38H.22', INK, 0.07)],
  wavy: [line('M-.3.4Q-.2.26-.1.4T.1.4T.3.4', INK, 0.06)],
  kiss: [fill('M-.16.36Q-.08.26 0 .34Q.08.26.16.36Q0 .54-.16.36Z', '#d8254f')],
  jagged: [
    shape(
      'M-.48.2L-.32.3L-.2.2L-.08.3L.06.2L.2.3L.32.2L.48.28Q.36.64 0 .64Q-.36.64-.48.2Z',
      '#2a0a12',
    ),
  ],
};

export const moustache = (c: string): Shape =>
  shape(
    'M0 .2Q.2.1.4.24Q.5.32.6.22Q.5.48.26.42Q.1.4 0 .3Q-.1.4-.26.42Q-.5.48-.6.22Q-.5.32-.4.24Q-.2.1 0 .2Z',
    c,
  );
export const beard = (c: string, long = 1.15): Shape =>
  shape(`M-.82.1Q-.5.28-.3.2Q0 .06.3.2Q.5.28.82.1Q.8.8 0 ${long}Q-.8.8-.82.1Z`, c);
export const cheeks = (c: string): Shape[] => both(fill(oval(0.52, 0.2, 0.13, 0.09), c));
export const specs = (c: string): Shape[] => [
  ...both(shape(oval(0.28, -0.08, 0.24), '#ffffff55'), line(oval(0.28, -0.08, 0.24), c, 0.06)),
  line('M-.06-.08Q0-.16.06-.08', c, 0.06),
];
export const horns = (c: string, size = 1): Shape[] =>
  both(
    shape(
      `M.42-.82Q${0.6 + 0.1 * size} -${0.9 + 0.5 * size} ${0.95} -${0.8 + 0.6 * size}Q1.02-.85.72-.62Z`,
      c,
    ),
  );
export const batwings = (c: string): Shape[] =>
  both(shape('M.7-.1Q1.1-.8 1.7-.75Q1.5-.45 1.65-.2Q1.4-.2 1.4.1Q1.15.02 1.05.3Q.9.15.75.3Z', c));
export const medal = (x: number, y: number, c: string): Shape =>
  shape(star(x, y, 0.19, 5), c, 0.035);
export const cape = (c: string): Shape =>
  shape('M-.8-.35Q-1.35.6-1.15 1.15Q-.6.95 0 1.18Q.6.95 1.15 1.15Q1.35.6.8-.35Z', c);
