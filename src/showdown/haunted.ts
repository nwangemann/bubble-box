import { batwings, cape, cateyes, cheeks, embers, eyes, mouths } from './parts';
import { both, fill, glow, line, oval, poly, rect, scatter, shape, type Shape } from './shapes';
import type { Theme } from './types';

const bat = (x: number, y: number, s: number): Shape =>
  fill(
    `M${x} ${y}q${s * 0.3} ${-s * 0.5} ${s} ${-s * 0.35}q${-s * 0.2} ${s * 0.2}${-s * 0.1} ${s * 0.45}q${-s * 0.45} ${-s * 0.1}${-s * 0.9} ${s * 0.3}q${-s * 0.45} ${-s * 0.4}${-s * 0.9} ${-s * 0.3}q${s * 0.1} ${-s * 0.25}${-s * 0.1} ${-s * 0.45}q${s * 0.7} ${-s * 0.15} ${s} ${s * 0.35}Z`,
    '#120a24',
  );
const grave = (x: number, y: number, s: number): Shape[] => [
  shape(
    `M${x - s} ${y}V${y - s * 1.4}A${s} ${s} 0 0 1 ${x + s} ${y - s * 1.4}V${y}Z`,
    '#6f6a88',
    0.014,
  ),
  line(
    `M${x} ${y - s * 1.7}V${y - s * 0.6}M${x - s * 0.4} ${y - s * 1.35}H${x + s * 0.4}`,
    '#3d3856',
    0.02,
  ),
];

export const haunted: Theme = {
  name: 'Haunted',
  tagline: 'Only one will rest in foam',
  title: 'Ruler of the Night',
  font: 'Chalkduster',
  accent: '#b6ff5c',
  verbs: ['spooks', 'exorcises', 'haunts', 'hexes'],
  sky: ['#0d0722', '#2f1a55', '#5d3f78'],
  floor: { near: '#1f2b2a', far: '#4c5f4d', pattern: 'sand', ink: '#121a1a' },
  scenery: ({ horizon: h, top, bottom }) => [
    ...scatter(40, (a, b, c) =>
      fill(oval(a * 2 - 1, top + b * (h - top) * 0.7, 0.003 + c * 0.005), '#ffffff88'),
    ),
    glow(oval(0.38, h - 1.25, 0.5), '#fff2b04d', 0.16),
    fill(oval(0.38, h - 1.25, 0.33), '#fff2c4'),
    fill(oval(0.28, h - 1.32, 0.07), '#e6d49a'),
    fill(oval(0.48, h - 1.15, 0.1), '#e6d49a'),
    bat(0.2, h - 1.3, 0.13),
    bat(0.62, h - 1.5, 0.09),
    bat(-0.4, h - 1.7, 0.1),
    bat(-0.7, h - 1.3, 0.07),
    fill(
      `M-1 ${h}V${h - 0.25}Q-.4 ${h - 0.45} 0 ${h - 0.28}Q.5 ${h - 0.5} 1 ${h - 0.2}V${h}Z`,
      '#24173f',
    ),
    // The house.
    fill(poly(-0.66, h + 0.02, -0.62, h - 0.62, -0.12, h - 0.66, -0.06, h + 0.02), '#160d2a'),
    fill(poly(-0.7, h - 0.58, -0.4, h - 0.95, -0.04, h - 0.62), '#1d1136'),
    fill(poly(-0.6, h - 0.5, -0.58, h - 1.1, -0.4, h - 1.1, -0.38, h - 0.5), '#160d2a'),
    fill(poly(-0.64, h - 1.06, -0.48, h - 1.5, -0.34, h - 1.06), '#1d1136'),
    ...[
      [-0.53, h - 0.98],
      [-0.53, h - 0.42],
      [-0.28, h - 0.46],
    ].flatMap(([x, y]) => [
      glow(rect(x!, y!, 0.1, 0.14), '#ffb84a88', 0.04),
      fill(rect(x!, y!, 0.1, 0.14), '#ffc95c'),
    ]),
    fill(`M-.42 ${h + 0.02}V${h - 0.16}Q-.36 ${h - 0.26} -.3 ${h - 0.16}V${h + 0.02}Z`, '#ff8a3c'),
    ...both(
      line(`M.95 ${bottom}Q.98 ${h} .9 ${h - 0.4}Q.86 ${h - 0.7} .98 ${h - 1}`, '#120a24', 0.1),
      line(
        `M.9 ${h - 0.4}Q.75 ${h - 0.6} .62 ${h - 0.62}M.75 ${h - 0.55}L.66 ${h - 0.75}M.93 ${h - 0.75}Q.8 ${h - 0.95} .74 ${h - 1.15}`,
        '#120a24',
        0.035,
      ),
    ),
    ...grave(0.2, h + 0.1, 0.07),
    ...grave(0.46, h + 0.16, 0.085),
    ...grave(-0.14, h + 0.18, 0.06),
    ...grave(0.68, h + 0.05, 0.05),
    glow(oval(0, h + 0.12, 1.1, 0.07), '#c9ffd855', 0.08),
  ],
  motes: { color: '#b6ff8a', size: 0.013, rise: 0.06 },
  cast: [
    {
      name: 'Count Popula',
      skin: ['#e8e3f2', '#8d83ab'],
      back: [cape('#7a0f2b'), ...both(shape('M.7-.2Q1.3-.6 1.2.3Q1 .5.8.4Z', '#1d1a2b'))],
      face: [...eyes.sleepy, ...mouths.fangs],
      hat: [
        shape(
          'M-.95-.3Q-.95-1.05 0-1.08Q.95-1.05.95-.3Q.7-.75.35-.72L0-.38L-.35-.72Q-.7-.75-.95-.3Z',
          '#15131f',
        ),
      ],
    },
    {
      name: 'Wolfgang',
      skin: ['#b08a68', '#553822'],
      back: scatter(20, (a) => {
        const t = a * 6.283;
        return fill(
          poly(
            Math.cos(t - 0.16) * 0.95,
            Math.sin(t - 0.16) * 0.95,
            Math.cos(t) * 1.2,
            Math.sin(t) * 1.2,
            Math.cos(t + 0.16) * 0.95,
            Math.sin(t + 0.16) * 0.95,
          ),
          '#553822',
        );
      }),
      mark: [fill(oval(0, 0.45, 0.45, 0.4), '#d9b894')],
      face: [
        ...cateyes('#ffd23f'),
        fill('M-.14.12H.14L0 .28Z', '#1c1330'),
        ...mouths.jagged.map((s) => ({
          ...s,
          d: 'M-.36.36L-.2.44L-.1.36L0 .44L.1.36L.2.44L.36.36Q.2.72 0 .72Q-.2.72-.36.36Z',
        })),
      ],
      hat: both(
        shape('M.35-.85L.75-1.55L1-.6Z', '#6b4a30'),
        fill('M.52-.9L.74-1.28L.86-.74Z', '#d98a8a'),
      ),
    },
    {
      name: 'Frank N. Foam',
      skin: ['#a5d98a', '#4a7a4a'],
      back: both(
        shape(rect(0.9, 0.0, 0.4, 0.22), '#8b8fa3'),
        shape(rect(1.22, -0.08, 0.14, 0.38), '#6f7388'),
      ),
      face: [
        ...eyes.sleepy,
        ...mouths.flat,
        line('M.2-.55L.5-.4M.28-.6L.24-.46M.4-.54L.36-.4', '#1c1330', 0.04),
      ],
      hat: [
        shape(
          'M-.88-.45L-.8-1.15H.8L.88-.45L.62-.62L.42-.42L.2-.62L0-.42L-.2-.62L-.42-.42L-.62-.62Z',
          '#1d1a2b',
        ),
      ],
    },
    {
      name: 'Mummy Dearest',
      skin: ['#f5ecd2', '#b5a276'],
      mark: [
        line(
          'M-1-.7Q0-.5 1-.75M-1-.42Q0-.3 1-.5M-1 .2Q0 .34 1 .14M-1 .46Q0 .6 1 .4M-1 .72Q0 .86 1 .66',
          '#8f7d52',
          0.05,
        ),
        fill('M-.8-.28Q0-.12.8-.3V.06Q0 .2-.8.04Z', '#2a2033'),
      ],
      face: both(
        fill(oval(0.28, -0.08, 0.1), '#ffe34d'),
        fill(oval(0.26, -0.08, 0.045), '#1c1330'),
      ),
      back: [line('M.8.5Q1.3.6 1.2 1.1T1.5 1.5', '#e6d9b0', 0.16)],
      hat: [line('M-.3-.95Q.2-1.4.5-1.15T1.05-1.35', '#e6d9b0', 0.15)],
    },
    {
      name: 'Boo',
      skin: ['#ffffff', '#b9d4f2'],
      back: [
        shape(
          'M-.9.2L-1 1.3Q-.75 1.1-.55 1.35Q-.3 1.1 0 1.35Q.3 1.1.55 1.35Q.75 1.1 1 1.3L.9.2Z',
          '#dcebfb',
        ),
      ],
      face: [
        ...both(fill(oval(0.26, -0.1, 0.13, 0.2), '#1c1330')),
        fill(oval(0, 0.36, 0.16, 0.22), '#1c1330'),
        ...cheeks('#ff9ec288'),
      ],
    },
    {
      name: 'Jack O’Bubble',
      skin: ['#ffb04a', '#d9541a'],
      mark: [
        line(
          'M-.3-1Q-.6 0-.3 1M.3-1Q.6 0 .3 1M-.75-1Q-1.05 0-.75 1M.75-1Q1.05 0 .75 1',
          '#b8430f88',
          0.06,
        ),
      ],
      face: [
        ...both(shape(poly(0.12, 0, 0.48, 0, 0.3, -0.36), '#fff04d')),
        shape(
          'M-.6.2L-.4.34L-.25.22L-.08.36L.08.22L.25.36L.4.22L.6.2Q.45.72 0 .72Q-.45.72-.6.2Z',
          '#fff04d',
        ),
      ],
      hat: [
        shape('M-.16-.88Q-.1-1.3.2-1.45L.4-1.3Q.15-1.15.2-.88Z', '#4f7a35'),
        line('M.1-1Q.5-1.1.6-.85T.9-.95', '#4f7a35', 0.06),
      ],
    },
    {
      name: 'Hazel Hexlather',
      skin: ['#c9f27a', '#5c9a1f'],
      face: [
        ...eyes.angry,
        shape('M-.06.02Q.16.1.1.3Q0 .36-.1.28Z', '#a8d95c'),
        fill(oval(0.1, 0.22, 0.04), '#4a6b1a'),
        line('M-.3.44Q0 .6.3.38', '#1c1330', 0.07),
      ],
      back: both(shape('M.6-.5Q1.15-.1 1 .7L.8.5Z', '#ff8a3c')),
      hat: [
        shape(
          'M-1.3-.5Q0-.85 1.3-.5Q.7-.7.5-.8Q.35-1.2.55-1.6Q.6-1.9.95-1.85Q.5-2.2.2-1.75Q-.2-1.3-.5-.8Q-.7-.7-1.3-.5Z',
          '#2b1b47',
        ),
        line('M-.46-.86Q0-1 .46-.86', '#ff8a3c', 0.13),
        shape(rect(-0.1, -1.02, 0.2, 0.18), '#ffd23f', 0.03),
      ],
    },
    {
      name: 'Headless Hal',
      skin: ['#8d93a8', '#363b4f'],
      face: [],
      mark: [
        line('M-1 .3Q0 .5 1 .3M0 .4V1', '#23263a', 0.06),
        ...both(fill(oval(0.5, 0.62, 0.05), '#ffd23f')),
      ],
      front: [
        shape('M-.7-.5Q0-.2.7-.5Q.85-.1.4.02Q0 .12-.4.02Q-.85-.1-.7-.5Z', '#c41f36'),
        shape(oval(0.85, 0.7, 0.38), '#ffd3b0'),
        fill(oval(0.74, 0.66, 0.05), '#1c1330'),
        fill(oval(0.98, 0.66, 0.05), '#1c1330'),
        line('M.74.86Q.86.94.98.86', '#1c1330', 0.04),
      ],
      hat: [
        shape(oval(0, -0.62, 0.34, 0.1), '#5c1020'),
        glow('M-.15-.7Q-.3-1.1 0-1.5Q.3-1.1.15-.7Z', '#7df9ff99', 0.07),
        fill('M-.1-.7Q-.2-1 0-1.3Q.2-1 .1-.7Z', '#7df9ff'),
      ],
    },
    {
      name: 'Eyegor',
      skin: ['#fff5f0', '#e0b3b3'],
      mark: [
        line(
          'M-1-.3Q-.75-.2-.6-.35M-1 .3Q-.75.2-.6.35M1-.3Q.8-.1.6-.2M.9.6Q.7.5.6.35M-.5.95Q-.4.75-.25.7',
          '#d63a3a',
          0.04,
        ),
      ],
      face: [
        fill(oval(0, 0, 0.56), '#2f9ad6'),
        line(oval(0, 0, 0.56), '#164a75', 0.07),
        ...scatter(14, (a) => {
          const t = a * 6.283;
          return line(
            `M${Math.cos(t) * 0.3} ${Math.sin(t) * 0.3}L${Math.cos(t) * 0.5} ${Math.sin(t) * 0.5}`,
            '#8fd6ff',
            0.03,
          );
        }),
        fill(oval(0, 0, 0.27), '#12091f'),
        fill(oval(-0.16, -0.18, 0.1), '#ffffff'),
      ],
      back: [
        line('M0 .9Q.4 1.2 0 1.4T.1 1.8', '#d63a3a', 0.1),
        line('M-.1.9Q-.5 1.2-.3 1.5', '#e8787a', 0.07),
      ],
    },
    {
      name: 'Bog Bubble',
      skin: ['#7d9a5c', '#2c4026'],
      mark: scatter(10, (a, b, c) =>
        fill(oval(a * 1.8 - 0.9, b * 1.8 - 0.9, 0.06 + c * 0.08), '#4f6b38'),
      ),
      face: [...eyes.three, ...mouths.wavy],
      front: both(line('M.85-.2Q1.05.3.85.8M.6.6Q.75.9.6 1.2', '#2c4026', 0.08)),
      hat: [
        shape('M-.75-.65Q-.6-1.1-.25-1Q0-1.3.25-1Q.6-1.1.75-.65Q0-.95-.75-.65Z', '#3f6b2d'),
        line('M-.4-1Q-.5-1.4-.35-1.6M.35-1Q.55-1.3.5-1.6', '#6b9a3f', 0.05),
        shape(oval(0.1, -1.18, 0.14), '#ff7eb6', 0.03),
      ],
    },
    {
      name: 'Zom-Bubble',
      skin: ['#9fc2c9', '#3f5f6b'],
      mark: [
        fill(oval(0.6, -0.5, 0.25, 0.2), '#7fa35c'),
        fill(oval(-0.6, 0.6, 0.3, 0.2), '#7fa35c'),
      ],
      face: [
        shape(oval(-0.28, -0.1, 0.24), '#ffffff'),
        fill(oval(-0.36, -0.16, 0.07), '#1c1330'),
        shape(oval(0.28, -0.06, 0.16), '#ffef9e'),
        fill(oval(0.32, 0, 0.06), '#1c1330'),
        ...mouths.gap,
      ],
      hat: [
        shape('M-.5-.8Q-.55-1.2-.2-1.15Q0-1.35.2-1.15Q.55-1.2.5-.8Q0-.95-.5-.8Z', '#ff9ec2'),
        line('M-.2-1.1Q0-1 .0-.9M.2-1.1Q.1-1 .25-.9', '#b8456f', 0.04),
      ],
    },
    {
      name: 'Batty',
      skin: ['#8566b8', '#2d1a52'],
      back: batwings('#3d2766'),
      mark: [fill(oval(0, 0.62, 0.5, 0.45), '#b79be0')],
      face: [
        ...embers('#ff5c8a'),
        shape('M-.1.14L0 .06L.1.14L0 .24Z', '#ff9ec2', 0.03),
        ...mouths.smile,
        ...both(fill(poly(0.06, 0.38, 0.16, 0.36, 0.11, 0.54), '#ffffff')),
      ],
      hat: both(
        shape('M.2-.9Q.3-1.5.75-1.65Q1-1.2.8-.6Z', '#4c317d'),
        fill('M.36-.95Q.45-1.3.7-1.4Q.82-1.1.72-.78Z', '#e08ab8'),
      ),
    },
  ],
};
