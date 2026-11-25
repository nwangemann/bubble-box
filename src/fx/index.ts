import { apollo, chiral, chord, frost, julia, kali, phyllo, sparks } from './meet';
import { droplets, implode, mist, rays, ring, shatter } from './pop';

/** What the bubble itself does while popping. */
export type PopBody = {
  /** Size change by the end: 0.12 swells, -1 vanishes to a point. */
  swell: number;
  /** Whether the film tears open from the middle. */
  tear: boolean;
  /** Fades this many times faster than the pop. */
  haste: number;
};

export type Fx = {
  name: string;
  /** Seconds. */
  life: number;
  /** Size of the drawn area against the bubbles involved. */
  reach: number;
  /** 0 always faces the viewer, 1 lies flat in the plane of contact. */
  flat: number;
  sksl: string | null;
  on: ('meet' | 'pop')[];
  body?: PopBody;
  /** Small bubbles a tapped bubble breaks into. */
  pieces?: number;
};

const QUICK: PopBody = { swell: 0.1, tear: true, haste: 2.6 };

/** Add an entry and it appears in the tray rows named by `on`. */
export const FX = {
  film: {
    name: 'Film',
    life: 0.1,
    reach: 1,
    flat: 0,
    sksl: null,
    on: ['pop'],
    body: { swell: 0.12, tear: true, haste: 1 },
  },
  droplets: {
    name: 'Droplets',
    life: 1.3,
    reach: 2.6,
    flat: 0,
    sksl: droplets,
    on: ['pop'],
    body: { swell: 0.06, tear: true, haste: 4 },
  },
  mist: {
    name: 'Mist',
    life: 2.2,
    reach: 2.2,
    flat: 0,
    sksl: mist,
    on: ['pop'],
    body: { swell: 0.25, tear: false, haste: 2 },
  },
  shatter: {
    name: 'Shatter',
    life: 1.4,
    reach: 2.2,
    flat: 0,
    sksl: shatter,
    on: ['pop'],
    body: { swell: 0, tear: false, haste: 9 },
  },
  rays: {
    name: 'Starlight',
    life: 1.6,
    reach: 2.6,
    flat: 0,
    sksl: rays,
    on: ['pop'],
    body: { swell: 0.1, tear: false, haste: 2 },
  },
  implode: {
    name: 'Implode',
    life: 1.5,
    reach: 2,
    flat: 0,
    sksl: implode,
    on: ['pop'],
    body: { swell: -1, tear: false, haste: 1 },
  },
  brood: {
    name: 'Brood',
    life: 0.9,
    reach: 1.9,
    flat: 0,
    sksl: ring,
    on: ['pop'],
    body: { swell: 0, tear: false, haste: 6 },
    pieces: 5,
  },
  sparks: { name: 'Sparks', life: 1.5, reach: 2, flat: 0.25, sksl: sparks, on: ['meet'] },
  chiral: {
    name: 'Chiral',
    life: 2.1,
    reach: 1.9,
    flat: 0.55,
    sksl: chiral,
    on: ['meet', 'pop'],
    body: QUICK,
  },
  phyllo: {
    name: 'Sunflower',
    life: 2.1,
    reach: 1.9,
    flat: 0.5,
    sksl: phyllo,
    on: ['meet', 'pop'],
    body: QUICK,
  },
  frost: { name: 'Frost', life: 2, reach: 1.9, flat: 0.4, sksl: frost, on: ['meet'] },
  kali: { name: 'Kali', life: 2.1, reach: 1.8, flat: 0.3, sksl: kali, on: ['meet'] },
  julia: {
    name: 'Julia',
    life: 2.3,
    reach: 1.8,
    flat: 0.3,
    sksl: julia,
    on: ['meet', 'pop'],
    body: QUICK,
  },
  chord: { name: 'Chord', life: 1.9, reach: 2, flat: 0, sksl: chord, on: ['meet'] },
  apollo: { name: 'Apollo', life: 2.2, reach: 1.7, flat: 0.4, sksl: apollo, on: ['meet'] },
} satisfies Record<string, Fx>;

export type FxId = keyof typeof FX;

export const fxFor = (event: 'meet' | 'pop') =>
  (Object.entries(FX) as [FxId, Fx][]).filter(([, f]) => f.on.includes(event)).map(([id]) => id);

/** Ids an option stands for. Surprise draws from all of them. */
export const fxPool = (event: 'meet' | 'pop', choice: string): string[] =>
  choice === 'none' ? [] : choice === 'surprise' ? fxFor(event) : [choice];
