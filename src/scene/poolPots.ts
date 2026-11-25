import { BlendMode, Skia, type SkCanvas } from '@shopify/react-native-skia';
import { POOL } from '@/config/pool';
import { pockets, type Ball, type Pool } from '@/core/pool';
import { landsAt, motePath, potLight, type PoolRowLayout } from '@/core/poolRow';
import { scaleAt } from '@/core/projection';
import type { Box } from '@/core/types';
import { LIB } from '@/styles/prelude';
import type { View } from './drawScene';
import { LIGHTS } from './poolWalls';
import { compile, ROOM } from './walls';

const MOST = POOL.pot.most;

/** Light from pockets over the walls. Uniform order matches `drawPots`. */
const SPILL = `
${ROOM}
uniform float speed;
uniform float ripple;
uniform float4 at[${MOST}]; // place, seconds since it dropped
uniform float4 tints[${MOST}]; // colour, how bright
${LIB}
half4 main(vec2 xy) {
  find(xy);
  vec3 c = vec3(0.0);
  for (int i = 0; i < ${MOST}; i++) {
    float4 t = tints[i];
    if (t.w > 0.0) {
      vec3 to = at[i].xyz - P;
      float d = length(to);
      float lamp = (0.25 + 0.75 * max(dot(N, to) / max(d, 1e-3), 0.0)) / (1.0 + 9.0 * d * d);
      // A front of light that runs out from the pocket over every wall.
      float front = d - speed * at[i].w;
      float ring = exp(-front * front * 14.0) / (1.0 + d);
      c += t.rgb * t.w * (lamp + ripple * ring);
    }
  }
  c = 1.0 - exp(-c);
  float a = max(c.r, max(c.g, c.b));
  float grain = (hash(xy) - 0.5) / 160.0 * step(0.004, a);
  a = clamp(a + grain, 0.0, 1.0);
  return half4(half3(clamp(c + grain, vec3(0.0), vec3(a))), half(a));
}
`;

/** A soft point of light, or a ring. */
const GLOW = `
uniform float3 color;
uniform float strength;
uniform float ring; // 0 to 1
half4 main(vec2 p) {
  float d = length(p);
  if (d >= 1.0) return half4(0.0);
  float edge = smoothstep(1.0, 0.7, d);
  float spot = exp(-d * d * 5.0);
  float hoop = exp(-(d - 0.72) * (d - 0.72) * 70.0);
  float k = mix(spot, hoop, ring) * edge * strength;
  vec3 c = mix(color, vec3(1.0), 0.45 * exp(-d * d * 16.0) * (1.0 - ring)) * k;
  return half4(half3(c), half(max(c.r, max(c.g, c.b))));
}
`;

export function compilePots() {
  const spill = Skia.Paint();
  const glow = Skia.Paint();
  glow.setBlendMode(BlendMode.Plus);
  return {
    spill,
    glow,
    spillEffect: compile('pool pots', SPILL),
    glowEffect: compile('pool glow', GLOW),
  };
}
export type PotsGpu = ReturnType<typeof compilePots>;

/** Light of a pot: the 8's is pale, as its own colour would hardly show. */
const COLORS = POOL.looks.map(({ kind }, i) => (kind === 'eight' ? [0.8, 0.85, 0.9] : LIGHTS[i]!));

function square(
  canvas: SkCanvas,
  paint: ReturnType<typeof Skia.Paint>,
  x: number,
  y: number,
  r: number,
) {
  'worklet';
  canvas.save();
  canvas.translate(x, y);
  canvas.scale(r, r);
  canvas.drawRect({ x: -1, y: -1, width: 2, height: 2 }, paint);
  canvas.restore();
}

/** On the walls, beneath the balls. */
export function drawPots(canvas: SkCanvas, gpu: PotsGpu, pool: Pool, box: Box, v: View) {
  'worklet';
  const { spillEffect } = gpu;
  if (!spillEffect) return;
  const P = POOL.pot;
  const lit: { b: Ball; i: number }[] = [];
  pool.balls.forEach((b, i) => {
    if (i > 0 && b.pocket >= 0 && b.sunk >= 0 && b.sunk < P.gone) lit.push({ b, i });
  });
  if (lit.length === 0) return;
  lit.sort((a, b) => a.b.sunk - b.b.sunk);
  const at: number[] = [];
  const tints: number[] = [];
  for (let n = 0; n < MOST; n++) {
    const o = lit[n];
    const c = o ? COLORS[o.i]! : [0, 0, 0];
    // Where it dropped: snug in the pocket, a little off its walls.
    const p = o ? o.b.p : { x: 0, y: 0, z: 0 };
    at.push(p.x, p.y, p.z, o ? o.b.sunk : 0);
    const k = o ? potLight(o.b.sunk) * P.spill * (pool.calm ? P.calm : 1) : 0;
    tints.push(c[0]!, c[1]!, c[2]!, k);
  }
  gpu.spill.setShader(
    spillEffect.makeShader([
      v.cx,
      v.cy,
      v.ppu,
      box.hw,
      box.hh,
      box.depth,
      box.focal,
      P.speed,
      pool.calm ? 0 : P.ripple,
      ...at,
      ...tints,
    ]),
  );
  const w = box.hw * v.ppu;
  const h = box.hh * v.ppu;
  canvas.drawRect({ x: v.cx - w, y: v.cy - h, width: w * 2, height: h * 2 }, gpu.spill);
}

/** What carries a pot to its place in the row, over everything. */
export function drawMotes(
  canvas: SkCanvas,
  gpu: PotsGpu,
  pool: Pool,
  row: PoolRowLayout,
  box: Box,
  v: View,
) {
  'worklet';
  const { glowEffect } = gpu;
  if (!glowEffect || pool.calm) return;
  const { leaves, lands, blooms, mote } = POOL.pot;
  const ends = landsAt(false) + blooms;
  const holes = pockets(box);
  for (const { places } of row.groups)
    for (const place of places) {
      const b = pool.balls[place.ball];
      const q = b && holes[b.pocket];
      if (!b || !q || b.sunk < 0 || b.sunk >= ends) continue;
      const c = COLORS[place.ball]!;
      const s = scaleAt(box, q.z) * v.ppu;
      const from = [q.x * s * 0.94, q.y * s * 0.97];
      const to = [place.x, POOL.row.top - v.cy];
      for (let n = mote.tail - 1; n >= 0; n--) {
        const k = (b.sunk - n * mote.lag - leaves) / (lands - leaves);
        if (k <= 0 || k >= 1) continue;
        const p = motePath(from, to, k);
        const thin = 1 - n / mote.tail;
        // Comes out of the pocket and sinks into its place, rather than starting and stopping.
        const seen = Math.min(1, k * 6);
        gpu.glow.setShader(glowEffect.makeShader([...c, mote.strength * seen * thin * thin, 0]));
        square(
          canvas,
          gpu.glow,
          v.cx + p.x,
          v.cy + p.y,
          row.radius * mote.size * (0.4 + 0.6 * thin),
        );
      }
      const k = (b.sunk - lands) / blooms;
      if (k <= 0 || k >= 1) continue;
      const out = 1 - (1 - k) ** 2;
      const x = v.cx + place.x;
      gpu.glow.setShader(glowEffect.makeShader([...c, 1.4 * (1 - k) ** 2, 1]));
      square(canvas, gpu.glow, x, POOL.row.top, row.radius * (1.4 + 2.2 * out));
      gpu.glow.setShader(glowEffect.makeShader([...c, (1 - k) ** 2, 0]));
      square(canvas, gpu.glow, x, POOL.row.top, row.radius * mote.size);
    }
}
