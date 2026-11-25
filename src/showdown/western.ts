import { beard, cheeks, eyes, horns, medal, moustache, mouths, specs } from './parts';
import { both, fill, glow, line, oval, poly, rect, shape, scatter, type Shape } from './shapes';
import type { Theme } from './types';

const cactus = (x: number, y: number, s: number): Shape[] => [
  line(
    `M${x} ${y}V${y - s}M${x} ${y - s * 0.4}H${x - s * 0.3}V${y - s * 0.72}M${x} ${y - s * 0.3}H${x + s * 0.3}V${y - s * 0.6}`,
    '#2f5c3f',
    s * 0.17,
  ),
  line(`M${x - s * 0.03} ${y}V${y - s}`, '#4b8757', s * 0.04),
];
/** A false-fronted building on the right; mirrored for the left. */
const front = (h: number, wall: string, trim: string, rise: number): Shape[] => [
  fill(poly(1.1, h - rise - 0.3, 0.66, h - rise + 0.02, 0.66, h + 0.06, 1.1, h + 0.42), wall),
  ...[0.2, 0.4, 0.6, 0.8].map((t) =>
    line(
      `M1.1 ${h - rise - 0.3 + t * (rise + 0.72)}L.66 ${h - rise + 0.02 + t * (rise + 0.04)}`,
      trim,
      0.012,
    ),
  ),
  fill(
    poly(1.1, h - rise - 0.44, 0.63, h - rise - 0.06, 0.63, h - rise + 0.04, 1.1, h - rise - 0.26),
    trim,
  ),
  fill(poly(0.94, h - 0.42, 0.82, h - 0.36, 0.82, h + 0.16, 0.94, h + 0.27), '#2a130f'),
  fill(
    poly(0.93, h - rise * 0.75, 0.8, h - rise * 0.68, 0.8, h - rise * 0.48, 0.93, h - rise * 0.5),
    '#ffcf7a',
  ),
  fill(poly(1.1, h - 0.6, 0.56, h - 0.38, 0.56, h - 0.33, 1.1, h - 0.5), trim),
  line(`M.58 ${h - 0.36}V${h + 0.04}`, trim, 0.025),
];

export const western: Theme = {
  name: 'Western',
  tagline: 'This box ain’t big enough for all of us',
  title: 'Fastest Bubble in the West',
  font: 'Rockwell-Bold',
  accent: '#ffb84a',
  verbs: ['outdraws', 'runs off', 'lassos', 'outfoxes'],
  backdrop: ['#86422f', '#260e14'],
  ink: [255, 205, 140],
  mural: ({ horizon: h }) => [
    glow(oval(0, h - 0.28, 0.62), '#fff0a855', 0.2),
    fill(oval(0, h - 0.28, 0.42), '#fff0b0'),
    fill(`M-1 ${h}V${h - 0.5}H-.72L-.64 ${h - 0.72}H-.4L-.34 ${h - 0.45}L-.2 ${h}Z`, '#b1493f'),
    fill(`M1 ${h}V${h - 0.35}L.8 ${h - 0.62}H.46L.4 ${h - 0.35}L.28 ${h}Z`, '#b1493f'),
    fill(`M.05 ${h}L.1 ${h - 0.3}H.22L.3 ${h}Z`, '#9a3b3c'),
    fill(rect(-1, h - 0.03, 2, 0.04), '#8e4030'),
    ...cactus(-0.36, h + 0.1, 0.4),
    ...cactus(0.4, h + 0.06, 0.28),
    ...front(h, '#6e3a26', '#452015', 0.85).map((s) => ({ ...s, flip: true })),
    ...front(h, '#824a30', '#54281a', 1.05),
    line(
      `M-.62 ${h + 0.13}H-.3M-.58 ${h + 0.05}V${h + 0.22}M-.34 ${h + 0.05}V${h + 0.22}`,
      '#452015',
      0.03,
    ),
    ...scatter(3, (a, b) =>
      line(`M${a * 1.4 - 0.8} ${h - 1.7 + b * 0.5}q.05-.06.1 0q.05-.06.1 0`, '#4a1c30', 0.014),
    ),
  ],
  motes: { color: '#ffd9a0', size: 0.014, rise: 0.03 },
  cast: [
    {
      name: 'Sheriff Sudsy',
      skin: ['#ffd7a6', '#c17b45'],
      face: [...eyes.angry, moustache('#7a431d')],
      front: [medal(0.55, 0.66, '#ffd23f')],
      hat: [
        shape(
          'M-1.25-.75Q-.9-.4 0-.55Q.9-.4 1.25-.75Q1-.72.68-.8Q.62-1.55.3-1.5Q0-1.3-.3-1.5Q-.62-1.55-.68-.8Q-1-.72-1.25-.75Z',
          '#a8672f',
        ),
        line('M-.66-.84Q0-.68.66-.84', '#5c2f12', 0.12),
      ],
    },
    {
      name: 'Black Bart Bubble',
      skin: ['#c5c0cf', '#5a526b'],
      mark: [
        fill('M-1 .28Q0 .5 1 .28V1H-1Z', '#b3202c'),
        ...scatter(9, (a, b) => fill(oval(a * 1.6 - 0.8, 0.5 + b * 0.4, 0.045), '#ffffff')),
      ],
      face: eyes.small.concat(both(line('M.1-.26L.4-.16', '#1c1330', 0.1))),
      hat: [
        shape(
          'M-1.2-.5Q0-.82 1.2-.5Q1.1-.8.62-.8L.55-1.4Q0-1.6-.55-1.4L-.62-.8Q-1.1-.8-1.2-.5Z',
          '#17141f',
        ),
        line('M-.6-.86Q0-1 .6-.86', '#d9d9e6', 0.07),
      ],
    },
    {
      name: 'Prospector Pop',
      skin: ['#f3c1a0', '#a3603f'],
      face: [...eyes.wide, beard('#d8cfc0', 1.35), ...mouths.gap],
      hat: [
        shape(
          'M-1-.72Q-.5-.4 0-.62Q.6-.5.95-.85Q.7-.85.5-.88Q.6-1.5-.1-1.4Q-.6-1.3-.5-.8Q-.8-.8-1-.72Z',
          '#7d6b4a',
        ),
        shape(rect(-0.1, -1.24, 0.26, 0.24), '#b3953f', 0.03),
      ],
    },
    {
      name: 'Cactus Clementine',
      skin: ['#9be08a', '#2d7a4b'],
      back: scatter(18, (a) => {
        const t = a * Math.PI * 2;
        return line(
          `M${Math.cos(t) * 0.9} ${Math.sin(t) * 0.9}L${Math.cos(t) * 1.2} ${Math.sin(t) * 1.2}`,
          '#e9f5c8',
          0.045,
        );
      }),
      mark: [line('M-.5-1Q-.75 0-.5 1M.5-1Q.75 0 .5 1M0-1V-.5M0 .7V1', '#2d7a4b', 0.06)],
      face: [...eyes.dots, ...mouths.smile],
      hat: [0, 72, 144, 216, 288]
        .map((a) => {
          const t = (a * Math.PI) / 180;
          return shape(
            oval(0.2 + Math.cos(t) * 0.2, -1.05 + Math.sin(t) * 0.2, 0.15),
            '#ff6fae',
            0.03,
          );
        })
        .concat(shape(oval(0.2, -1.05, 0.12), '#ffe066', 0.03)),
    },
    {
      name: 'Undertaker Gloom',
      skin: ['#b8c9c4', '#4a5f62'],
      mark: [fill('M-.5.62L0 .8L.5.62V1H-.5Z', '#15131f')],
      face: [...eyes.sleepy, ...mouths.frown],
      hat: [
        shape(
          'M-.95-.6Q0-.78.95-.6Q.9-.78.6-.78L.66-1.9Q0-2-.66-1.9L-.6-.78Q-.9-.78-.95-.6Z',
          '#231f2e',
        ),
        line('M-.6-.96Q0-1.08.6-.96', '#6f3fa0', 0.14),
      ],
    },
    {
      name: 'Showgirl Sal',
      skin: ['#ffb3c6', '#c43f6b'],
      back: both(shape('M.55-.5Q1.2-.3 1.02.35Q.8.3.7 0Z', '#6b2417')),
      face: [...eyes.happy, ...cheeks('#e2324e88'), ...mouths.kiss],
      hat: [
        shape('M-.1-.8Q-.9-1.2-.75-1.8Q-.2-1.7 0-.9Z', '#8b5cf6'),
        shape('M.1-.8Q.9-1.2.75-1.8Q.2-1.7 0-.9Z', '#8b5cf6'),
        shape('M-.2-.8Q-.3-1.6 0-2.05Q.3-1.6.2-.8Z', '#ef4444'),
        line('M-.72-.66Q0-.95.72-.66', '#ffd23f', 0.14),
        shape(oval(0, -0.84, 0.12), '#5eead4', 0.03),
      ],
    },
    {
      name: 'Doc Droplet',
      skin: ['#bfe3ff', '#4a87b8'],
      face: [
        ...eyes.dots,
        ...specs('#c79a2e'),
        ...mouths.smirk,
        shape('M-.1.5H.1L.04 1H-.04Z', '#e9e2d0'),
      ],
      hat: [
        shape(
          'M-.85-.58Q0-.8.85-.58Q.85-.76.6-.76Q.6-1.35 0-1.35Q-.6-1.35-.6-.76Q-.85-.76-.85-.58Z',
          '#54402f',
        ),
        line('M-.6-.8Q0-.94.6-.8', '#2a1c13', 0.1),
      ],
    },
    {
      name: 'Buffalo Burst',
      skin: ['#a87250', '#4a2817'],
      back: [shape('M-1.1.1Q-1.3-.8-.6-1.1Q0-1.35.6-1.1Q1.3-.8 1.1.1Z', '#3a1f12')],
      mark: [fill(oval(0, 0.6, 0.55, 0.4), '#cf9c73')],
      face: [
        ...eyes.angry,
        ...both(fill(oval(0.16, 0.44, 0.08), '#3a1f12')),
        line('M-.2.72Q0 .66.2.72', '#3a1f12', 0.05),
        line('M-.12.52Q0 .74.12.52', '#ffd23f', 0.05),
      ],
      hat: [
        ...horns('#f3e6cf', 0.7),
        shape(
          'M-.5-.7Q-.5-1.2-.2-1Q0-1.3.2-1Q.5-1.2.5-.7Q.3-.45.15-.6Q0-.4-.15-.6Q-.3-.45-.5-.7Z',
          '#3a1f12',
        ),
      ],
    },
    {
      name: 'Tumbleweed Tim',
      skin: ['#f2dd9e', '#a67f3a'],
      back: scatter(12, (a, b) =>
        line(
          oval(
            Math.cos(a * 6.28) * 0.12,
            Math.sin(a * 6.28) * 0.12,
            0.95 + b * 0.16,
            0.85 + a * 0.25,
          ),
          '#8a6428',
          0.04,
        ),
      ),
      mark: scatter(9, (a, b, c) =>
        line(oval(a - 0.5, b - 0.5, 0.5 + c * 0.4, 0.3 + a * 0.5), '#8a642899', 0.035),
      ),
      face: [...eyes.dizzy, ...mouths.wavy],
      hat: [line('M-.3-.9Q-.5-1.4-.1-1.3T.2-1.5M.1-.92Q.4-1.3.7-1.2', '#8a6428', 0.06)],
    },
    {
      name: 'The Iron Horse',
      skin: ['#6d7688', '#1f2430'],
      back: [shape(rect(-0.32, -1.5, 0.64, 0.8), '#2b303d')],
      mark: [
        line(oval(0, 0, 0.86), '#c94a3a', 0.1),
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
          fill(oval(Math.cos(i * 0.785) * 0.86, Math.sin(i * 0.785) * 0.86, 0.04), '#ffd23f'),
        ),
      ],
      face: [
        shape(oval(0, -0.28, 0.26), '#fff3b0'),
        ...both(fill(oval(0.24, 0.1, 0.09), '#ffd9a0')),
        ...mouths.grit,
      ],
      front: [
        shape(poly(-0.8, 0.7, 0.8, 0.7, 1.0, 1.15, -1.0, 1.15), '#c94a3a'),
        line('M-.4.7L-.5 1.15M0 .7V1.15M.4.7L.5 1.15', '#1c1330', 0.04),
      ],
      hat: [
        shape(poly(-0.3, -1.4, -0.55, -1.75, 0.55, -1.75, 0.3, -1.4), '#c94a3a'),
        ...[
          [0, -1.95, 0.22],
          [0.3, -2.1, 0.16],
          [-0.24, -2.12, 0.14],
        ].map(([x, y, r]) => fill(oval(x!, y!, r!), '#ffffffbb')),
      ],
    },
    {
      name: 'Vulture Vic',
      skin: ['#ff9d8a', '#a8323a'],
      back: both(shape('M.6.1Q1.2-.4 1.7-.2Q1.5 0 1.6.2Q1.35.2 1.35.4Q1.1.4.8.7Z', '#2d2430')),
      mark: [
        ...both(fill(oval(0.5, 0.95, 0.5, 0.3), '#f5efe6')),
        fill(oval(0, 0.98, 0.5, 0.3), '#f5efe6'),
      ],
      face: [...eyes.sleepy, shape('M-.16.12Q0-.04.16.12Q.2.5-.04.72Q-.02.5-.16.4Z', '#ffc94a')],
      hat: [shape('M-.1-.9Q-.3-1.3-.35-1.5Q-.1-1.3 0-1.05Q0-1.4.15-1.6Q.2-1.3.14-.9Z', '#2d2430')],
    },
    {
      name: 'The Masked Rinse',
      skin: ['#f7f06d', '#b89a1d'],
      mark: [fill('M-1-.38Q0-.5 1-.38V.1Q.5.2 0 .02Q-.5.2-1 .1Z', '#1c1330')],
      face: [
        ...both(
          fill(oval(0.28, -0.12, 0.14, 0.1), '#ffffff'),
          fill(oval(0.26, -0.12, 0.06), '#1c1330'),
        ),
        ...mouths.grin,
      ],
      back: [shape('M.8-.2Q1.4-.4 1.45 0Q1.2 0 1.35.3Q1 .25.85.05Z', '#1c1330')],
      hat: [
        shape(
          'M-1.1-.58Q0-.74 1.1-.58L1.05-.74L.55-.78L.5-1.05Q0-1.15-.5-1.05L-.55-.78L-1.05-.74Z',
          '#3d2a66',
        ),
        ...[-0.4, -0.13, 0.13, 0.4].map((x) => fill(oval(x, -0.84, 0.05), '#ffd23f')),
      ],
    },
  ],
};
