/**
 * Shared SkSL for effects. An effect supplies `vec3 fx(vec2 p, float t)`, added as light.
 * `p` is -1..1 with x along the contact normal, `t` runs 0 to 1 over its life.
 * `spin` is -1..1, the sideways rub of the collision. `ca` and `cb` are the bubbles' colours.
 * Uniform order must match `drawBurst` in scene/drawScene.ts.
 */
export const FX_HEAD = `
uniform float age;
uniform float seed;
uniform float strength;
uniform float spin;
uniform float dir;
uniform float px;
uniform float3 ca;
uniform float3 cb;
`;

export const FX_LIB = `
float hand() { return spin < 0.0 ? -1.0 : 1.0; }
float easeOut(float t) { return 1.0 - pow(1.0 - t, 3.0); }
// Screen-down in this effect's turned frame.
vec2 down() { return vec2(sin(dir), cos(dir)); }
vec3 blend(float k) { return mix(ca, cb, clamp(k, 0.0, 1.0)); }
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  return length(p - a - ab * clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-5), 0.0, 1.0));
}
`;

export const FX_MAIN = `
half4 main(vec2 p) {
  float r = length(p);
  if (r > 1.0) return half4(0.0);
  vec3 c = max(fx(p, age), 0.0) * smoothstep(1.0, 0.75, r) * strength;
  c = 1.0 - exp(-c * 1.25);
  return half4(half3(c), half(max(c.r, max(c.g, c.b))));
}
`;
