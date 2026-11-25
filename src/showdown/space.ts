import { cateyes, embers, eyes, mouths } from './parts';
import { lamp, mist, wash } from './scenery';
import { both, fill, glow, line, n, oval, poly, rect, scatter, shape, star } from './shapes';
import type { Theme } from './types';

const ray = (i: number, n: number, r: number, R: number, w: number) => {
  const a = (i / n) * Math.PI * 2;
  return poly(
    Math.cos(a - w) * r,
    Math.sin(a - w) * r,
    Math.cos(a) * R,
    Math.sin(a) * R,
    Math.cos(a + w) * r,
    Math.sin(a + w) * r,
  );
};

export const space: Theme = {
  name: 'Space',
  tagline: 'In space, no one can hear you pop',
  title: 'Sovereign of the Stars',
  font: 'Futura-CondensedExtraBold',
  accent: '#7df9ff',
  verbs: ['vaporises', 'out-orbits', 'beams up', 'ejects'],
  backdrop: ['#2a1c68', '#060314'],
  ink: [140, 225, 255],
  mural: ({ horizon: h, top, bottom }) => [
    // Clouds of gas, and a ringed world over a lit horizon.
    glow(oval(-0.35, -0.5, 0.75, 0.22), '#ff5fae55', 0.2),
    glow(oval(0.1, -0.15, 0.6, 0.16), '#b06cff55', 0.16),
    glow(oval(0.5, 0.3, 0.6, 0.3), '#3fb0ff55', 0.22),
    ...scatter(16, (a, b, c) =>
      mist(
        a * 2 - 1,
        -0.75 + a * 0.75 + b * 0.5,
        0.12 + c * 0.3,
        0.03 + c * 0.05,
        ['#ff9ad044', '#9ac8ff44', '#c8a0ff44'][Math.floor(c * 3)]!,
      ),
    ),
    ...scatter(150, (a, b, c) =>
      fill(
        oval(a * 2 - 1, top + b * (h - top), 0.002 + c ** 4 * 0.008),
        ['#ffffff', '#ffe2c0', '#b8d8ff'][Math.floor(a * 3)]!,
      ),
    ),
    ...scatter(7, (a, b, c) =>
      lamp(b * 2 - 1, top + a * (h - top) * 0.9, 0.008 + c * 0.006, '#ffffff'),
    ).flat(),
    // Its far ring, the world, its night side, then the near ring.
    glow(oval(-0.36, h - 0.95, 0.4), '#ffb88044', 0.16),
    ...[0.6, 0.53, 0.49].map((r, i) => ({
      ...line(
        `M${n(-0.36 - r)} ${n(h - 0.95)}A${r} ${n(r * 0.2)} 0 0 1 ${n(-0.36 + r)} ${n(h - 0.95)}`,
        ['#ffd9b088', '#ffe6cca0', '#e8b8a866'][i]!,
        [0.02, 0.035, 0.012][i]!,
      ),
      blur: 0.004,
    })),
    wash(oval(-0.36, h - 0.95, 0.35), '#ffd0a0', '#7a3c78'),
    ...scatter(5, (a, b, c) =>
      mist(-0.36 + (a - 0.5) * 0.1, h - 1.14 + b * 0.4, 0.22, 0.012 + c * 0.014, '#fff0d855'),
    ),
    glow(
      `M-.2 ${n(h - 1.26)}A.35 .35 0 0 1 -.5 ${n(h - 0.63)}Q-.1 ${n(h - 0.78)} -.2 ${n(h - 1.26)}Z`,
      '#180a3ccc',
      0.06,
    ),
    ...[0.6, 0.53, 0.49].map((r, i) => ({
      ...line(
        `M${n(-0.36 - r)} ${n(h - 0.95)}A${r} ${n(r * 0.2)} 0 0 0 ${n(-0.36 + r)} ${n(h - 0.95)}`,
        ['#ffd9b0aa', '#fff0dccc', '#e8b8a888'][i]!,
        [0.02, 0.035, 0.012][i]!,
      ),
      blur: 0.004,
    })),
    ...lamp(0.62, h - 1.4, 0.06, '#a8dcff'),
    // The edge of the moon we stand over.
    glow(oval(0, h + 1.62, 2.1, 1.75), '#7fc8ff66', 0.07),
    wash(
      `M-1 ${n(h + 0.18)}A2.1 1.75 0 0 1 1 ${n(h + 0.18)}V${n(bottom)}H-1Z`,
      '#b4c4ff',
      '#1a1248',
    ),
  ],
  motes: { color: '#b8c7ff', size: 0.01, rise: -0.02 },
  cast: [
    {
      name: 'Captain Comet',
      skin: ['#ffffff', '#a3a9c9'],
      mark: [fill('M-1 .62Q0 .9 1 .62V1H-1Z', '#ff6b35')],
      face: [
        shape('M-.68-.1Q-.66-.56 0-.58Q.66-.56.68-.1Q.66.44 0 .46Q-.66.44-.68-.1Z', '#2b3f77'),
        ...both(fill(oval(0.22, -0.06, 0.08, 0.12), '#ffffff')),
        line('M-.18.16Q0 .3.18.16', '#ffffff', 0.05),
        line('M-.5-.3Q-.42-.44-.22-.46', '#9ad0ff', 0.07),
      ],
      hat: [
        line('M.6-.78L.85-1.35', '#8f94b5', 0.06),
        shape(oval(0.88, -1.4, 0.11), '#ff3b5c', 0.03),
      ],
    },
    {
      name: 'Zorb of Zib',
      skin: ['#b6ff6b', '#3c9a2e'],
      face: [...eyes.three, ...mouths.smile],
      hat: [
        line('M-.4-.82Q-.7-1.2-.5-1.55M.4-.82Q.7-1.2.5-1.55', '#3c9a2e', 0.07),
        ...both(shape(oval(0.5, -1.58, 0.15), '#d9ff8a')),
      ],
    },
    {
      name: 'Saturnalia',
      skin: ['#ffdd9a', '#c9803a'],
      mark: [fill(rect(-1, -0.65, 2, 0.16), '#e8a85a'), fill(rect(-1, 0.45, 2, 0.2), '#e8a85a')],
      back: [line('M-1.02-.24Q-1.75.1-1.5.32M1.02-.24Q1.75.1 1.5.32', '#fff0cf', 0.16)],
      face: [...eyes.sleepy, ...mouths.smirk.map((s) => ({ ...s, d: 'M-.14.24Q.1.3.24.16' }))],
      front: [
        line('M-1.5.3Q-1 .62 0 .64Q1 .62 1.5.3', '#1c1330', 0.24),
        line('M-1.5.3Q-1 .62 0 .64Q1 .62 1.5.3', '#fff0cf', 0.15),
        line('M-1.4.34Q-.9.58 0 .6Q.9.58 1.4.34', '#d9a25a', 0.04),
      ],
    },
    {
      name: 'Unit BUB-8',
      skin: ['#c9d6e2', '#5f7183'],
      mark: [
        line('M-1 .58H1M0 .58V1', '#42525f', 0.04),
        ...both(fill(oval(0.75, 0.7, 0.05), '#42525f')),
      ],
      back: both(shape(rect(0.9, -0.3, 0.28, 0.5), '#8b9bab')),
      face: [
        shape('M-.6-.36H.6V.12H-.6Z', '#101820'),
        ...both(
          glow(rect(0.16, -0.24, 0.24, 0.22), '#39ff88aa', 0.04),
          fill(rect(0.17, -0.22, 0.22, 0.18), '#39ff88'),
        ),
        shape(rect(-0.36, 0.28, 0.72, 0.2), '#101820'),
        line('M-.3.38L-.2.32L-.1.44L0 .3L.1.44L.2.34L.3.38', '#ff5470', 0.04),
      ],
      hat: [
        shape(rect(-0.3, -1.12, 0.6, 0.24), '#8b9bab'),
        shape('M-.12-1.12V-1.3A.12.12 0 0 1 .12-1.3V-1.12Z', '#ff5470'),
      ],
    },
    {
      name: 'Grumpy Moon',
      skin: ['#e6e4dc', '#85827c'],
      mark: [
        [-0.6, -0.5, 0.2],
        [0.65, 0.45, 0.22],
        [-0.45, 0.7, 0.14],
        [0.3, -0.72, 0.12],
        [-0.78, 0.2, 0.1],
        [0.75, -0.3, 0.09],
      ].map(([x, y, r]) => shape(oval(x!, y!, r!, r! * 0.9), '#a6a39a', 0.025)),
      face: [...eyes.angry, ...mouths.frown],
      hat: [
        line('M.25-.95V-1.75', '#c9cbe0', 0.05),
        shape('M.27-1.75H.95L.82-1.55L.95-1.35H.27Z', '#ff5470'),
        fill(star(0.52, -1.55, 0.1), '#ffffff'),
      ],
    },
    {
      name: 'Sol Searing',
      skin: ['#fff27a', '#ff8a1f'],
      back: Array.from({ length: 12 }, (_, i) =>
        shape(ray(i, 12, 0.9, i % 2 ? 1.28 : 1.5, 0.2), i % 2 ? '#ff6b1a' : '#ffb01f'),
      ),
      face: [...eyes.shades, ...mouths.grin],
    },
    {
      name: 'Black Hole Bess',
      skin: ['#2e1a52', '#050210'],
      back: [
        glow(oval(0, 0, 1.25), '#b45cff88', 0.14),
        line('M-1.6.2Q0-.8 1.6-.2', '#ff9d4a', 0.14),
      ],
      mark: [line('M0 0Q.5-.4.5.2T-.3.6T-.8-.2T.2-.85', '#7a3ff2aa', 0.07)],
      face: [
        ...embers('#ffb26b'),
        fill(oval(0, 0.38, 0.14), '#ff9d4a'),
        fill(oval(0, 0.38, 0.09), '#050210'),
      ],
      front: [line('M-1.6.22Q0 1.15 1.6-.18', '#ffd08a', 0.12)],
    },
    {
      name: 'Saucer Sue',
      skin: ['#ffb8f0', '#b0459a'],
      face: [
        ...both(
          fill('M.08-.02Q.3-.34.52-.28Q.5.06.16.1Z', '#1c1330'),
          fill(oval(0.4, -0.18, 0.05), '#ffffff'),
        ),
        ...mouths.oh,
      ],
      hat: [
        shape('M-.6-1.02Q-.5-1.62 0-1.62Q.5-1.62.6-1.02Z', '#b8f7ffcc'),
        shape('M-1.35-.86Q0-1.3 1.35-.86Q.7-.5 0-.5Q-.7-.5-1.35-.86Z', '#9aa3c9'),
        ...[-0.8, -0.28, 0.28, 0.8].map((x, i) =>
          fill(
            oval(x, -0.82 + Math.abs(x) * 0.02, 0.09),
            ['#ffe066', '#5eead4', '#ff5470', '#ffe066'][i]!,
          ),
        ),
      ],
    },
    {
      name: 'Rocket Rick',
      skin: ['#ff8a8a', '#c21f3a'],
      back: [
        ...both(shape('M.75.1L1.4.95L.6.85Z', '#f2f2fa')),
        shape('M-.3.9Q-.4 1.4 0 1.75Q.4 1.4.3.9Z', '#ffb01f'),
        fill('M-.14.95Q-.2 1.25 0 1.45Q.2 1.25.14.95Z', '#fff3b0'),
      ],
      mark: [fill('M-1 .5H1V.68H-1Z', '#ffffff')],
      face: [...eyes.wide, ...mouths.grit.map((s) => s)],
      hat: [
        shape('M-.62-.7Q-.4-1.5 0-1.85Q.4-1.5.62-.7Q0-.9-.62-.7Z', '#f2f2fa'),
        fill('M-.24-1.4Q-.12-1.65 0-1.8Q.12-1.65.24-1.4Z', '#c21f3a'),
      ],
    },
    {
      name: 'Laika Lather',
      skin: ['#e3b27a', '#8a5a2e'],
      mark: [
        fill(oval(0, 0.48, 0.5, 0.46), '#fff3df'),
        fill(oval(-0.36, -0.12, 0.28, 0.32), '#6b421f'),
      ],
      face: [
        ...eyes.dots,
        fill('M-.16.14H.16L0 .32Z', '#1c1330'),
        line('M0 .3V.42Q-.14.56-.26.44M0 .42Q.14.56.26.44', '#1c1330', 0.05),
        shape('M-.08.5H.1V.7Q0 .8-.08.7Z', '#ff6b81', 0.03),
      ],
      front: [
        line(oval(0, -0.04, 1.18), '#ffffff88', 0.06),
        line('M-.9-.6Q-.75-.85-.5-.98', '#ffffff', 0.08),
      ],
      hat: both(shape('M.4-.82Q.6-1.3 1-1.1Q1.25-.6 1-.1Q.8-.2.75-.55Z', '#6b421f')),
    },
    {
      name: 'Brainiac Bloop',
      skin: ['#8ff0e6', '#1f8a8f'],
      face: [
        ...cateyes('#fff04d'),
        ...mouths.smirk,
        ...both(line('M.12-.4Q.3-.3.52-.5', '#12585c', 0.08)),
      ],
      hat: [
        shape(
          'M-.8-.5Q-1-1-.6-1.15Q-.5-1.45-.15-1.35Q0-1.5.15-1.35Q.5-1.45.6-1.15Q1-1 .8-.5Q0-.7-.8-.5Z',
          '#ff9ec2',
        ),
        line(
          'M0-1.4V-.6M-.6-1.1Q-.3-1.1-.3-.85M.6-1.1Q.3-1.1.3-.85M-.7-.8Q-.55-.9-.45-.7M.7-.8Q.55-.9.45-.7',
          '#c4457a',
          0.05,
        ),
      ],
    },
    {
      name: 'Nebula Squid',
      skin: ['#9a8cff', '#3a2aa8'],
      back: [-0.75, -0.38, 0, 0.38, 0.75].map((x, i) =>
        line(
          `M${x} .6Q${x * 1.4 - 0.2} 1.1 ${x * 1.25 + 0.1} 1.3T${x * 1.5} 1.65`,
          i % 2 ? '#5140cf' : '#6a58e8',
          0.2,
        ),
      ),
      mark: scatter(16, (a, b, c) =>
        fill(star(a * 1.8 - 0.9, b * 1.8 - 0.9, 0.04 + c * 0.05, 4, 0.2), '#ffffffaa'),
      ),
      face: [...eyes.worried, ...mouths.oh],
      hat: [
        shape(
          'M-.65-.7Q-.5-1.6 0-1.75Q.5-1.6.65-.7Q.9-1 1-1.2Q1.1-.8.75-.5Q0-.85-.75-.5Q-1.1-.8-1-1.2Q-.9-1-.65-.7Z',
          '#6a58e8',
        ),
      ],
    },
  ],
};
