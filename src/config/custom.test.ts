import { cleanCustom, customLook, DEFAULT_CUSTOM, PATTERN_IDS, wheel } from './custom';

test('a saved bubble survives, and nonsense falls back', () => {
  const made = { pattern: 'dots', colour: 0, second: 1, vivid: 0.2, size: 0.9 };
  expect(cleanCustom(made)).toEqual(made);
  expect(cleanCustom({ pattern: 'gone', colour: 7, vivid: 'x', size: NaN })).toEqual(
    DEFAULT_CUSTOM,
  );
  expect(cleanCustom(undefined)).toEqual(DEFAULT_CUSTOM);
});

test('the colour wheel meets itself and stays in range', () => {
  for (let h = 0; h <= 1; h += 0.05)
    for (const v of wheel(h, 1)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  wheel(1, 0.6).forEach((v, i) => expect(v).toBeCloseTo(wheel(0, 0.6)[i]!));
  const [r, g, b] = wheel(0, 1);
  expect(r).toBeGreaterThan(g!);
  expect(g).toBeCloseTo(b!);
});

test('every pattern has its own number', () => {
  const numbers = PATTERN_IDS.map(
    (pattern) => customLook({ ...DEFAULT_CUSTOM, pattern }).uniforms[6],
  );
  expect(numbers).toEqual(PATTERN_IDS.map((_, i) => i));
});
