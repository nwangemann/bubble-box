import { beard, cheeks, eyes, moustache, mouths } from './parts';
import { both, fill, glow, line, oval, poly, rect, scatter, shape, star } from './shapes';
import type { Theme } from './types';

const skull = (x: number, y: number, s: number) => [
  fill(oval(x, y, s, s * 0.9), '#ffffff'),
  fill(rect(x - s * 0.5, y + s * 0.4, s, s * 0.7), '#ffffff'),
  fill(oval(x - s * 0.38, y, s * 0.26), '#15131f'),
  fill(oval(x + s * 0.38, y, s * 0.26), '#15131f'),
];

export const pirates: Theme = {
  name: 'Pirates',
  tagline: 'Dead bubbles tell no tales',
  title: 'Terror of the Seven Suds',
  font: 'AmericanTypewriter-Bold',
  accent: '#ffd35c',
  verbs: ['plunders', 'sinks', 'maroons', 'keelhauls'],
  sky: ['#0d4a6b', '#2c9aa6', '#c9f0d0'],
  floor: { near: '#7a4726', far: '#b87a44', pattern: 'planks', ink: '#4a2814' },
  scenery: ({ horizon: h, top }) => [
    glow(oval(-0.5, h - 1.75, 0.34), '#fff6c866', 0.14),
    fill(oval(-0.5, h - 1.75, 0.17), '#fff6c8'),
    ...[
      [0.5, h - 1.5],
      [-0.2, h - 1.15],
      [0.75, h - 0.95],
    ].flatMap(([x, y]) => [
      fill(oval(x!, y!, 0.22, 0.06), '#ffffffaa'),
      fill(oval(x! + 0.1, y! - 0.06, 0.13, 0.08), '#ffffffaa'),
    ]),
    fill(rect(-1, h - 0.5, 2, 0.52), '#16708a'),
    ...scatter(24, (a, b, c) =>
      line(`M${a * 2 - 1} ${h - 0.46 + b * 0.4}h${0.06 + c * 0.12}`, '#7fe0dc99', 0.01),
    ),
    // An island and a rival ship.
    fill(`M.35 ${h - 0.48}Q.6 ${h - 0.66} .95 ${h - 0.48}Z`, '#e8cf8a'),
    line(`M.62 ${h - 0.56}Q.64 ${h - 0.75} .7 ${h - 0.86}`, '#6b4420', 0.03),
    ...[-0.2, -0.1, 0.1, 0.2].map((x) =>
      line(`M.7 ${h - 0.86}Q${0.7 + x / 2} ${h - 0.98} ${0.7 + x} ${h - 0.84}`, '#2f8a4d', 0.035),
    ),
    fill(`M-.78 ${h - 0.56}H-.14L-.24 ${h - 0.36}H-.66Z`, '#4a2618'),
    line(`M-.58 ${h - 0.56}V${h - 1.12}M-.34 ${h - 0.56}V${h - 1.04}`, '#3a1c10', 0.02),
    fill(
      `M-.74 ${h - 1.06}H-.44Q-.38 ${h - 0.85} -.46 ${h - 0.66}H-.72Q-.64 ${h - 0.86} -.74 ${h - 1.06}Z`,
      '#2a2233',
    ),
    fill(
      `M-.44 ${h - 0.99}H-.2Q-.16 ${h - 0.82} -.2 ${h - 0.66}H-.42Q-.36 ${h - 0.82} -.44 ${h - 0.99}Z`,
      '#362c42',
    ),
    ...skull(-0.57, h - 0.88, 0.06),
    // Our own rail, masts and rigging.
    line(`M-1 ${h - 0.16}H1`, '#5c3219', 0.06),
    ...[-0.8, -0.4, 0, 0.4, 0.8].map((x) => line(`M${x} ${h - 0.16}V${h + 0.04}`, '#5c3219', 0.05)),
    ...both(
      line(`M.94 ${top}V${h + 0.55}`, '#4a2814', 0.13),
      line(`M.91 ${top}V${h + 0.55}`, '#7a4726', 0.04),
      line(
        `M.92 ${top + 0.25}L.45 ${h - 0.16}M.92 ${top + 0.7}L.62 ${h - 0.16}`,
        '#e8d3a055',
        0.012,
      ),
      shape(
        `M.66 ${h + 0.3}Q.62 ${h + 0.14} .66 ${h}H.86Q.9 ${h + 0.14} .86 ${h + 0.3}Z`,
        '#8a5228',
        0.014,
      ),
      line(`M.65 ${h + 0.08}H.87M.65 ${h + 0.22}H.87`, '#2a2233', 0.025),
    ),
  ],
  motes: { color: '#e9ffff', size: 0.011, rise: 0.05 },
  cast: [
    {
      name: 'Captain Brinebeard',
      skin: ['#ffc59c', '#b0653f'],
      face: [...eyes.angry, beard('#2a2233', 1.4), ...mouths.grin],
      hat: [
        shape('M-1.25-.5Q-1.1-1.1-.4-1.2Q0-1.7.4-1.2Q1.1-1.1 1.25-.5Q0-.95-1.25-.5Z', '#1d1a2b'),
        line('M-1.15-.6Q0-1 1.15-.6', '#ffd35c', 0.07),
        ...skull(0, -1.1, 0.16),
      ],
    },
    {
      name: 'One-Eye Olly',
      skin: ['#cfe8a0', '#6c8f3f'],
      face: [...eyes.patch, ...mouths.gap],
      hat: [
        shape('M-.9-.38Q-.8-1.05 0-1.08Q.8-1.05.9-.38Q0-.7-.9-.38Z', '#d62f43'),
        ...scatter(8, (a, b) => fill(oval(a * 1.2 - 0.6, -0.95 + b * 0.28, 0.06), '#ffffff')),
        shape('M.8-.45Q1.3-.6 1.35-.2Q1.1-.3 1.15.05Q.9-.05.85-.3Z', '#d62f43'),
      ],
    },
    {
      name: 'Polly Popper',
      skin: ['#ff7a5c', '#c41f36'],
      back: [
        ...both(shape('M.75-.1Q1.5 0 1.35.8Q1.1.7 1 .8Q.85.6.7.6Z', '#2f7bd6')),
        shape('M-.25.85L-.35 1.6L-.05 1.4L.1 1.65L.3.85Z', '#ffd35c'),
      ],
      mark: [fill(oval(0, 0.1, 0.72, 0.5), '#ffffff')],
      face: [
        ...eyes.wide,
        shape('M-.2.1Q0-.1.2.1Q.24.46 0 .62Q-.2.46-.2.1Z', '#ffc93f'),
        line('M-.18.28Q0 .36.2.26', '#1c1330', 0.04),
      ],
      hat: [
        shape('M-.25-.85Q-.5-1.5-.15-1.45Q-.1-1.7.15-1.55Q.5-1.65.35-1.2Q.4-1 .2-.85Z', '#37b24d'),
      ],
    },
    {
      name: 'Bones McFloat',
      skin: ['#fffef2', '#b5ad95'],
      face: [
        ...eyes.sockets,
        ...both(fill(oval(0.28, -0.04, 0.06), '#7df9ff')),
        fill('M0 .1L.1.28H-.1Z', '#1c1330'),
        line('M-.4.46H.4M-.24.36V.56M-.08.36V.56M.08.36V.56M.24.36V.56', '#1c1330', 0.045),
      ],
      back: [
        line('M-1.2 1.1L1.2-.4M1.2 1.1L-1.2-.4', '#1c1330', 0.3),
        line('M-1.2 1.1L1.2-.4M1.2 1.1L-1.2-.4', '#fffef2', 0.2),
      ],
      hat: [
        line('M-.2-.96Q-.4-1.4-.1-1.3M.05-1Q.1-1.5.35-1.35', '#b5ad95', 0.06),
        line('M.3-.9L.15-.7L.32-.6L.2-.45', '#1c1330', 0.04),
      ],
    },
    {
      name: 'Kid Kraken',
      skin: ['#d08cff', '#6a25a8'],
      back: both(
        line('M.5.6Q1.2 1 1.3.4T1.65.2', '#8c3fd0', 0.22),
        line('M.2.85Q.5 1.5.9 1.3T1.3 1.5', '#8c3fd0', 0.2),
      ),
      mark: scatter(7, (a, b) => line(oval(a * 1.4 - 0.7, 0.55 + b * 0.35, 0.08), '#f2c9ff', 0.04)),
      face: [...eyes.cyclops, ...mouths.fangs],
      hat: [
        shape('M-.3-.85Q-.2-1.6-.7-1.5Q-.95-1.4-.8-1.2M-.3-.85L.1-.95', '#8c3fd0'),
        shape('M0-.9Q.1-1.8.6-1.7Q.9-1.6.75-1.35Q.5-1.5.4-.85Z', '#8c3fd0'),
      ],
    },
    {
      name: 'First Mate Fizz',
      skin: ['#ffe08a', '#c98a1f'],
      mark: [0.45, 0.67, 0.89].map((y) => fill(rect(-1, y, 2, 0.11), '#2f6bb8')),
      face: [...eyes.happy, ...mouths.smile, ...cheeks('#ff7a4a88')],
      hat: [
        shape('M-.62-.65Q0-.85.62-.65L.7-.95Q.6-1.25 0-1.2Q-.6-1.25-.7-.95Z', '#ffffff'),
        line('M-.62-.72Q0-.9.62-.72', '#2f6bb8', 0.1),
        shape('M.4-.72Q.8-.5 1-.75Q.9-.3.5-.5Z', '#2f6bb8', 0.03),
      ],
    },
    {
      name: 'Marina Merlather',
      skin: ['#a8f5d8', '#2a9d7f'],
      back: [
        ...both(shape('M.4-.8Q1.3-.6 1.15.3T1.3 1Q.85.9.8.4Z', '#ff7eb6')),
        shape('M-.15.9Q-.4 1.2-.7 1.7Q-.2 1.6 0 1.4Q.2 1.6.7 1.7Q.4 1.2.15.9Z', '#1f7f9c'),
      ],
      face: [...eyes.dots, ...cheeks('#ff7eb688'), ...mouths.kiss],
      hat: [
        shape('M-.75-.6Q0-1 .75-.6Q.5-1.1 0-1.15Q-.5-1.1-.75-.6Z', '#ff7eb6'),
        shape(star(0.4, -0.85, 0.28), '#ffb84a'),
      ],
    },
    {
      name: 'Shark Bait',
      skin: ['#b8c9dc', '#49647f'],
      back: both(shape('M.75.3L1.5.75L.8.85Z', '#5f7c98')),
      mark: [fill('M-1 .2Q0 .0 1 .2V1H-1Z', '#f2f7fb')],
      face: [
        ...both(fill(oval(0.42, -0.22, 0.1), '#1c1330'), line('M.3-.4L.56-.34', '#1c1330', 0.07)),
        shape('M-.6.25Q0 .1.6.25Q.4.75 0 .75Q-.4.75-.6.25Z', '#7a1228'),
        fill(
          poly(
            -0.5,
            0.24,
            -0.38,
            0.4,
            -0.27,
            0.2,
            -0.14,
            0.38,
            0,
            0.18,
            0.14,
            0.38,
            0.27,
            0.2,
            0.38,
            0.4,
            0.5,
            0.24,
          ),
          '#ffffff',
        ),
      ],
      hat: [shape('M-.3-.85Q-.1-1.5.5-1.75Q.35-1.2.5-.8Z', '#5f7c98')],
    },
    {
      name: 'Cannonball Kate',
      skin: ['#5d5f70', '#13121c'],
      mark: [line('M-1 .0Q0 .18 1 0', '#2b2b38', 0.05)],
      face: [
        ...both(
          fill(oval(0.28, -0.12, 0.14, 0.18), '#ffffff'),
          fill(oval(0.25, -0.08, 0.07), '#1c1330'),
        ),
        ...mouths.grit,
      ],
      hat: [
        shape(rect(-0.2, -1.2, 0.4, 0.28), '#3a3a4a'),
        line('M0-1.2Q0-1.5.3-1.45T.6-1.7', '#e8d3a0', 0.07),
        shape(star(0.64, -1.74, 0.26, 8, 0.5), '#ffb01f', 0.03),
        fill(oval(0.64, -1.74, 0.09), '#fff3b0'),
      ],
    },
    {
      name: 'Treasure Chester',
      skin: ['#c98a4a', '#6b3a16'],
      mark: [
        line('M-1 .08H1', '#ffd35c', 0.16),
        line('M-.62-1V1M.62-1V1', '#ffd35c', 0.12),
        line('M-1 .5H1M-1-.5H1', '#4a2814', 0.03),
      ],
      face: [
        ...eyes.small.map((s) => ({ ...s, d: s.d.replace(/-0\.06/g, '-0.26') })),
        shape('M-.18.0H.18V.36H-.18Z', '#ffe9a0'),
        fill(oval(0, 0.14, 0.06), '#4a2814'),
        fill(poly(-0.04, 0.16, 0.04, 0.16, 0.06, 0.3, -0.06, 0.3), '#4a2814'),
        line('M-.3.62Q0 .76.3.62', '#1c1330', 0.06),
      ],
      hat: [
        [-0.4, -0.95],
        [0.4, -0.95],
        [0, -1.05],
        [-0.2, -1.2],
        [0.2, -1.22],
      ]
        .map(([x, y]) => shape(oval(x!, y!, 0.2, 0.15), '#ffd35c', 0.03))
        .concat(fill(poly(0, -1.55, 0.15, -1.4, 0, -1.25, -0.15, -1.4), '#5eead4')),
    },
    {
      name: 'Snips the Crab',
      skin: ['#ffab7a', '#e0531f'],
      back: both(
        line('M.8.3L1.25.1', '#e0531f', 0.14),
        shape('M1.15.1Q1-.5 1.45-.6Q1.35-.35 1.5-.25Q1.6-.5 1.75-.5Q1.9 0 1.4.2Z', '#ff8a4a'),
        line('M.75.65L1.2.85M.6.82L.95 1.15', '#e0531f', 0.1),
      ),
      face: [...mouths.wavy, ...cheeks('#c4302288')],
      hat: both(
        line('M.28-.8V-1.25', '#e0531f', 0.1),
        shape(oval(0.28, -1.32, 0.2), '#ffffff'),
        fill(oval(0.25, -1.3, 0.09), '#1c1330'),
      ),
    },
    {
      name: 'Admiral Froth',
      skin: ['#a0c4ff', '#3d62b0'],
      mark: [fill('M-1 .58Q0 .9 1 .58V1H-1Z', '#1f2f6b')],
      back: both(...[-0.5, -0.1, 0.3].map((y) => shape(oval(1, y, 0.2), '#ffffff'))),
      face: [
        ...eyes.sleepy,
        moustache('#ffffff'),
        ...mouths.flat.map((s) => ({ ...s, d: 'M-.1.54H.1' })),
      ],
      front: both(shape('M.55.6H1L.92.78H.6Z', '#ffd35c', 0.03)),
      hat: [
        shape('M-1.3-.7Q-.6-.5 0-.6Q.6-.5 1.3-.7Q1-1.3 0-1.4Q-1-1.3-1.3-.7Z', '#1f2f6b'),
        line('M-1.2-.74Q-.8-1.2 0-1.3Q.8-1.2 1.2-.74', '#ffd35c', 0.06),
        shape('M0-1.35Q-.2-1.9.3-2Q.3-1.7.12-1.35Z', '#ffffff'),
      ],
    },
  ],
};
