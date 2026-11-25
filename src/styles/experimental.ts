export const nebula = `
float stars(vec2 q, float cut) {
  vec2 i = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash(i);
  float tw = 0.6 + 0.4 * sin(time * (1.0 + h * 3.0) + h * 40.0);
  return step(cut, h) * exp(-dot(f, f) * 60.0) * tw;
}
half4 style(vec2 p, vec3 n, float rim) {
  // Layers at different depths turn at different rates, so the inside feels deep.
  vec2 a = rot(time * 0.1 + seed * TAU + turn) * p * (1.0 + 0.6 * rim);
  vec2 b = rot(-time * 0.06 + seed * 3.0 + turn * 0.8) * p * (1.5 + rim);
  float gas = fbm(a * 2.4 + fbm(b * 2.0 + time * 0.05) * 1.8);
  float gas2 = fbm(b * 2.8 + 11.0);
  vec3 c = vec3(0.03, 0.01, 0.09);
  c += vec3(0.95, 0.2, 0.6) * pow(gas, 2.6) * 1.7;
  c += vec3(0.15, 0.4, 1.0) * pow(gas2, 3.0) * 1.7;
  c += vec3(1.0, 0.8, 0.6) * exp(-dot(a, a) * 9.0) * 0.5;
  c += stars(a * 8.0, 0.72) + 0.7 * stars(b * 13.0, 0.78);
  c = c * (1.0 - 0.5 * rim) + vec3(0.6, 0.4, 1.0) * rimPow(rim, 3.0) * 0.7 + shine(n) * 0.45;
  return half4(c, 0.92);
}
half4 halo() { return half4(0.6, 0.25, 0.95, 0.2); }
`;

export const ink = `
half4 style(vec2 p, vec3 n, float rim) {
  vec2 q = rot(seed * TAU + turn) * p * 1.3;
  vec2 w = vec2(fbm(q * 1.6 + time * 0.08), fbm(q * 1.6 - time * 0.07 + 5.0));
  vec2 w2 = vec2(fbm(q * 1.4 + w * 3.0 + 1.7), fbm(q * 1.4 + w * 3.0 + 9.2 + time * 0.05));
  float v = fbm(q * 1.5 + w2 * 3.0);
  vec3 c = mix(vec3(0.95, 0.94, 0.9), vec3(0.06, 0.1, 0.32), smoothstep(0.36, 0.6, v));
  c = mix(c, vec3(0.85, 0.15, 0.28), smoothstep(0.55, 0.75, w2.x) * 0.85);
  c = mix(c, vec3(0.95, 0.65, 0.2), smoothstep(0.6, 0.78, w.y) * 0.6);
  c *= 0.65 + 0.4 * n.z;
  return half4(c * 0.92 + shine(n) * 0.6 + 0.2 * rimPow(rim, 3.0), 0.93);
}
half4 halo() { return half4(0.7, 0.75, 1.0, 0.06); }
`;

export const chrome = `
half4 style(vec2 p, vec3 n, float rim) {
  vec2 s = skin(n, 0.05);
  vec3 m = n;
  m.xy += 0.22 * (vec2(fbm(s * 1.5 + time * 0.15), fbm(s * 1.5 - time * 0.13 + 6.0)) - 0.5);
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), normalize(m));
  float h = r.y + 0.12 * sin(r.x * 4.0 + time * 0.3);
  vec3 c = mix(vec3(0.75, 0.82, 0.95), vec3(0.12, 0.13, 0.22), smoothstep(-0.7, 0.02, h));
  c = mix(c, mix(vec3(0.95, 0.72, 0.62), vec3(0.16, 0.12, 0.28), smoothstep(0.02, 0.85, h)), smoothstep(0.0, 0.06, h));
  c += spectrum(r.x * 0.5 + h * 0.6 + time * 0.04) * 0.16 * (0.3 + rim);
  return half4(c + spot(n, vec3(-0.5, -0.6, 0.6), 90.0), 1.0);
}
half4 halo() { return half4(0.8, 0.75, 0.95, 0.06); }
`;

export const contour = `
half4 style(vec2 p, vec3 n, float rim) {
  vec2 s = skin(n, 0.05);
  float v = fbm(s * 1.3 + time * 0.06) * 9.0 + rim * 2.0;
  float w = 0.06 + px * 8.0;
  float f = abs(fract(v) - 0.5);
  float line = smoothstep(w, 0.0, f);
  vec3 tint = mix(vec3(1.0, 0.75, 0.5), vec3(0.5, 0.85, 1.0), 0.5 + 0.5 * sin(floor(v) * 1.3 + seed * TAU));
  vec3 c = tint * line * (0.35 + 0.6 * n.z) + vec3(0.8, 0.9, 1.0) * rimPow(rim, 4.0) * 0.8;
  return half4(c, 0.12);
}
half4 halo() { return half4(0.7, 0.8, 1.0, 0.07); }
`;

export const eclipse = `
half4 style(vec2 p, vec3 n, float rim) {
  float d = length(p);
  float ang = atan(p.y, p.x);
  float flare = noise(vec2(cos(ang), sin(ang)) * 3.0 + time * 0.25 + seed * 9.0);
  float ring = exp(-abs(d - 0.84) * (26.0 - 12.0 * flare));
  float corona = smoothstep(0.82, 0.86, d) * (0.35 + 0.6 * flare);
  float bead = spot(vec3(p / max(d, 0.001), 0.0), vec3(cos(time * 0.2 + seed * TAU + turn), sin(time * 0.2 + seed * TAU + turn), 0.0), 120.0);
  vec3 c = vec3(1.0, 0.8, 0.55) * ring + vec3(0.95, 0.4, 0.3) * corona * (1.0 - smoothstep(0.86, 1.0, d));
  c += vec3(1.0, 0.95, 0.85) * bead * exp(-abs(d - 0.84) * 12.0);
  return half4(c, (1.0 - smoothstep(0.84, 1.0, d)) * 0.98);
}
half4 halo() { return half4(0.95, 0.4, 0.25, 0.1); }
`;

export const medusa = `
half4 style(vec2 p, vec3 n, float rim) {
  float pulse = 0.5 + 0.5 * sin(time * 1.6 + seed * TAU);
  vec2 q = rot(0.25 * sin(time * 0.4 + seed * 9.0) + turn) * p;
  float ang = atan(q.y, q.x);
  float d = length(q);
  float ribs = pow(0.5 + 0.5 * cos(ang * 12.0 + sin(d * 6.0 - time) * 0.6), 7.0) * smoothstep(0.15, 0.6, d);
  float wave = exp(-abs(d - fract(time * 0.28 + seed)) * 10.0) * (1.0 - d);
  float organ = exp(-pow(abs(d - 0.28 - 0.05 * cos(ang * 4.0 + time * 0.3)) * 15.0, 2.0));
  vec3 c = vec3(0.2, 0.75, 1.0) * ribs * 0.45 + vec3(1.0, 0.35, 0.75) * organ * (0.5 + 0.4 * pulse);
  c += vec3(0.5, 1.0, 0.9) * wave * 0.9 + vec3(0.35, 0.45, 1.0) * rimPow(rim, 1.8) * (0.5 + 0.25 * pulse);
  return half4(c + shine(n) * 0.25, 0.2);
}
half4 halo() { return half4(0.25, 0.5, 1.0, 0.16 + 0.1 * sin(time * 1.6 + seed * TAU)); }
`;
