import { cheeks, eyes, moustache, mouths } from './parts';
import { glass, mist, shaft, wash } from './scenery';
import { both, fill, glow, line, n, oval, rect, scatter, shape } from './shapes';
import type { Theme } from './types';

export const food: Theme = {
  name: 'Food Fight',
  tagline: 'The kitchen is now closed',
  title: 'Top of the Table',
  font: 'MarkerFelt-Wide',
  accent: '#ff7a59',
  verbs: ['toasts', 'roasts', 'whisks away', 'devours'],
  backdrop: ['#37857b', '#0d2c2f'],
  ink: [255, 238, 212],
  mural: ({ horizon: h, top, bottom }) => [
    // A still life in window light: clear vessels, fruit, and steam.
    ...[-0.6, -0.1, 0.4].map((x) => shaft(x, top, h - top, 0.4, 0.22, '#fff0c83a')),
    ...scatter(14, (a, b, c) =>
      glow(
        oval(a * 2 - 1, h - 1.9 + b * 1.3, 0.03 + c * 0.07),
        ['#ffe0a044', '#ffb8a044', '#b8ffe044'][Math.floor(c * 3)]!,
        0.012,
      ),
    ),
    mist(0, h - 0.1, 1.1, 0.24, '#fff0d055'),
    wash(rect(-1, h - 0.02, 2, bottom - h), '#e8c8a0', '#6a504466'),
    ...glass(
      `M-.8 ${n(h)}V${n(h - 0.42)}Q-.8 ${n(h - 0.58)} -.7 ${n(h - 0.64)}V${n(h - 0.96)}H-.62V${n(h - 0.64)}Q-.52 ${n(h - 0.58)} -.52 ${n(h - 0.42)}V${n(h)}Q-.66 ${n(h + 0.04)} -.8 ${n(h)}Z`,
      '#8fe0b8',
      -0.765,
      h - 0.46,
      0.32,
    ),
    ...glass(
      `M-.44 ${n(h + 0.03)}Q-.5 ${n(h - 0.3)} -.36 ${n(h - 0.36)}V${n(h - 0.5)}H-.24V${n(h - 0.36)}Q-.1 ${n(h - 0.3)} -.16 ${n(h + 0.03)}Q-.3 ${n(h + 0.07)} -.44 ${n(h + 0.03)}Z`,
      '#ffb070',
      -0.415,
      h - 0.24,
      0.18,
    ),
    ...glass(
      `M.6 ${n(h - 0.62)}H.9Q.92 ${n(h - 0.36)} .77 ${n(h - 0.3)}V${n(h - 0.04)}L.87 ${n(h + 0.01)}H.63L.73 ${n(h - 0.04)}V${n(h - 0.3)}Q.58 ${n(h - 0.36)} .6 ${n(h - 0.62)}Z`,
      '#ff8fa0',
      0.64,
      h - 0.56,
      0.14,
    ),
    // Fruit in a bowl, each lit from above.
    ...(
      [
        [0.06, 0.27, 0.11, '#ffb060', '#a8482c'],
        [0.42, 0.27, 0.1, '#f0e08a', '#8a7a34'],
        [0.24, 0.32, 0.13, '#ff9080', '#8c2c44'],
      ] as const
    ).flatMap(([x, y, r, a, b]) => [
      wash(oval(x, h - y, r), a, b, 0.006),
      glow(oval(x - 0.03, h - y - 0.05, 0.03), '#ffffff88', 0.02),
    ]),
    ...glass(
      `M-.08 ${n(h - 0.26)}H.56Q.52 ${n(h + 0.04)} .34 ${n(h + 0.04)}H.14Q-.04 ${n(h + 0.04)} -.08 ${n(h - 0.26)}Z`,
      '#c8f0f0',
      0,
      h - 0.2,
      0.1,
    ),
    // Light the glass lets through on to the table, then steam.
    glow(oval(-0.5, h + 0.12, 0.24, 0.03), '#8fe0b899', 0.03),
    glow(oval(-0.12, h + 0.15, 0.2, 0.025), '#ffb07099', 0.03),
    glow(oval(0.4, h + 0.13, 0.26, 0.03), '#ffffff66', 0.03),
    ...[-0.36, -0.3, -0.24].map((x, i) => ({
      ...line(
        `M${x} ${n(h - 0.54)}q${n(0.1 - i * 0.05)} -.16 0 -.32t${n(0.04 * (i - 1))} -.34`,
        '#ffffff55',
        0.02,
      ),
      blur: 0.018,
    })),
  ],
  motes: { color: '#ffffff', size: 0.012, rise: 0.05 },
  cast: [
    {
      name: 'Chef Boilaway',
      skin: ['#ffd9c2', '#d6896b'],
      face: [
        ...eyes.angry,
        moustache('#3a2418'),
        ...mouths.flat.map((s) => ({ ...s, d: 'M-.08.56H.08' })),
      ],
      front: [shape('M-.5.8Q0 .66.5.8L.2 1.1L0 .92L-.2 1.1Z', '#e2324e')],
      hat: [
        shape(
          'M-.6-.6Q0-.8.6-.6V-1Q1-1.1.8-1.5Q.5-1.75.25-1.55Q0-1.85-.25-1.55Q-.5-1.75-.8-1.5Q-1-1.1-.6-1Z',
          '#ffffff',
        ),
        line('M-.3-1L-.28-.8M0-1.04V-.84M.3-1L.28-.8', '#c9c9d6', 0.04),
      ],
    },
    {
      name: 'Bun Solo',
      skin: ['#f2c078', '#b0702c'],
      mark: [
        fill('M-1 .3H1V.44H-1Z', '#7ac74f'),
        fill('M-1 .42H1V.7H-1Z', '#6b3518'),
        fill('M-1 .28L-.6.5L-.2.28L.2.5L.6.28L1 .5V.22H-1Z', '#ffd23f'),
      ],
      face: [...eyes.dots, ...mouths.smile.map((s) => ({ ...s, d: 'M-.16.1Q0 .24.16.1' }))],
      hat: [
        shape('M-1.02-.35Q-1-1.2 0-1.22Q1-1.2 1.02-.35Q0-.55-1.02-.35Z', '#e09a45'),
        ...[
          [-0.5, -0.85],
          [-0.1, -1],
          [0.35, -0.9],
          [0.65, -0.65],
          [0.1, -0.72],
          [-0.72, -0.6],
        ].map(([x, y]) => fill(oval(x!, y!, 0.07, 0.045), '#fff3d6')),
      ],
    },
    {
      name: 'Donna Donut',
      skin: ['#ffb3da', '#d9579c'],
      mark: [
        fill('M-1 .5Q-.75.7-.5.5Q-.25.75 0 .55Q.25.75.5.5Q.75.7 1 .5V1H-1Z', '#d99a55'),
        ...scatter(22, (a, b, c) =>
          line(
            `M${a * 1.8 - 0.9} ${b * 1.4 - 0.95}l${0.1 * Math.cos(c * 6.28)} ${0.1 * Math.sin(c * 6.28)}`,
            ['#ffe34d', '#5eead4', '#ffffff', '#7a5cff'][Math.floor(c * 4)]!,
            0.06,
          ),
        ),
      ],
      face: [...eyes.happy, shape(oval(0, 0.32, 0.17), '#7a2a55')],
    },
    {
      name: 'Countess Cupcake',
      skin: ['#d9b3ff', '#8a5cc4'],
      mark: [
        fill(rect(-1, 0.35, 2, 0.7), '#ffe0ef'),
        line('M-.75.35L-.6 1M-.38.35L-.3 1M0 .35V1M.38.35L.3 1M.75.35L.6 1', '#e08ab8', 0.05),
      ],
      face: [
        ...eyes.wide,
        ...cheeks('#ff7eb688'),
        ...mouths.kiss.map((s) => ({
          ...s,
          d: 'M-.12.22Q-.06.14 0 .2Q.06.14.12.22Q0 .36-.12.22Z',
        })),
      ],
      hat: [
        shape(
          'M-.9-.42Q-1.1-.8-.65-.9Q-.65-1.3-.3-1.3Q-.2-1.7.1-1.75Q.4-1.5.35-1.3Q.7-1.25.65-.9Q1.1-.8.9-.42Q0-.75-.9-.42Z',
          '#fff0f7',
        ),
        line('M-.6-.88Q0-.7.55-.92M-.28-1.28Q0-1.15.3-1.3', '#f0b3d1', 0.05),
        shape(oval(0.1, -1.82, 0.17), '#e2324e'),
      ],
    },
    {
      name: 'Avo Cardio',
      skin: ['#dcf08a', '#6f9a3a'],
      mark: [
        line(oval(0, 0, 0.94), '#2f5c2a', 0.16),
        fill(oval(0, 0.5, 0.36, 0.34), '#8a5227'),
        fill(oval(-0.12, 0.4, 0.09), '#c98a55'),
      ],
      face: [...eyes.wide, ...mouths.smirk.map((s) => ({ ...s, d: 'M-.1.14Q.04.2.14.1' }))],
      hat: [
        line('M-.85-.45Q0-.85.85-.45', '#e2324e', 0.2),
        line('M-.85-.45Q0-.85.85-.45', '#ffffff', 0.06),
      ],
    },
    {
      name: 'Melon Collie',
      skin: ['#ff8a94', '#e2324e'],
      mark: [
        line(oval(0, 0, 0.96), '#2f8a4d', 0.18),
        line(oval(0, 0, 0.84), '#e6ffd9', 0.08),
        ...scatter(9, (a, b) => fill(oval(a * 1.2 - 0.6, 0.25 + b * 0.5, 0.04, 0.07), '#1c1330')),
      ],
      face: [
        ...eyes.worried,
        ...both(fill('M.5.14Q.4.36.5.42Q.6.36.5.14Z', '#7dd3ff')),
        ...mouths.frown,
      ],
      hat: [
        shape('M-.1-.95Q-.2-1.4.15-1.5L.28-1.36Q.06-1.3.1-.95Z', '#2f8a4d'),
        shape('M.1-1.1Q.5-1.5.9-1.2Q.6-.85.1-1.1Z', '#5cb85c'),
      ],
    },
    {
      name: 'Pizza Pete',
      skin: ['#ffe08a', '#e0a02c'],
      mark: [
        line(oval(0, 0, 0.94), '#b8702c', 0.18),
        ...[
          [-0.5, -0.5],
          [0.55, -0.45],
          [-0.6, 0.35],
          [0.55, 0.45],
          [0, 0.72],
          [0.02, -0.68],
        ].map(([x, y]) => shape(oval(x!, y!, 0.18), '#d6402f', 0.025)),
        ...[
          [-0.2, -0.45],
          [0.35, 0.7],
          [-0.75, 0],
        ].map(([x, y]) => fill(oval(x!, y!, 0.07, 0.04), '#4f9a3a')),
      ],
      face: [...eyes.shades, ...mouths.grin],
      hat: [
        shape('M-.75-.6Q0-.85.75-.6L.8-.85Q.5-1.25 0-1.2Q-.6-1.25-.8-.85Z', '#2f6bb8'),
        shape('M.2-.68Q.9-.75 1.3-.5Q.8-.45.3-.55Z', '#e2324e'),
      ],
    },
    {
      name: 'Sunny Sideup',
      skin: ['#fff9ec', '#d6d0c0'],
      back: [
        shape(
          'M-1.2.2Q-1.5-.4-1-.8Q-.4-1.4.3-1.1Q1.1-1.2 1.2-.4Q1.6.2 1.1.6Q.9 1.3.2 1.1Q-.5 1.4-.9.9Q-1.3.7-1.2.2Z',
          '#ffffff',
        ),
      ],
      mark: [fill(oval(0, 0, 0.7), '#ffc21f'), fill(oval(-0.25, -0.32, 0.16, 0.1), '#fff0a8')],
      face: [...eyes.sleepy, ...mouths.tongue],
    },
    {
      name: 'Broc Lee',
      skin: ['#b5dd7a', '#5c8f35'],
      face: [...eyes.angry, ...mouths.flat],
      front: [
        line('M-.95-.02Q0 .0.95-.02', '#00000000', 0.01),
        shape('M-.4.72H.4L.3 1.05H-.3Z', '#1c1330'),
        line('M0 .75L.2 1.2M0 .75L-.2 1.2', '#1c1330', 0.08),
      ],
      hat: [
        [-0.75, -0.7, 0.36],
        [0.75, -0.7, 0.36],
        [-0.35, -1.05, 0.4],
        [0.35, -1.05, 0.4],
        [0, -0.8, 0.42],
      ].map(([x, y, r]) => shape(oval(x!, y!, r!), '#2f7a36')),
    },
    {
      name: 'Sushi Sensei',
      skin: ['#ffffff', '#c9c9c0'],
      mark: [
        fill(rect(-1, 0.42, 2, 0.4), '#1f3a2b'),
        ...scatter(26, (a, b) =>
          line(`M${a * 1.8 - 0.9} ${b * 1.3 - 0.8}l.06.04`, '#d6d6cc', 0.05),
        ),
      ],
      face: [...eyes.shut, ...mouths.smirk.map((s) => ({ ...s, d: 'M-.12.2Q.06.28.16.16' }))],
      hat: [
        shape('M-1.05-.4Q-1-.95 0-1Q1-.95 1.05-.4Q0-.75-1.05-.4Z', '#ff8a5c'),
        line(
          'M-.6-.9Q-.55-.7-.7-.55M-.15-1Q-.1-.8-.2-.64M.35-.96Q.4-.8.3-.66M.75-.84Q.8-.7.75-.55',
          '#ffc9ab',
          0.08,
        ),
      ],
    },
    {
      name: 'Piña Collider',
      skin: ['#ffd24a', '#c27a12'],
      mark: [
        line(
          'M-1-.4L.4 1M-1 .2L-.2 1M-.8-.9L1 .9M-.2-1L1 .2M1-.4L-.4 1M1 .2L.2 1M.8-.9L-1 .9M.2-1L-1 .2',
          '#a8650f88',
          0.045,
        ),
      ],
      face: [...eyes.dizzy, ...mouths.oh],
      hat: [
        shape(
          'M-.1-.85Q-.8-1-1-1.5Q-.5-1.4-.3-1.15Q-.5-1.7-.3-2Q0-1.7.05-1.2Q.2-1.7.45-1.95Q.6-1.5.35-1.1Q.7-1.4 1.05-1.35Q.8-.95.15-.85Z',
          '#3f9a4d',
        ),
      ],
    },
    {
      name: 'Chilli Con Pop',
      skin: ['#ff6a4d', '#a80f1f'],
      back: [shape('M.6.7Q1 1.2 1.6 1.1Q1.4.6.95.2Z', '#c4182b')],
      face: [...eyes.angry.map((s) => s), ...mouths.fangs],
      front: [
        ...both(
          glow('M.8.2Q1.1 0 1.05-.3Q1.35 0 1.2.3Z', '#ffb01f99', 0.04),
          fill('M.82.2Q1.06.04 1.05-.2Q1.25 0 1.15.26Z', '#ffd23f'),
        ),
      ],
      hat: [
        shape('M-.55-.78Q0-1.15.55-.78Q.3-.6.2-.75Q0-.55-.2-.75Q-.3-.6-.55-.78Z', '#3f9a3a'),
        shape('M-.08-.9Q-.15-1.4.3-1.6L.42-1.45Q.1-1.3.12-.9Z', '#3f9a3a'),
      ],
    },
  ],
};
