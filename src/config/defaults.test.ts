import { cleanSettings, cleanWalls, DEFAULTS, ROWS } from './defaults';
import { DEFAULT_WALLS, dress, ENVIRONMENTS, LIGHTS } from './environments';

test('every default is a real option, and every row offers Random', () => {
  for (const { key, options } of ROWS) {
    const ids = options.map((o) => o.id);
    expect(ids).toContain(DEFAULTS[key]);
    expect(ids).toContain('random');
  }
});

test('saved settings survive, and unknown ones fall back', () => {
  expect(cleanSettings({ bubble: 'ink', box: 'gone', extra: 1 })).toEqual({
    ...DEFAULTS,
    bubble: 'ink',
  });
  expect(cleanSettings('broken')).toEqual(DEFAULTS);
});

test('wall sliders survive, and nonsense falls back', () => {
  expect(cleanWalls({ opacity: 0, softness: 1 })).toEqual({ opacity: 0, softness: 1 });
  expect(cleanWalls({ opacity: 7, softness: 'x' })).toEqual(DEFAULT_WALLS);
  expect(cleanWalls(undefined)).toEqual(DEFAULT_WALLS);
});

test('default walls at night leave a box as designed', () => {
  for (const look of Object.values(ENVIRONMENTS))
    expect(dress(look, LIGHTS.night, DEFAULT_WALLS)).toMatchObject(look);
  const soft = dress(ENVIRONMENTS.lattice, LIGHTS.day, { opacity: 0, softness: 1 });
  expect(soft.edgeOpacity).toBe(0);
  expect(soft.bounce).toBeLessThan(ENVIRONMENTS.lattice.bounce);
  expect(soft.backdrop).toEqual(ENVIRONMENTS.lattice.day.backdrop);
});
