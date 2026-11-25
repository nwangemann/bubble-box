export const lantern = `
half4 style(vec2 p, vec3 n, float rim) {
  float breath = 0.88 + 0.12 * sin(time * 1.3 + seed * TAU);
  vec2 q = p + 0.1 * vec2(noise(vec2(time * 0.5, seed * 9.0)) - 0.5, noise(vec2(seed * 7.0, time * 0.6)) - 0.5);
  float core = exp(-dot(q, q) * 5.0) * breath;
  float body = exp(-dot(q, q) * 1.3);
  vec3 c = vec3(1.0, 0.45, 0.16) * body * 0.6 + vec3(1.0, 0.86, 0.6) * core * 0.8;
  c += vec3(1.0, 0.5, 0.3) * rimPow(rim, 2.2) * 0.5 + shine(n) * 0.3;
  return half4(c, 0.25 + body * 0.4);
}
half4 halo() { return half4(1.0, 0.5, 0.2, 0.34 + 0.06 * sin(time * 1.3 + seed * TAU)); }
`;

export const aurora = `
half4 style(vec2 p, vec3 n, float rim) {
  vec2 s = n.xy / (0.6 + n.z) * 1.1;
  s = rot(seed * TAU + turn) * s;
  vec3 c = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float k = float(i);
    float y = s.y + (k - 1.0) * 0.35 + 0.35 * sin(s.x * 2.0 + time * 0.4 + k * 2.1) + 0.3 * (noise(vec2(s.x * 2.0 + k * 9.0, time * 0.25)) - 0.5);
    float ray = 0.6 + 0.4 * noise(vec2(s.x * 12.0, time * 0.6 + k * 5.0));
    float band = exp(-abs(y) * (y > 0.0 ? 9.0 : 3.5)) * ray;
    c += band * mix(vec3(0.1, 1.0, 0.6), vec3(0.6, 0.25, 1.0), clamp(0.5 - y * 0.9 + k * 0.2, 0.0, 1.0));
  }
  c = c * 0.75 + vec3(0.25, 0.7, 0.8) * rimPow(rim, 2.2) * 0.5 + shine(n) * 0.5;
  return half4(c, 0.22);
}
half4 halo() { return half4(0.25, 0.9, 0.7, 0.16); }
`;

export const tide = `
half4 style(vec2 p, vec3 n, float rim) {
  float lean = sin(time * 0.6 + seed * TAU) * 0.18;
  float level = 0.05 + p.x * lean + 0.045 * sin(p.x * 5.0 + time * 1.5) + 0.025 * sin(p.x * 9.0 - time * 1.1);
  float water = smoothstep(level - 0.015, level + 0.015, p.y);
  float deep = clamp((p.y - level) * 0.9, 0.0, 1.0);
  float net = abs(noise(p * 5.0 + time * 0.25) - noise(p * 5.0 - time * 0.2 + 4.0));
  vec3 sea = mix(vec3(0.2, 0.8, 0.85), vec3(0.03, 0.2, 0.55), deep) + 0.22 * exp(-net * 14.0) * (1.0 - deep);
  float foam = exp(-abs(p.y - level) * 40.0) * 0.55;
  vec3 c = sea * water * 0.78 + foam + vec3(0.6, 0.9, 1.0) * rimPow(rim, 2.4) * 0.55 + shine(n) * 0.9;
  return half4(c, 0.06 + water * 0.75);
}
half4 halo() { return half4(0.2, 0.7, 0.9, 0.1); }
`;
