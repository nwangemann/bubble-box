import { FX, fxFor, type Fx } from '../fx';
import { STYLES } from '../styles';
import { ENVIRONMENTS, type Environment } from './environments';
import { FEELS, type Feel } from './feels';
import { GLASS, type Glass } from './glass';
import { TAPS, type Tap } from './taps';

export const RANDOM = 'random';
export const NONE = 'none';

/** What the app starts with. Documented in docs/settings.md. */
export const DEFAULTS = {
  bubble: 'soap',
  box: 'lattice',
  feel: 'drift',
  glass: 'ripple',
  tap: 'grow',
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
  { key: 'feel', label: 'Feel', options: [...named(FEELS), last] },
  { key: 'glass', label: 'Glass', options: [...named(GLASS), last] },
  { key: 'tap', label: 'Tap', options: [...named(TAPS), last] },
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

/** Gentler physics for Reduce Motion. The chosen settings are untouched. */
export const calmFeel = (f: Feel): Feel => ({
  ...f,
  speed: f.speed * 0.6,
  minSpeed: f.minSpeed * 0.6,
  wander: f.wander * 0.4,
  buoyancy: f.buoyancy * 0.5,
  wobble: f.wobble * 0.25,
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

/** There is one room, so Random picks one box now. */
export function pickBox(choice: string, avoid?: Environment): Environment {
  const all = pool<Environment>(ENVIRONMENTS, choice);
  const fresh = all.filter((e) => e !== avoid);
  const from = fresh.length > 0 ? fresh : all;
  return from[Math.floor(Math.random() * from.length)]!;
}

const FX_ENTRIES = Object.entries(FX) as [string, Fx][];
const LIVES = Object.fromEntries(FX_ENTRIES.map(([id, f]) => [id, f.life]));
const PIECES = Object.fromEntries(FX_ENTRIES.map(([id, f]) => [id, f.pieces ?? 0]));
export const fxPools = (meet: string, pop: string) => ({
  meet: fxPool('meet', meet),
  pop: fxPool('pop', pop),
  lives: LIVES,
  pieces: PIECES,
});
