import { POOL } from './pool';
import { cleanPool, cueAim, POOL_ROWS, stepPool, tableOf, type PoolRow } from './poolOptions';

const ROW: PoolRow = {
  key: 'cloth',
  label: 'Cloth',
  options: [
    { id: 'space', name: 'Space' },
    { id: 'felt', name: 'Felt' },
  ],
  usual: 'felt',
};

test('every option starts with one that exists', () => {
  for (const { options, usual } of [ROW, ...POOL_ROWS])
    expect(options.map((o) => o.id)).toContain(usual);
});

test('saved choices survive, and unknown ones fall back', () => {
  expect(cleanPool({ cloth: 'space', extra: 1 }, [ROW])).toEqual({ cloth: 'space' });
  for (const bad of [{ cloth: 'gone' }, { cloth: 3 }, {}, 'broken', null, undefined])
    expect(cleanPool(bad, [ROW])).toEqual({ cloth: 'felt' });
});

test('a tap steps through the options and round again', () => {
  const next = stepPool(ROW, { cloth: 'space', cue: 'line' });
  expect(next).toEqual({ cloth: 'felt', cue: 'line' });
  expect(stepPool(ROW, next).cloth).toBe('space');
});

test('each cloth is a table of its own', () => {
  const cloth = POOL_ROWS.find((r) => r.key === 'cloth')!;
  expect(cloth.options.map((o) => tableOf(o.id))).toEqual(Object.keys(POOL.tables));
  expect(tableOf(undefined)).toBe(cloth.usual);
});

test('the aim is a line unless a cue is chosen, and the menu keeps to three tiles', () => {
  const aim = POOL_ROWS.find((r) => r.key === 'aim')!;
  expect(aim.usual).toBe('line');
  expect(aim.options.map((o) => cueAim(o.id))).toEqual([false, true]);
  expect(cueAim(undefined)).toBe(false);
  expect(cleanPool({}).aim).toBe('line');
  expect(POOL_ROWS.length).toBeLessThanOrEqual(3);
});
