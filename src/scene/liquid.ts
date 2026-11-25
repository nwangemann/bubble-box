import { Skia, type SkRuntimeEffect } from '@shopify/react-native-skia';
import { LIB } from '@/styles/prelude';

/** Most bubbles one can be taking in at once and still be drawn as one surface. */
/** Kinds of vapour; see `vapour`. */
export const MOTIFS = 12;
export const PARTNERS = 3;

/**
 * A showdown bubble: a thin film around tinted vapour. The surface is found by marching a ray at the
 * smooth union of the bubble and whatever it is taking in, each ringing about its axis, so a neck
 * opens, fattens and is swallowed as one sheet. Lone calm bubbles skip the march.
 *
 * Coordinates are radii of the bubble, z towards the viewer. Uniform order matches `drawLiquid`.
 */
const SKSL = `
uniform shader scene;
uniform float time;
uniform float seed;
uniform float px;
uniform float motif;
uniform float tear;
uniform float neck;
uniform float2 centre;
uniform float rad;
uniform float2 modes;
uniform float3 axis;
uniform float3 hole;
uniform float2 away;
uniform float3 air;
uniform float4 pA;
uniform float4 pB;
uniform float4 pC;
uniform float3 cA;
uniform float3 cB;
uniform float3 cC;
uniform float3 lit;
uniform float3 shade;
uniform float3 skyHigh;
uniform float3 skyLow;
uniform float3 ground;
${LIB}
float join(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
float own(vec3 q) {
  float l = length(q);
  float c = dot(q, axis) / max(l, 0.001);
  return l - (1.0 + modes.x * (1.5 * c * c - 0.5) + modes.y * (2.5 * c * c - 1.5) * c);
}
float field(vec3 q) {
  float d = own(q);
  if (pA.w > 0.001) d = join(d, length(q - pA.xyz) - pA.w, neck * min(1.0, pA.w) + 0.001);
  if (pB.w > 0.001) d = join(d, length(q - pB.xyz) - pB.w, neck * min(1.0, pB.w) + 0.001);
  if (pC.w > 0.001) d = join(d, length(q - pC.xyz) - pC.w, neck * min(1.0, pC.w) + 0.001);
  return d;
}
vec3 slope(vec3 q) {
  vec2 e = vec2(0.012, 0.0);
  return normalize(vec3(field(q + e.xyy) - field(q - e.xyy), field(q + e.yxy) - field(q - e.yxy),
                        field(q + e.yyx) - field(q - e.yyx)));
}
float softbox(vec2 r, vec2 at, vec2 size, float blur) {
  vec2 d = abs(r - at) - size;
  return 1.0 - smoothstep(-0.03 - blur, 0.05 + blur, max(d.x, d.y));
}
// The bars of that window.
float panes(vec2 d, float from) {
  return smoothstep(from, 0.03, abs(d.x)) * smoothstep(from, 0.03, abs(d.y));
}
// What the film mirrors: sky above, floor below, and one window of light.
vec3 room(vec3 r, float blur) {
  vec3 c = mix(ground, skyLow, smoothstep(-0.3, 0.1, -r.y));
  c = mix(c, skyHigh, smoothstep(0.1, 0.95, -r.y));
  float w = softbox(r.xy, vec2(-0.52, -0.56), vec2(0.17, 0.22), blur);
  w *= mix(panes(r.xy + vec2(0.52, 0.56), 0.012), 0.8, min(1.0, blur * 12.0));
  return c * 0.75 + vec3(1.0, 0.97, 0.92) * (w * 1.9 + 0.25 * pow(max(-r.y, 0.0), 6.0));
}
// What the vapour inside looks like: one of MOTIFS, so no two in a theme's cast match.
float vapour(vec2 s, vec3 n) {
  float t = time * 0.07;
  float f = fbm(s * 1.5 + seed * 17.0 + vec2(t, -t));
  if (motif < 0.5) return 0.25 + 0.3 * f;
  if (motif < 1.5) return smoothstep(0.3, 0.8, fbm(s * 1.4 + f * 1.6 + t));
  if (motif < 2.5) return 0.5 + 0.5 * sin(s.y * 9.0 + f * 5.0);
  if (motif < 3.5) return 0.2 + 0.8 * smoothstep(0.72, 0.9, noise(s * 9.0 + seed * 40.0 + t));
  if (motif < 4.5) return pow(1.0 - abs(2.0 * fbm(s * 1.6 + f) - 1.0), 5.0);
  if (motif < 5.5) return smoothstep(0.1, 0.5, abs(noise(s * 4.0 + t) - 0.5) * 2.0);
  if (motif < 6.5) return 0.5 + 0.5 * sin(atan(s.y, s.x) * 3.0 + length(s) * 6.0 - time * 0.4 + f * 2.0);
  if (motif < 7.5) return pow(noise(s * 13.0) * 0.5 + f * 0.7, 2.0) * 1.6;
  if (motif < 8.5) return 0.5 + 0.5 * cos(length(s - 0.2) * 14.0 + f * 3.0);
  if (motif < 9.5) return 0.15 + pow(max(0.0, fbm(s * 2.4 + vec2(0.0, time * 0.25)) - 0.1), 2.5) * 3.0;
  if (motif < 10.5) return 0.5 + 0.5 * sin((s.x + f * 1.8) * 7.0);
  return 0.35 + 0.65 * pow(abs(cos(atan(s.y, s.x) * 2.5 + length(s) + t * 3.0)), 1.6) * (1.0 - 0.3 * f);
}
// How far a partner's dye reaches here, frayed as it stirs in.
float dye(vec3 q, vec4 p, float mine) {
  if (p.w < 0.001) return 0.0;
  float fray = (fbm(q.xy * 3.0 + seed * 9.0 + time * 0.4) - 0.5) * 0.5;
  return smoothstep(-0.25, 0.35, mine - (length(q - p.xyz) - p.w) + fray) * smoothstep(0.0, 0.25, p.w);
}
half4 main(vec2 p) {
  vec3 q = vec3(p, 0.0);
  float cover;
  // Softer with distance, judged at the centre so the edge is even all round.
  float blur = air.z * clamp(away.x, 0.0, 1.0);
  bool lone = pA.w < 0.001;
  bool calm = lone && abs(modes.x) < 0.003 && abs(modes.y) < 0.003;
  vec3 n;
  if (calm) {
    float l = length(p);
    cover = 1.0 - smoothstep(1.0 - 1.5 * px, 1.0 + blur, l);
    if (cover <= 0.0) return half4(0.0);
    n = vec3(p / max(1.0, l), sqrt(max(0.0, 1.0 - l * l)));
    q = n;
  } else {
    float z = 2.4;
    float least = 1.0;
    for (int i = 0; i < 30; i++) {
      float d = field(vec3(p, z));
      least = min(least, d);
      z -= max(d, 0.004) * 0.92;
      if (d < 0.004 || z < -2.2) break;
    }
    cover = 1.0 - smoothstep(0.004, 0.006 + 1.5 * px + blur, least);
    if (cover <= 0.0) return half4(0.0);
    // A ray that missed is in the soft edge: judge it level with the centre.
    if (least > 0.004) z = 0.0;
    q = vec3(p, z);
    n = slope(q);
    n.z = max(n.z, 0.0);
  }
  float rim = 1.0 - n.z;
  // Dyes meet inside the merged surface.
  float mine = own(q);
  vec3 tint = lit;
  tint = mix(tint, cA, dye(q, pA, mine));
  tint = mix(tint, cB, dye(q, pB, mine));
  tint = mix(tint, cC, dye(q, pC, mine));
  vec2 s = rot(seed * TAU + time * 0.05) * (q.xy / (0.75 + 0.4 * n.z));
  float v = clamp(vapour(s, n), 0.0, 1.0);
  // Bent background near the edge, where the film is seen edge on.
  vec2 at = centre + rad * (p - n.xy * pow(rim, 1.6) * 0.75);
  vec3 split = n.x * n.x * vec3(0.02, 0.0, -0.02);
  vec3 back = vec3(scene.eval(at + rad * split.x).r, scene.eval(at).g, scene.eval(at + rad * split.z).b);
  // The film drains: thin at the top, thick and slowly turning below.
  float flow = fbm(s * 1.5 + vec2(time * 0.05, time * 0.08) + fbm(s * 2.1 - time * 0.05) * 1.3);
  float thick = 0.45 + seed * 0.5 + 0.35 * p.y + flow * 0.75 + rim * 0.7;
  vec3 sheen = film(thick);
  vec3 r = vec3(2.0 * n.xy * n.z, 2.0 * n.z * n.z - 1.0);
  float mirror = 0.05 + 0.95 * pow(rim, 3.0);
  vec3 front = room(r, blur);
  // The far side of the film shows the window again, upside down.
  vec3 behind = room(vec3(-r.x, -r.y, r.z), blur) * vec3(0.8, 0.9, 1.0);
  float light = 0.55 + 0.55 * max(dot(n, normalize(vec3(-0.45, -0.65, 0.6))), 0.0);
  // Light gathers on the side away from the window, as through any sphere of fluid.
  float gather = pow(max(dot(n, normalize(vec3(0.42, 0.62, 0.5))), 0.0), 5.0);
  vec3 dyed = mix(shade, tint, 0.3 + 0.7 * v);
  if (!lone) dyed = mix(dyed, tint * (0.5 + 0.5 * v), 0.5);
  float body = 0.16 + 0.34 * v + 0.2 * rim;
  float edge = smoothstep(0.25, 0.95, rim);
  float a = clamp(body + edge * 0.75, 0.0, 1.0);
  vec3 c = dyed * light * body;
  c += back * mix(vec3(1.0), tint, 0.55) * edge * 0.6;
  c += tint * gather * 0.4;
  vec3 iris = mix(vec3(1.0), sheen * 1.5, 0.75);
  c += front * iris * mirror * 0.75;
  c += sheen * (0.05 + 0.16 * rim) * (skyLow * 0.5 + 0.5);
  vec2 w = r.xy;
  c += vec3(1.0, 0.98, 0.95) * 0.7 * softbox(w, vec2(-0.6, -0.62), vec2(0.15, 0.19), blur)
     * mix(panes(w + vec2(0.6, 0.62), 0.01), 0.8, min(1.0, blur * 12.0));
  c += behind * softbox(w, vec2(0.6, 0.64), vec2(0.13, 0.15), blur) * 0.22;
  c *= 1.0 - 0.35 * smoothstep(0.82, 1.0, rim);
  a = clamp(max(a, max(c.r, max(c.g, c.b)) * 0.75), 0.0, 1.0);
  // A burst film: a hole opens from where it was struck and gathers a bead along its edge.
  if (tear > 0.0) {
    float far = acos(clamp(dot(n, hole), -1.0, 1.0)) / 3.14159;
    far += (fbm(s * 4.0 + seed * 31.0) - 0.5) * 0.12 * tear;
    float open = tear * 1.15;
    float left = smoothstep(open - 0.03, open, far);
    float bead = smoothstep(0.1, 0.0, abs(far - open - 0.02));
    c = c * left * (1.0 - tear) + vec3(0.9, 0.95, 1.0) * bead * left * 0.5 * (1.0 - tear);
    a = a * left * (1.0 - tear);
  }
  c = min(c, vec3(1.0));
  a = clamp(max(a, max(c.r, max(c.g, c.b)) * 0.6), 0.0, 1.0);
  // The air between: each part of a joined surface by its own depth. The room's light is skyLow.
  float off = clamp(away.x - q.z * away.y, 0.0, 1.0);
  c = mix(c * (1.0 - air.y * off), skyLow * a, air.x * off);
  c = min(c, vec3(a));
  return half4(half3(c * cover), half(a * cover));
}
`;

/** One that fails to compile is reported; the showdown then draws without films. */
export function compileLiquid(): SkRuntimeEffect | null {
  try {
    return Skia.RuntimeEffect.Make(SKSL);
  } catch (e) {
    console.error('Liquid failed to compile', e);
    return null;
  }
}
