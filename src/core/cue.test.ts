import { POOL } from '../config/pool';
import { cueBands, CUE_PARTS } from './cue';

const shape = POOL.aim.cue;
const ppu = 200;

test('a cue lies behind the ball, its tip just off it, pointing at the target', () => {
  // Ball at (100, 600), r 40, aiming up and right at (160, 520).
  const bands = cueBands(100, 600, 40, 160, 520, 0, ppu, shape);
  expect(bands.map((b) => b.part)).toEqual([...CUE_PARTS]);
  for (let i = 1; i < bands.length; i++) {
    expect(bands[i]!.ax).toBeCloseTo(bands[i - 1]!.bx);
    expect(bands[i]!.ay).toBeCloseTo(bands[i - 1]!.by);
  }
  const tip = bands[bands.length - 1]!;
  expect(Math.hypot(tip.bx - 100, tip.by - 600)).toBeCloseTo(40 + shape.short);
  // Beyond the ball, away from the target: down and left.
  const butt = bands[0]!;
  expect(butt.ax).toBeLessThan(100);
  expect(butt.ay).toBeGreaterThan(600);
  // In line: the butt, the ball and the target.
  const cross = (butt.ax - 100) * (520 - 600) - (butt.ay - 600) * (160 - 100);
  expect(Math.abs(cross)).toBeLessThan(1e-6);
  expect(Math.hypot(butt.ax - tip.bx, butt.ay - tip.by)).toBeCloseTo(shape.length * ppu);
});

test('it widens from tip to butt', () => {
  const bands = cueBands(100, 600, 40, 160, 520, 0, ppu, shape);
  const widths = bands.flatMap((b) => [b.wa, b.wb]);
  for (let i = 1; i < widths.length; i++) expect(widths[i]!).toBeLessThanOrEqual(widths[i - 1]!);
  expect(bands[0]!.wa).toBeCloseTo((shape.butt * ppu) / 2);
  expect(bands[bands.length - 1]!.wb).toBeCloseTo((shape.tip * ppu) / 2);
});

test('charging draws it back, no further than its pull', () => {
  const tipAt = (power: number) => {
    const b = cueBands(100, 600, 40, 160, 520, power, ppu, shape);
    const t = b[b.length - 1]!;
    return Math.hypot(t.bx - 100, t.by - 600);
  };
  expect(tipAt(0.5) - tipAt(0)).toBeCloseTo(shape.pull / 2);
  expect(tipAt(3) - tipAt(0)).toBeCloseTo(shape.pull);
});

test('aimed straight at the far wall it points up the screen, without a jump near it', () => {
  const butt = (tx: number, ty: number) => cueBands(200, 400, 30, tx, ty, 0, ppu, shape)[0]!;
  const dead = butt(200, 400);
  expect(dead.ax).toBeCloseTo(200);
  expect(dead.ay).toBeGreaterThan(400);
  const a = butt(200.5, 400);
  const b = butt(199.5, 400);
  // Without the lean they would point opposite ways, 2 lengths apart.
  expect(Math.abs(a.ax - b.ax)).toBeLessThan(0.1 * shape.length * ppu);
});
