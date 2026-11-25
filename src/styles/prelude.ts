/**
 * Shared SkSL. A style supplies `half4 style(vec2 p, vec3 n, float rim)` (premultiplied) and
 * `half4 halo()` (rgb, strength). `p` is -1..1 across the bubble, `n` the surface normal facing
 * the viewer, `rim` 0 at the centre and 1 at the edge. Draw area reaches 1.5 for the halo.
 * `reach` is already undone in `p`.
 * Uniform order must match `drawBubble` in scene/drawScene.ts.
 */
export const PRELUDE = `
uniform float time;
uniform float seed;
uniform float px;
uniform float fade;
uniform float pop;
uniform float fog;
uniform float turn;
uniform float2 reach;
`;

/** Helpers shared with effects. */
export const LIB = `
const float TAU = 6.2831853;

float hash(vec2 q) {
  vec3 a = fract(vec3(q.xyx) * 0.1031);
  a += dot(a, a.yzx + 33.33);
  return fract((a.x + a.y) * a.z);
}
float noise(vec2 q) {
  vec2 i = floor(q);
  vec2 f = fract(q);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 q) {
  return noise(q) * 0.55 + noise(q * 2.03 + 7.1) * 0.3 + noise(q * 4.1 + 3.7) * 0.15;
}
mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
vec3 spectrum(float t) { return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67))); }
// Interference colours of a thin film.
vec3 film(float thick) { return 0.5 + 0.5 * cos(TAU * thick * vec3(1.0, 1.22, 1.48)); }
float spot(vec3 n, vec3 l, float k) { return pow(max(dot(n, normalize(l)), 0.0), k); }
// Curved window highlights that make a sphere read as wet.
float shine(vec3 n) {
  return 0.85 * spot(n, vec3(-0.5, -0.6, 0.62), 70.0) + 0.3 * spot(n, vec3(0.5, 0.62, 0.6), 34.0)
       + 0.1 * spot(n, vec3(-0.4, -0.6, 0.7), 7.0);
}
float rimPow(float rim, float k) { return pow(clamp(rim, 0.0, 1.0), k); }
`;

export const SKIN = `
// Spherical coordinates that swirl, for anything living on the surface.
vec2 skin(vec3 n, float speed) {
  return rot(seed * TAU + time * speed + turn) * (n.xy / (0.55 + n.z));
}
`;

export const MAIN = `
// Draws one side of the edge out towards a merging bubble.
vec2 drawn(vec2 p) {
  float k = length(reach);
  float l = length(p);
  if (k < 0.001 || l < 0.001) return p;
  return p / (1.0 + k * pow(max(dot(p, reach) / (k * l), 0.0), 5.0));
}
half4 main(vec2 p) {
  p = drawn(p);
  float d = length(p);
  float grain = (hash(p * 913.0 + seed) - 0.5) / 160.0;
  vec4 c = vec4(0.0);
  if (d < 1.0) {
    vec3 n = vec3(p, sqrt(max(0.0, 1.0 - d * d)));
    c = vec4(style(p, n, 1.0 - n.z));
    c *= smoothstep(1.0, 1.0 - 2.0 * px, d);
    // A popping film tears open from the middle.
    c *= smoothstep(pop * 1.15 - 0.15, pop * 1.15, d + 0.12 * noise(p * 6.0 + seed * 9.0) + 0.001);
  }
  vec4 h = vec4(halo());
  float g = pow(max(0.0, 1.0 - max(0.0, d - 1.0) / 0.5), 3.0) * smoothstep(1.0 - 3.0 * px, 1.0, d);
  c.rgb += h.rgb * h.a * g * (1.0 - pop);
  c.rgb = max(c.rgb * (1.0 - 0.5 * fog) + grain * step(0.02, c.a + g), 0.0);
  c.a = clamp(max(c.a, max(c.r, max(c.g, c.b))), 0.0, 1.0);
  c.rgb = min(c.rgb, vec3(c.a));
  return half4(c * fade);
}
`;
