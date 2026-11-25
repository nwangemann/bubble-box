/** Extra uniforms come last, in the order of `customLook` in config/custom.ts. */
export const custom = `
uniform float3 ca;
uniform float3 cb;
uniform float kind;
uniform float size;

// 0 to 1: how far from the first colour to the second.
float motif(vec2 s) {
  float k = mix(5.0, 1.3, size);
  float w = 0.05 + px * k * 3.0;
  if (kind < 0.5) return 0.5 + 0.5 * sin(s.y * (0.4 + k * 0.4) + 0.4 * sin(s.x + time * 0.2) + time * 0.12);
  if (kind < 1.5) {
    float v = sin(s.y * k * 1.8 + 0.6 * sin(s.x * 1.6 + time * 0.3));
    return smoothstep(-w * 3.0, w * 3.0, v);
  }
  float ang = atan(s.y, s.x);
  float r = length(s);
  if (kind < 2.5) {
    float v = sin(ang * 3.0 + log(r + 0.12) * k * 1.4 - time * 0.3);
    return mix(0.5, smoothstep(-0.7, 0.7, v), smoothstep(0.02, 0.3, r));
  }
  if (kind < 3.5) {
    vec2 q = s * k * 0.9;
    float h = hash(floor(q) + floor(seed * 50.0));
    float radius = 0.27 + 0.07 * sin(time * 0.8 + h * TAU);
    return 1.0 - smoothstep(radius - w, radius + w, length(fract(q) - 0.5));
  }
  if (kind < 4.5) {
    vec2 q = s * k * 0.8 + seed * 20.0;
    vec2 i = floor(q);
    float one = 9.0;
    float two = 9.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 c = i + vec2(float(x), float(y));
        float h = hash(c);
        vec2 o = 0.5 + 0.35 * vec2(cos(time * 0.35 + h * TAU), sin(time * 0.3 + h * 17.0));
        float d = length(c + o - q);
        two = min(two, max(one, d));
        one = min(one, d);
      }
    }
    return 1.0 - smoothstep(0.04, 0.16 + w, two - one);
  }
  if (kind < 5.5) {
    vec2 q = s * k * 0.45 + seed * 9.0;
    float warp = fbm(q + time * 0.05);
    float v = sin((q.x + q.y) * 2.2 + (warp + fbm(q * 2.0 + warp * 2.0 - time * 0.04)) * 8.0);
    return pow(0.5 + 0.5 * v, 1.6);
  }
  float edge = sin(r * k * 2.4 - time * 0.35 - 1.5 * abs(cos(ang * 2.5)));
  return smoothstep(-w * 4.0, w * 4.0, edge);
}
half4 style(vec2 p, vec3 n, float rim) {
  vec3 col = mix(ca, cb, motif(skin(n, 0.05)));
  float a = 0.62 + 0.33 * rimPow(rim, 1.6);
  float lit = 0.72 + 0.28 * max(dot(n, normalize(vec3(-0.4, -0.65, 0.6))), 0.0);
  vec3 c = col * lit * (0.88 + 0.12 * rim) + col * rimPow(rim, 3.0) * 0.2;
  return half4(c + shine(n) * 0.8, a);
}
half4 halo() { return half4(half3(mix(ca, cb, 0.5)), 0.12); }
`;
