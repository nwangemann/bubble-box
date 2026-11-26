import type { TableId } from './pool';

/** One of 8-ball's options. Ids are saved, so keep them when renaming. */
export type PoolRow = {
  key: string;
  label: string;
  /** In the order a tap steps through them. */
  options: readonly { id: string; name: string }[];
  /** The option it starts with. */
  usual: string;
};

/** Add an entry and it appears as a tile in 8-ball's menu and is saved. See docs/settings.md. */
export const POOL_ROWS: readonly PoolRow[] = [
  {
    key: 'trail',
    label: 'Trail',
    options: [
      { id: 'all', name: 'All balls' },
      { id: 'cue', name: 'Cue ball' },
      { id: 'none', name: 'None' },
    ],
    usual: 'all',
  },
  {
    key: 'cloth',
    label: 'Cloth',
    options: [
      { id: 'space', name: 'Space' },
      { id: 'felt', name: 'Felt' },
    ],
    usual: 'space',
  },
  {
    key: 'aim',
    label: 'Aim',
    options: [
      { id: 'line', name: 'Line' },
      { id: 'cue', name: 'Cue' },
    ],
    usual: 'line',
  },
];

/** The room pool is played in (`POOL.tables`). */
export const tableOf = (id: string | undefined): TableId => (id === 'felt' ? 'felt' : 'space');

/** Whether the aim is drawn as a cue (`POOL.aim.cue`) rather than a line. */
export const cueAim = (id: string | undefined) => id === 'cue';

/** How many balls leave trails, the cue ball first. */
export const trailing = (id: string | undefined) =>
  id === 'all' ? Infinity : id === 'cue' ? 1 : 0;

export type PoolSettings = Record<string, string>;

/** Keeps the saved choices that still exist; the rest are as they start. */
export function cleanPool(saved: unknown, rows = POOL_ROWS): PoolSettings {
  const from = (typeof saved === 'object' && saved !== null ? saved : {}) as Record<
    string,
    unknown
  >;
  return Object.fromEntries(
    rows.map(({ key, options, usual }) => [
      key,
      options.find((o) => o.id === from[key])?.id ?? usual,
    ]),
  );
}

/** The choice a tap on a tile moves to: the next, then round again. */
export function stepPool({ key, options }: PoolRow, now: PoolSettings): PoolSettings {
  const at = options.findIndex((o) => o.id === now[key]);
  return { ...now, [key]: options[(at + 1) % options.length]!.id };
}
