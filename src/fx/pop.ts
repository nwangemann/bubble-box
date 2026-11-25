export const droplets = `
vec3 fx(vec2 p, float t) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 26; i++) {
    float k = float(i);
    float h = hash(vec2(k, seed * 53.0));
    float g = hash(vec2(seed * 17.0, k + 3.0));
    float a = (k + h) / 26.0 * TAU;
    float v = 0.38 + (1.0 - exp(-2.6 * t)) * (0.12 + 0.5 * g);
    vec2 q = vec2(cos(a), sin(a)) * v + down() * t * t * (0.18 + 0.2 * h);
    float size = (0.022 + 0.045 * h * h) * (1.0 - 0.75 * t);
    float d = length(p - q);
    float body = smoothstep(size, size * 0.6, d);
    float edge = smoothstep(size * 0.35, size * 0.95, d) * body;
    float glint = smoothstep(size * 0.35, 0.0, length(p - q + vec2(size * 0.3)));
    c += (blend(g) * (edge * 0.9 + body * 0.2) + glint * 0.8) * smoothstep(1.0, 0.5, t);
  }
  return c * 1.4;
}
`;

export const mist = `
vec3 fx(vec2 p, float t) {
  float r = length(p);
  float a = 0.5 * hand() * t / (0.3 + r);
  vec2 q = rot(a) * p * (2.6 - 1.2 * t) + seed * 20.0;
  float n = fbm(q + fbm(q * 1.4 - t) * 1.6);
  float spread = 0.42 + 0.5 * easeOut(t);
  float m = smoothstep(0.3, 0.75, n) * smoothstep(spread, spread * 0.3, r);
  vec3 tint = blend(n * 1.4 - 0.2);
  return tint * m * 1.2 * pow(1.0 - t, 1.6);
}
`;

export const shatter = `
vec3 fx(vec2 p, float t) {
  float open = 1.0 + easeOut(t) * 1.1;
  vec2 fall = down() * t * t * 0.3;
  vec2 q = (p - fall) / open;
  float r0 = length(q) / 0.455;
  vec2 g = q * 8.5 + seed * 31.0;
  vec2 i0 = floor(g);
  float d1 = 9.0;
  float d2 = 9.0;
  vec2 id = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 c = i0 + vec2(float(x), float(y));
      vec2 o = c + 0.15 + 0.7 * vec2(hash(c), hash(c + 17.0));
      float d = length(g - o);
      if (d < d1) { d2 = d1; d1 = d; id = c; } else if (d < d2) { d2 = d; }
    }
  }
  float h = hash(id + 3.0);
  float gap = 0.03 + t * 0.55;
  float piece = smoothstep(gap, gap + 0.06, d2 - d1);
  float rim = piece * smoothstep(gap + 0.22, gap, d2 - d1);
  float tumble = 0.5 + 0.5 * cos(t * (8.0 + 14.0 * h) + h * 40.0);
  vec3 tint = mix(blend(h), spectrum(h + r0 * 0.5 + t), 0.45);
  float inside = smoothstep(1.02, 0.96, r0);
  return (tint * piece * (0.2 + 0.7 * tumble * tumble) + rim * 0.5) * inside * smoothstep(1.0, 0.3 + 0.4 * h, t);
}
`;

export const rays = `
vec3 fx(vec2 p, float t) {
  float r = length(p);
  vec2 u = p / max(r, 0.001);
  float beam = noise(u * 5.0 + seed * 40.0 + hand() * t * 0.8) * noise(u * 11.0 - seed * 20.0 - t);
  float front = easeOut(t);
  float shaft = pow(beam, 1.6) * 3.2 * smoothstep(front, front - 0.5, r) * smoothstep(t * 0.5 - 0.1, t * 0.5 + 0.3, r + 0.1);
  vec3 c = mix(blend(noise(u * 3.0 + 9.0)), vec3(1.0, 0.97, 0.9), 0.3) * shaft * (1.0 - r * 0.5);
  c += blend(0.5) * exp(-r * r * 14.0) * exp(-t * 5.0) * 1.6;
  return c * smoothstep(1.0, 0.3, t);
}
`;

export const implode = `
vec3 fx(vec2 p, float t) {
  float r = length(p);
  // The bubble falls inwards first, then light escapes.
  float fall = clamp(t / 0.42, 0.0, 1.0);
  float out1 = clamp((t - 0.4) / 0.6, 0.0, 1.0);
  float a = atan(p.y, p.x) + hand() * (1.0 - r) * 4.0 * fall;
  float streak = pow(0.5 + 0.5 * cos(a * 9.0 + seed * TAU), 7.0) * exp(-abs(r - mix(0.75, 0.05, fall * fall)) * 8.0);
  vec3 c = blend(0.5 + 0.5 * sin(a)) * streak * fall * (1.0 - out1) * step(t, 0.42) * 1.3;
  float ringR = easeOut(out1) * 0.95;
  float born = step(0.001, out1);
  c += mix(blend(0.3), vec3(1.0), 0.5) * exp(-abs(r - ringR) * 60.0) * born * pow(1.0 - out1, 1.5) * 1.6;
  c += spectrum(r * 2.0 - out1) * exp(-abs(r - ringR * 0.8) * 22.0) * born * pow(1.0 - out1, 2.0) * 0.5;
  c += vec3(1.0, 0.96, 0.9) * exp(-r * r * 160.0) * exp(-abs(t - 0.42) * 14.0) * 2.5;
  return c;
}
`;

export const ring = `
vec3 fx(vec2 p, float t) {
  float r = length(p);
  float at = 0.5 + easeOut(t) * 0.42;
  return blend(0.5 + 0.5 * p.x) * exp(-abs(r - at) * 40.0) * pow(1.0 - t, 2.0) * 0.8;
}
`;
