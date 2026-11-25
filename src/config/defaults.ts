import { FX, fxFor, type Fx } from '../fx';
import { STYLES } from '../styles';
import {
  DEFAULT_WALLS,
  ENVIRONMENTS,
  LIGHTS,
  type BoxLook,
  type Light,
  type Walls,
} from './environments';
import { CONTACTS, type Contact } from './contacts';
import { FEELS, type Feel } from './feels';
import { GLASS, type Glass } from './glass';
import { TAPS, type Tap } from './taps';

export const RANDOM = 'random';
export const NONE = 'none';

/** What the app starts with. Documented in docs/settings.md. */
export const DEFAULTS = {
  bubble: 'soap',
  box: 'lattice',
  light: 'night',
  feel: 'drift',
  glass: 'ripple',
  tap: 'grow',
  contact: 'bounce',
  meet: NONE,
  pop: NONE,
};

export type Setting = keyof typeof DEFAULTS;
export type Settings = Record<Setting, string>;

type Option = { id: string; name: string };
const named = (record: Record<string, { name: string }>): Option[] =>
  Object.entries(record).map(([id, { name }]) => ({ id, name }));
const fxNamed = (event: 'meet' | 'pop'): Option[] => [
  { id: NONE, name: 'None' },
  ...fxFor(event).map((id) => ({ id, name: FX[id].name })),
];
const last = { id: RANDOM, name: 'Random' };

/** Tray rows, in order. Every row ends with Random. */
export const ROWS: { key: Setting; label: string; options: Option[] }[] = [
  { key: 'bubble', label: 'Bubble', options: [...named(STYLES), last] },
  { key: 'box', label: 'Box', options: [...named(ENVIRONMENTS), last] },
  { key: 'light', label: 'Light', options: [...named(LIGHTS), last] },
  { key: 'feel', label: 'Feel', options: [...named(FEELS), last] },
  { key: 'glass', label: 'Glass', options: [...named(GLASS), last] },
  { key: 'tap', label: 'Tap', options: [...named(TAPS), last] },
  { key: 'contact', label: 'Contact', options: [...named(CONTACTS), last] },
  { key: 'meet', label: 'Meet', options: [...fxNamed('meet'), last] },
  { key: 'pop', label: 'Pop', options: [...fxNamed('pop'), last] },
];

/** Keeps the saved choices that still exist. */
export function cleanSettings(saved: unknown): Settings {
  const out: Settings = { ...DEFAULTS };
  if (typeof saved !== 'object' || saved === null) return out;
  for (const { key, options } of ROWS) {
    const value = (saved as Record<string, unknown>)[key];
    if (options.some((o) => o.id === value)) out[key] = value as string;
  }
  return out;
}

/** Keeps slider values that make sense. */
export function cleanWalls(saved: unknown): Walls {
  const out = { ...DEFAULT_WALLS };
  if (typeof saved !== 'object' || saved === null) return out;
  for (const key of ['opacity', 'softness'] as const) {
    const value = (saved as Record<string, unknown>)[key];
    if (typeof value === 'number' && value >= 0 && value <= 1) out[key] = value;
  }
  return out;
}

/** Gentler physics for Reduce Motion. The chosen settings are untouched. */
export const calmFeel = (f: Feel): Feel => ({
  ...f,
  speed: f.speed * 0.6,
  minSpeed: f.minSpeed * 0.6,
  wander: f.wander * 0.4,
  buoyancy: f.buoyancy * 0.5,
  wobble: f.wobble * 0.25,
  tilt: 0,
});

/** The choices a setting stands for: one, or all of them for Random. */
function pool<T>(record: Record<string, T>, choice: string): T[] {
  return choice === RANDOM ? Object.values(record) : [record[choice]!];
}
const fxPool = (event: 'meet' | 'pop', choice: string): string[] =>
  choice === NONE ? [] : choice === RANDOM ? fxFor(event) : [choice];

export const stylePool = (s: string) => (s === RANDOM ? Object.keys(STYLES) : [s]);
export const feelPool = (s: string) => pool<Feel>(FEELS, s);
export const glassPool = (s: string) => pool<Glass>(GLASS, s);
export const tapPool = (s: string) => pool<Tap>(TAPS, s);
export const mergePool = (s: string) => pool<Contact>(CONTACTS, s).map((c) => c.merges);

/** There is one room, so Random picks one now, and another when chosen again. */
function pickOne<T>(record: Record<string, T>, choice: string, avoid?: T): T {
  const all = pool<T>(record, choice);
  const fresh = all.filter((e) => e !== avoid);
  const from = fresh.length > 0 ? fresh : all;
  return from[Math.floor(Math.random() * from.length)]!;
}
export const boxPool = (s: string) => pool<BoxLook>(ENVIRONMENTS, s);
export const lightPool = (s: string) => pool<Light>(LIGHTS, s);
export const pickBox = (s: string, avoid?: BoxLook) => pickOne<BoxLook>(ENVIRONMENTS, s, avoid);
export const pickLight = (s: string, avoid?: Light) => pickOne<Light>(LIGHTS, s, avoid);

const FX_ENTRIES = Object.entries(FX) as [string, Fx][];
const LIVES = Object.fromEntries(FX_ENTRIES.map(([id, f]) => [id, f.life]));
const PIECES = Object.fromEntries(FX_ENTRIES.map(([id, f]) => [id, f.pieces ?? 0]));
export const fxPools = (meet: string, pop: string) => ({
  meet: fxPool('meet', meet),
  pop: fxPool('pop', pop),
  lives: LIVES,
  pieces: PIECES,
});
