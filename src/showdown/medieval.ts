import {
  batwings,
  beard,
  cape,
  cateyes,
  cheeks,
  embers,
  eyes,
  horns,
  medal,
  moustache,
  mouths,
} from './parts';
import {
  both,
  fill,
  glow,
  line,
  oval,
  poly,
  rect,
  scatter,
  shape,
  star,
  type Shape,
} from './shapes';
import type { Theme } from './types';

const tower = (x: number, y: number, w: number, h: number, c: string): Shape[] => [
  fill(rect(x, y - h, w, h), c),
  ...[0, 1, 2].map((i) =>
    fill(rect(x - 0.02 + (i * (w + 0.04)) / 2.6, y - h - 0.06, w / 4, 0.08), c),
  ),
  fill(rect(x + w / 2 - 0.02, y - h * 0.75, 0.04, 0.1), '#ffd27a'),
];
const pennant = (x: number, y: number, c: string): Shape[] => [
  line(`M${x} ${y}V${y - 0.24}`, '#3a2740', 0.015),
  fill(poly(x, y - 0.24, x + 0.2, y - 0.18, x, y - 0.11), c),
];
const tent = (x: number, y: number, a: string, b: string): Shape[] => [
  shape(poly(x - 0.3, y, x - 0.24, y - 0.26, x + 0.24, y - 0.26, x + 0.3, y), a, 0.015),
  fill(poly(x - 0.12, y, x - 0.1, y - 0.26, x + 0.02, y - 0.26, x + 0.02, y), b),
  fill(poly(x + 0.17, y, x + 0.13, y - 0.26, x + 0.24, y - 0.26, x + 0.3, y), b),
  shape(poly(x - 0.3, y - 0.24, x, y - 0.62, x + 0.3, y - 0.24), b, 0.015),
  fill(poly(x - 0.1, y - 0.24, x, y - 0.62, x + 0.1, y - 0.24), a),
  ...pennant(x, y - 0.6, a),
];

export const medieval: Theme = {
  name: 'Medieval',
  tagline: 'To the lists, good foamfolk',
  title: 'Champion of the Realm',
  font: 'Copperplate-Bold',
  accent: '#ffcf5a',
  verbs: ['unhorses', 'bests', 'banishes', 'smites'],
  sky: ['#33306b', '#a6577f', '#f4a871'],
  floor: { near: '#8d5f36', far: '#d7a263', pattern: 'sand', ink: '#5d3a20' },
  scenery: ({ horizon: h, top, bottom }) => [
    glow(oval(0.45, h - 0.75, 0.28), '#ffe0a055', 0.12),
    fill(oval(0.45, h - 0.75, 0.2), '#ffeec4'),
    fill(
      `M-1 ${h}V${h - 0.5}Q-.5 ${h - 0.85} 0 ${h - 0.4}Q.5 ${h - 0.7} 1 ${h - 0.35}V${h}Z`,
      '#6c4675',
    ),
    ...tower(-0.75, h, 0.2, 1.25, '#4a3260'),
    ...tower(-0.1, h, 0.24, 1.1, '#4a3260'),
    ...tower(-0.42, h, 0.2, 1.5, '#523768'),
    fill(rect(-0.75, h - 0.65, 0.85, 0.65), '#4a3260'),
    fill(`M-.36 ${h}V${h - 0.25}Q-.28 ${h - 0.4} -.2 ${h - 0.25}V${h}Z`, '#2a1a3c'),
    ...pennant(-0.65, h - 1.28, '#ff5d5d'),
    ...pennant(-0.32, h - 1.54, '#ffcf5a'),
    ...pennant(0.02, h - 1.12, '#5db6ff'),
    ...tent(0.62, h + 0.04, '#e9e2d0', '#c93b4a'),
    ...tent(-0.8, h + 0.06, '#e9e2d0', '#3768b5'),
    // The crowd behind the barrier.
    ...scatter(46, (a, b, c) =>
      fill(
        oval(a * 2 - 1, h + 0.06 - b * 0.06, 0.035 + c * 0.015),
        ['#3a2740', '#5a2f45', '#7c3f48'][Math.floor(c * 3)]!,
      ),
    ),
    shape(rect(-1.1, h + 0.06, 2.2, 0.1), '#b2413e', 0.012),
    ...[-5, -3, -1, 1, 3, 5].map((i) =>
      fill(
        poly(
          i / 5 - 0.1,
          h + 0.06,
          i / 5,
          h + 0.06,
          i / 5 + 0.06,
          h + 0.16,
          i / 5 - 0.04,
          h + 0.16,
        ),
        '#f0e3c0',
      ),
    ),
    ...both(
      shape(`M.78 ${top}H1.1V${top + 0.95}L.94 ${top + 0.8}L.78 ${top + 0.95}Z`, '#8a2438', 0.02),
      line(`M.83 ${top}V${top + 0.86}`, '#ffcf5a', 0.015),
      fill(star(0.94, top + 0.55, 0.1, 4, 0.35), '#ffcf5a'),
      line(`M.9 ${bottom}V${h + 0.1}`, '#3b2417', 0.06),
      glow(oval(0.9, h + 0.02, 0.2), '#ff9a3c88', 0.08),
      fill(`M.83 ${h + 0.1}Q.8 ${h} .9 ${h - 0.16}Q1 ${h} .97 ${h + 0.1}Z`, '#ffb347'),
    ),
  ],
  motes: { color: '#ffb866', size: 0.012, rise: 0.14 },
  cast: [
    {
      name: 'Sir Bubblesworth',
      skin: ['#e8ecf5', '#7d8aa6'],
      mark: [line('M0-1V1', '#5a6684', 0.08), fill(rect(-0.7, -0.22, 1.4, 0.24), '#171326')],
      face: [...both(fill(oval(0.28, -0.1, 0.09), '#8fe3ff'))],
      front: both(
        ...[0.25, 0.4, 0.55].map((y) => fill(oval(0.3, y, 0.05), '#2b2f45')),
        line('M.1.2V.62', '#5a6684', 0.04),
      ),
      hat: [
        shape('M0-.9Q.1-1.7.9-1.6Q.6-1.45.75-1.25Q.45-1.3.4-1.05Q.2-1.1.16-.86Z', '#e23b4e'),
        shape('M-.2-.98H.2V-.8H-.2Z', '#ffcf5a'),
      ],
    },
    {
      name: 'King Globulus',
      skin: ['#ffd9b8', '#c98260'],
      back: [cape('#8a1f3d')],
      face: [...eyes.sleepy, ...cheeks('#ff7a6a88'), beard('#f4f1e8', 1.2), moustache('#ffffff')],
      hat: [
        shape('M-.62-.62L-.72-1.3L-.34-1L0-1.45L.34-1L.72-1.3L.62-.62Q0-.48-.62-.62Z', '#ffcf3f'),
        fill(oval(0, -0.78, 0.1), '#e2324e'),
        ...both(
          fill(oval(0.36, -0.8, 0.07), '#3fa7ff'),
          shape(oval(0.72, -1.32, 0.08), '#e2324e', 0.03),
        ),
      ],
    },
    {
      name: 'Lady Lathera',
      skin: ['#ffc8dd', '#d3688f'],
      back: both(shape('M.6-.6Q1.25-.2 1.05.8Q.85.95.8.6Z', '#f2c14e')),
      face: [...eyes.happy, ...cheeks('#ff5d8f88'), ...mouths.kiss],
      hat: [
        shape('M-.5-.72Q0-.9.5-.72L.05-2Q0-2.05-.05-2Z', '#7a4fd0'),
        line('M-.4-1.02Q0-1.14.36-1.02M-.26-1.4Q0-1.48.22-1.4', '#ffd5f0', 0.06),
        line('M0-2Q.6-2 .55-1.4T.95-.7', '#ffd5f0cc', 0.09),
      ],
    },
    {
      name: 'Fizz the Fool',
      skin: ['#fff3e0', '#d3a6c8'],
      mark: [fill('M0-1H1V1H0Z', '#b0e04a88')],
      face: [
        ...eyes.wide,
        fill(oval(0, 0.16, 0.12), '#ff4757'),
        ...mouths.tongue,
        ...both(fill(poly(0.28, 0.14, 0.34, 0.3, 0.28, 0.42, 0.22, 0.3), '#e2324e')),
      ],
      hat: [
        shape('M-.02-.6Q.1-1.4.8-1.3Q1.35-1.2 1.2-.55Q.95-.95.66-.6Z', '#8e44ad'),
        shape('M.02-.6Q-.1-1.4-.8-1.3Q-1.35-1.2-1.2-.55Q-.95-.95-.66-.6Z', '#2ecc71'),
        shape('M-.3-.62Q-.2-1.2 0-1.6Q.2-1.2.3-.62Z', '#f1c40f'),
        ...[
          [1.2, -0.5],
          [-1.2, -0.5],
          [0, -1.62],
        ].map(([x, y]) => shape(oval(x!, y!, 0.12), '#ffd94a', 0.03)),
      ],
    },
    {
      name: 'Merlather',
      skin: ['#b9c8ff', '#5567c9'],
      face: [
        ...eyes.dots,
        beard('#dfe6f5', 1.4),
        moustache('#f5f8ff'),
        ...both(line('M.14-.3Q.3-.42.5-.28', '#f5f8ff', 0.1)),
      ],
      hat: [
        shape(
          'M-.98-.55Q0-.95.98-.55Q.6-.66.45-.78Q.3-1.4.5-1.85Q.1-1.75-.45-.78Q-.6-.66-.98-.55Z',
          '#34247a',
        ),
        fill(star(0.02, -1, 0.15), '#ffe066'),
        fill(star(0.26, -1.4, 0.09), '#ffe066'),
        fill(star(-0.4, -0.78, 0.07), '#ffe066'),
      ],
    },
    {
      name: 'Friar Foam',
      skin: ['#f0b98d', '#9c5f3c'],
      mark: [
        fill('M-1 .5Q0 .85 1 .5V1H-1Z', '#6b4226'),
        line('M-.8.72Q0 1 .8.72', '#e9d9a6', 0.07),
      ],
      face: [...eyes.shut, ...cheeks('#e2554a99'), ...mouths.grin],
      hat: [
        shape(
          'M-.95-.2Q-1.1-.75-.55-.85Q-.3-.62 0-.64Q.3-.62.55-.85Q1.1-.75.95-.2Q.8-.5.5-.48Q0-.38-.5-.48Q-.8-.5-.95-.2Z',
          '#6e3b1c',
        ),
      ],
    },
    {
      name: 'Robin Lather',
      skin: ['#c9ee9b', '#4f9350'],
      face: [
        ...eyes.dots,
        fill('M-.1.2Q0 .1.1.2L0 .26Z', '#8a5a2e'),
        ...mouths.smirk,
        shape('M-.14.56H.14L0 .86Z', '#8a5a2e'),
      ],
      hat: [
        shape('M-1.1-.52Q-.5-1.35.45-1.15Q.75-1 .75-.6Q.1-.8-1.1-.52Z', '#2f7a3d'),
        shape('M.2-.95Q.6-1.75 1.25-1.8Q1.05-1.2.36-.85Z', '#e8493f'),
        line('M.28-.9Q.7-1.4 1.1-1.68', '#7a1d1a', 0.04),
      ],
    },
    {
      name: 'The Black Blob',
      skin: ['#565a70', '#14121f'],
      mark: [fill('M-.75-.28L0-.1L.75-.28V.02L0 .18L-.75.02Z', '#05040a')],
      face: embers('#ff3b3b'),
      front: [line('M-.2.36V.72M0 .4V.78M.2.36V.72', '#05040a', 0.07)],
      hat: both(shape('M.5-.75Q.75-.9.7-1.35Q1.3-1.1 1.15-.5Q1-.42.82-.5Z', '#2e2a3d')),
    },
    {
      name: 'Gurgle the Dragon',
      skin: ['#ff9a6b', '#b62c2c'],
      back: [
        ...batwings('#8f1f3f'),
        shape('M.5.7Q1.3 1.1 1.5.55L1.75.6L1.5.2L1.3.5Q1.1.8.6.5Z', '#b62c2c'),
      ],
      mark: [
        fill(oval(0, 0.75, 0.6, 0.6), '#ffd08a'),
        line('M-.5.5H.5M-.55.72H.55', '#d98d4d', 0.04),
      ],
      face: [
        ...cateyes('#ffe34d'),
        ...mouths.jagged,
        ...both(fill(oval(0.09, 0.12, 0.035), '#5c1010')),
      ],
      hat: horns('#ffe9c4'),
    },
    {
      name: 'Pip the Peasant',
      skin: ['#e6cfa0', '#97744a'],
      face: [
        ...eyes.worried,
        ...mouths.gap,
        ...both(fill(oval(0.5, 0.14, 0.03), '#7a5230'), fill(oval(0.58, 0.22, 0.03), '#7a5230')),
      ],
      front: [line('M.2.42L.85.3', '#d9b84a', 0.05)],
      hat: [
        shape(
          'M-1.15-.5Q0-.85 1.15-.5Q.7-.66.6-.72Q.5-1.2 0-1.2Q-.5-1.2-.6-.72Q-.7-.66-1.15-.5Z',
          '#e3c15a',
        ),
        line('M-.58-.78Q0-.95.58-.78', '#a83a32', 0.1),
        line('M-1-.5L-1.2-.36M1-.5L1.22-.4', '#e3c15a', 0.05),
      ],
    },
    {
      name: 'The Hooded Drop',
      skin: ['#a58bc2', '#3b2a56'],
      back: [shape('M-1.02.5Q-1.3-.9 0-1.3Q1.3-.9 1.02.5Z', '#231a33')],
      face: [...eyes.small, ...mouths.flat],
      hat: [
        shape('M-1.05.3Q-1.3-1.05.1-1.5Q1.3-1.05 1.05.3Q.9-.5 0-.56Q-.9-.5-1.05.3Z', '#2d2142'),
      ],
    },
    {
      name: 'Dame Popalot',
      skin: ['#9fe8e0', '#2a8f97'],
      mark: [
        fill('M-.8.55L0 .35L.8.55V1H-.8Z', '#c8d0dd'),
        fill(star(0, 0.72, 0.16, 4, 0.4), '#e2324e'),
      ],
      face: [...eyes.angry, ...mouths.grit],
      front: [medal(0.62, 0.62, '#ffcf3f')],
      hat: [
        shape('M-.72-.5Q-.7-1.2 0-1.2Q.7-1.2.72-.5Q0-.75-.72-.5Z', '#f0c75a'),
        ...both(
          shape('M.6-.7Q.8-1.5 1.5-1.5Q1.35-1.3 1.45-1.15Q1.2-1.1 1.2-.9Q.95-.9.7-.55Z', '#ffffff'),
        ),
        line('M0-1.2V-.68', '#a07a20', 0.07),
      ],
    },
  ],
};
