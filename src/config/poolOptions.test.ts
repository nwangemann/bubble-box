import { cleanPool, POOL_ROWS, stepPool, type PoolRow } from './poolOptions';

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
