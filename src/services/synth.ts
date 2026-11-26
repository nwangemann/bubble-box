import { SOUND, VOICING, type Tone } from '@/config/sound';

/** A tone's samples, -1 to 1, at `rate` per second. Starts and ends in silence. */
export function samplesOf(tone: Tone, rate: number = SOUND.rate): Float32Array {
  const n = Math.round(tone.seconds * rate);
  const out = new Float32Array(n);
  const release = Math.min(SOUND.release, tone.seconds / 2);
  const total = tone.partials.reduce((s, [, g]) => s + g, 0) || 1;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const rise = Math.min(1, t / tone.attack);
    const fall = Math.exp(-Math.max(0, t - tone.attack) / tone.decay);
    const tail = Math.min(1, (tone.seconds - t) / release);
    let v = 0;
    for (const [m, g] of tone.partials) v += g * Math.sin(2 * Math.PI * tone.hz * m * t);
    out[i] = (v / total) * tone.level * rise * rise * fall * Math.max(0, tail);
  }
  return out;
}

/** Mono 16-bit PCM WAV bytes for `samples`. */
export function wavOf(samples: Float32Array, rate: number = SOUND.rate): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const v = new DataView(bytes.buffer);
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i));
  };
  text(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    v.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return bytes;
}

/** A playback rate within what a player can do. */
export function rateOf(rate: number) {
  return Math.min(SOUND.fastest, Math.max(SOUND.slowest, rate));
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The nearest semitone count on the scale, in any octave. */
export function onScale(semitones: number) {
  const { scale } = VOICING;
  const octave = Math.floor(semitones / 12);
  let best = 0;
  let far = Infinity;
  // The next octave's root counts too, so a pitch just under it rounds up.
  for (const s of [...scale, 12]) {
    const d = Math.abs(semitones - (octave * 12 + s));
    if (d < far) {
      far = d;
      best = octave * 12 + s;
    }
  }
  return best;
}

/** Playback rate for a bubble of radius `r`: larger is lower, snapped to the scale. */
export function rateOfSize(r: number, radius: number, per: number) {
  const octaves = -Math.log(Math.max(r, 1e-3) / radius) / Math.log(per);
  return rateOf(2 ** (onScale(octaves * 12) / 12));
}

/** How loud a wall's impact sounds, from just heard to full. */
export function volumeOfImpact(impact: number) {
  const B = VOICING.bubble;
  const t = clamp01((impact - B.softest) / (B.loudest - B.softest));
  return B.quiet + (B.full - B.quiet) * Math.sqrt(t);
}

/** Rate and volume of a pot by what it means (`Ball.weight`). */
export function potVoice(weight: number, meaning: { foul: number; last: number; eight: number }) {
  const P = VOICING.pot;
  const steps =
    weight <= meaning.foul
      ? P.foul
      : weight >= meaning.eight
        ? P.eight
        : weight >= meaning.last
          ? P.last
          : P.plain;
  const volume = weight <= meaning.foul ? P.foulVolume : weight > 1 ? P.brightVolume : P.volume;
  return { rate: rateOf(2 ** (steps / 12)), volume };
}
