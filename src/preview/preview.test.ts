import {
  feelPool,
  fxPools,
  mergePool,
  pullPool,
  ROWS,
  stylePool,
  tapPool,
  trailPool,
} from '../config/defaults';
import { TUNING } from '../config/tuning';
import { layoutCells } from './layout';
import { createStage, play, playToStill, type Part } from './scripts';

const part = (kind: Part['kind'], id: string): Part => ({
  kind,
  box: { hw: 1, hh: 1, depth: TUNING.preview.depth, focal: TUNING.box.focal },
  styles: stylePool(kind === 'bubble' ? id : 'soap'),
  feels: feelPool(kind === 'feel' ? id : 'drift'),
  taps: tapPool(kind === 'tap' ? id : 'grow'),
  fx: fxPools(kind === 'meet' ? id : 'none', kind === 'pop' ? id : 'none'),
  merges: mergePool(kind === 'contact' ? id : 'bounce'),
  pulls: pullPool(kind === 'pull' ? id : 'none'),
  trails: trailPool(kind === 'trail' ? id : 'none'),
  bounce: 1,
  delay: 0.2,
});

test('every preview loops without growing or breaking', () => {
  for (const { key, options } of ROWS)
    for (const { id } of options) {
      const p = part(key, id);
      const s = createStage(p);
      for (let i = 0; i < 60 * 15; i++) {
        play(s, p, 1 / 60);
        expect(s.world.bubbles.length).toBeLessThanOrEqual(TUNING.maxBubbles + 1);
        for (const b of s.world.bubbles)
          if (![b.p.x, b.p.y, b.p.z, b.r].every(Number.isFinite)) throw new Error(`${key} ${id}`);
      }
      expect(s.turn).toBeGreaterThan(0);
    }
});

test('meet and pop stills catch their effect; None shows none', () => {
  for (const kind of ['meet', 'pop'] as const) {
    for (const [id, some] of [
      ['julia', true],
      ['none', false],
    ] as const) {
      const p = part(kind, id);
      const s = createStage(p);
      playToStill(s, p);
      expect(s.world.bursts.some((b) => b.fx === 'julia')).toBe(some);
    }
  }
});

test('a tap pops or makes a bubble', () => {
  const count = (id: string) => {
    const p = part('tap', id);
    const s = createStage(p);
    const end = p.delay + TUNING.preview.act.tap + TUNING.preview.press + 0.05;
    for (let t = 0; t < end; t += 1 / 60) play(s, p, 1 / 60);
    return s.world.bubbles.filter((b) => b.popping < 0).length;
  };
  expect(count('grow')).toBe(2);
  expect(count('pop')).toBe(0);
});

test('every row fits on a small and a large phone', () => {
  for (const [w, h] of [
    [320, 568],
    [390, 844],
    [440, 956],
  ] as const)
    for (const { options } of ROWS)
      for (const c of layoutCells(options.length, w, h)) {
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.x + c.width).toBeLessThanOrEqual(w);
        expect(c.height).toBeGreaterThanOrEqual(44);
        expect(c.y + c.height + TUNING.preview.label).toBeLessThanOrEqual(
          h - TUNING.preview.bottom + 0.01,
        );
      }
});

test('a preview with no delay shows a bubble on its first loop', () => {
  for (const { key } of ROWS) {
    const p = { ...part(key, 'random'), delay: 0 };
    const s = createStage(p);
    playToStill(s, p);
    expect(s.world.bubbles.length + s.world.bursts.length).toBeGreaterThan(0);
  }
});
