import { cleanSettings, DEFAULTS, ROWS } from './defaults';

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
