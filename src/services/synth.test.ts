import { cleanSound, nextSound, SOUND, TONES } from '@/config/sound';
import { onScale, potVoice, rateOf, rateOfSize, samplesOf, volumeOfImpact, wavOf } from './synth';

const chime = TONES.chime;

test('every tone starts and ends in silence', () => {
  for (const tone of Object.values(TONES)) {
    const s = samplesOf(tone);
    expect(s[0]).toBe(0);
    expect(Math.abs(s[s.length - 1]!)).toBeLessThan(1e-3);
  }
});

test('a tone is as long as asked, within -1 to 1', () => {
  const s = samplesOf(chime);
  expect(s.length).toBe(Math.round(chime.seconds * SOUND.rate));
  expect(Math.max(...s.map(Math.abs))).toBeLessThanOrEqual(chime.level + 1e-6);
  expect(Math.max(...s.map(Math.abs))).toBeGreaterThan(chime.level * 0.5);
});

test('a tone starts and ends in silence, without a click', () => {
  const s = samplesOf(chime);
  expect(s[0]).toBe(0);
  expect(Math.abs(s[s.length - 1]!)).toBeLessThan(1e-3);
  const step = Math.max(...s.slice(1).map((v, i) => Math.abs(v - s[i]!)));
  expect(step).toBeLessThan(0.1);
});

test('a wav has a valid header and one 16-bit sample each', () => {
  const s = samplesOf(chime);
  const w = wavOf(s);
  const v = new DataView(w.buffer);
  const text = (at: number) => String.fromCharCode(...w.slice(at, at + 4));
  expect(text(0)).toBe('RIFF');
  expect(text(8)).toBe('WAVE');
  expect(text(36)).toBe('data');
  expect(v.getUint32(4, true)).toBe(w.length - 8);
  expect(v.getUint32(24, true)).toBe(SOUND.rate);
  expect(v.getUint32(40, true)).toBe(s.length * 2);
  expect(w.length).toBe(44 + s.length * 2);
});

test('rates stay within an octave each way', () => {
  expect(rateOf(3)).toBe(SOUND.fastest);
  expect(rateOf(0.1)).toBe(SOUND.slowest);
  expect(rateOf(1.3)).toBe(1.3);
});

describe('voicing', () => {
  const M = { foul: 0.4, last: 1.5, eight: 2.2 };
  const scale = new Set([0, 2, 4, 7, 9]);

  test('every pitch lands on the scale, in any octave', () => {
    for (let s = -30; s <= 30; s += 0.37) {
      const n = onScale(s);
      expect(scale.has(((n % 12) + 12) % 12)).toBe(true);
      expect(Math.abs(n - s)).toBeLessThanOrEqual(1.5);
    }
    expect(onScale(11.6)).toBe(12);
  });

  test('a larger bubble is never higher, within an octave each way', () => {
    let last = Infinity;
    for (let r = 0.05; r <= 0.9; r += 0.01) {
      const rate = rateOfSize(r, 0.2, 3.2);
      expect(rate).toBeLessThanOrEqual(last);
      expect(rate).toBeGreaterThanOrEqual(SOUND.slowest);
      expect(rate).toBeLessThanOrEqual(SOUND.fastest);
      last = rate;
    }
    expect(rateOfSize(0.2, 0.2, 3.2)).toBe(1);
    expect(rateOfSize(0.07, 0.2, 3.2)).toBeGreaterThan(rateOfSize(0.6, 0.2, 3.2));
  });

  test('a harder impact is louder, from quiet to full', () => {
    expect(volumeOfImpact(0)).toBeCloseTo(0.18);
    expect(volumeOfImpact(10)).toBeCloseTo(0.7);
    expect(volumeOfImpact(1)).toBeGreaterThan(volumeOfImpact(0.5));
  });

  test('a pot rises with what it means, and a foul is low and quiet', () => {
    const foul = potVoice(M.foul, M);
    const plain = potVoice(1, M);
    const last = potVoice(M.last, M);
    const eight = potVoice(M.eight, M);
    expect(foul.rate).toBeLessThan(plain.rate);
    expect(plain.rate).toBe(1);
    expect(last.rate).toBeGreaterThan(plain.rate);
    expect(eight.rate).toBeGreaterThan(last.rate);
    expect(foul.volume).toBeLessThan(plain.volume);
    expect(eight.volume).toBeGreaterThan(plain.volume);
  });
});

test('the Sound choice is saved as it was, steps, and falls back to Off', () => {
  expect(cleanSound('tones')).toBe('tones');
  expect(cleanSound('loud')).toBe('off');
  expect(cleanSound(undefined)).toBe('off');
  expect(nextSound(nextSound('off'))).toBe('off');
});
