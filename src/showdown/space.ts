import { cateyes, embers, eyes, mouths } from './parts';
import { both, fill, glow, line, oval, poly, rect, scatter, shape, star } from './shapes';
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
  mural: ({ horizon: h, top }) => [
    glow(oval(-0.4, -0.2, 0.7, 0.4), '#ff4fa033', 0.3),
    glow(oval(0.5, 0.4, 0.6, 0.5), '#3fa7ff33', 0.3),
    ...scatter(110, (a, b, c) =>
      fill(oval(a * 2 - 1, top + b * (h - top), 0.003 + c * c * 0.009), '#ffffffcc'),
    ),
    ...scatter(6, (a, b) =>
      fill(star(b * 2 - 1, top + a * (h - top) * 0.8, 0.04, 4, 0.16), '#ffffff'),
    ),
    glow(oval(-0.5, h - 0.95, 0.44), '#ffb37033', 0.1),
    line(`M-.02 ${h - 1.12}A.5.14-18 0 0-.98 ${h - 0.78}`, '#ffd9a8', 0.035),
    fill(oval(-0.5, h - 0.95, 0.34), '#e8794f'),
    fill(
      `M-.82 ${h - 1.06}Q-.5 ${h - 1.0} -.2 ${h - 1.12}L-.17 ${h - 1.0}Q-.5 ${h - 0.9} -.84 ${h - 0.96}Z`,
      '#f7a86a',
    ),
    fill(
      `M-.8 ${h - 0.82}Q-.5 ${h - 0.76} -.18 ${h - 0.86}L-.24 ${h - 0.74}Q-.5 ${h - 0.68} -.74 ${h - 0.72}Z`,
      '#b84a44',
    ),
    line(`M-.98 ${h - 0.78}A.5.1-18 0 0-.02 ${h - 1.12}`, '#ffe9c8', 0.05),
    fill(oval(0.66, h - 1.35, 0.13), '#9ad0ff'),
    fill(oval(0.7, h - 1.38, 0.12), '#1b0f46aa'),
    fill(
      `M-1 ${h + 0.01}V${h - 0.1}Q-.7 ${h - 0.2} -.4 ${h - 0.05}Q0 ${h - 0.14} .4 ${h - 0.04}Q.8 ${h - 0.2} 1 ${h - 0.08}V${h + 0.01}Z`,
      '#6d6790',
    ),
    // The base: domes, a dish and a landed rocket.
    shape(`M.28 ${h + 0.06}A.22.22 0 0 1 .72 ${h + 0.06}Z`, '#5ad1e8', 0.014),
    line(
      `M.5 ${h - 0.16}V${h + 0.06}M.34 ${h - 0.06}Q.5 ${h - 0.02} .66 ${h - 0.06}`,
      '#2b5c86',
      0.012,
    ),
    shape(rect(0.22, h + 0.04, 0.56, 0.07), '#c9cbe0', 0.014),
    shape(
      `M-.2 ${h + 0.06}V${h - 0.28}Q-.1 ${h - 0.55} 0 ${h - 0.28}V${h + 0.06}Z`,
      '#f2f2fa',
      0.014,
    ),
    shape(poly(-0.2, h - 0.08, -0.3, h + 0.1, -0.2, h + 0.06), '#ff5470', 0.014),
    shape(poly(0, h - 0.08, 0.1, h + 0.1, 0, h + 0.06), '#ff5470', 0.014),
    fill(oval(-0.1, h - 0.22, 0.05), '#3fa7ff'),
    fill(`M-.19 ${h - 0.3}Q-.1 ${h - 0.55} -.01 ${h - 0.3}Z`, '#ff5470'),
    ...both(
      line(`M.92 ${h + 0.3}V${h - 0.35}`, '#8f8bb0', 0.03),
      glow(oval(0.92, h - 0.38, 0.12), '#7df9ff88', 0.06),
      fill(oval(0.92, h - 0.38, 0.05), '#d6fdff'),
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
