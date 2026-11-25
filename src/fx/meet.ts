/** Shimmering firework thrown along the collision. */
export const sparks = `
vec2 at(float h, float g, float t) {
  float side = g < 0.5 ? 0.0 : 3.14159;
  float a = side + (h - 0.5) * 2.6 + spin * 0.7;
  float v = 0.3 + 0.65 * fract(h * 7.31 + g * 3.7);
  return vec2(cos(a), sin(a)) * v * (1.0 - exp(-3.2 * t)) + down() * t * t * 0.22;
}
vec3 fx(vec2 p, float t) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 30; i++) {
    float h = hash(vec2(float(i), seed * 91.0));
    float g = hash(vec2(seed * 37.0, float(i) + 5.0));
    vec2 now = at(h, g, t);
    float d = seg(p, now, at(h, g, max(0.0, t - 0.07)));
    float head = length(p - now);
    float tw = 0.45 + 0.55 * sin(t * (40.0 + 50.0 * h) + g * 40.0);
    float die = smoothstep(1.0, 0.35, t + 0.3 * g);
    c += (blend(g) * 0.00045 / (d * d + 0.0004) + vec3(1.0, 0.97, 0.9) * 0.00025 / (head * head + 0.00012) * tw) * die;
  }
  // Cut the long tails so the light keeps to its points.
  return max(c * 0.8 - 0.07, 0.0) + blend(0.5) * exp(-dot(p, p) * 60.0) * exp(-t * 12.0) * 3.0;
}
`;

/** Spirals on spirals, each generation twisting the other way. */
export const chiral = `
vec3 fx(vec2 p, float t) {
  float r = length(p);
  float a = atan(p.y, p.x);
  float grow = easeOut(t) * 1.05;
  float lr = log(r + 0.015);
  vec3 c = vec3(0.0);
  float arms = 3.0;
  float s = hand();
  for (int i = 0; i < 4; i++) {
    float k = float(i);
    float w = a * arms + s * lr * (3.2 + arms * 0.8) - s * t * (7.0 + k * 2.0) + seed * TAU;
    float line = pow(0.5 + 0.5 * cos(w), 16.0 - k * 2.5);
    float reach = grow * (0.6 + 0.14 * k);
    c += mix(blend(0.5 + 0.5 * sin(a * 2.0 + k)), vec3(1.0), 0.25) * line * smoothstep(reach, reach - 0.28, r) / (1.0 + k * 0.55);
    arms += 4.0;
    s = -s;
  }
  float hollow = smoothstep(t * 0.75 - 0.1, t * 0.75 + 0.15, r);
  return c * hollow * smoothstep(1.0, 0.55, t) * 1.1 + blend(0.5) * exp(-r * r * 50.0) * exp(-t * 9.0) * 2.0;
}
`;

/** Golden-angle seeds unwinding from the contact point. */
export const phyllo = `
vec3 fx(vec2 p, float t) {
  vec3 c = vec3(0.0);
  float s = hand();
  for (int i = 0; i < 72; i++) {
    float k = (float(i) + 0.5) / 72.0;
    float born = k * 0.35;
    float u = clamp((t - born) / (1.0 - born), 0.0, 1.0);
    float rad = sqrt(k) * 0.9 * easeOut(min(1.0, u * 1.6));
    float a = s * (float(i) * 2.39996 + u * u * 2.2) + seed * TAU;
    float d = length(p - vec2(cos(a), sin(a)) * rad);
    float size = 0.012 + 0.018 * sin(u * 3.14159);
    float pulse = 0.6 + 0.4 * sin(t * 18.0 - k * 22.0);
    c += blend(k) * size * size * 0.9 / (d * d + size * size * 0.35) * pulse * smoothstep(1.0, 0.6, u) * step(0.001, u);
  }
  return max(c - 0.22, 0.0) * 1.1;
}
`;

/** A branching tree, folded so every twig repeats the whole. */
export const frost = `
vec3 fx(vec2 p, float t) {
  float r = length(p);
  vec2 q = rot(seed * TAU) * p;
  q += 0.02 * (vec2(noise(p * 9.0 + seed), noise(p * 9.0 + 4.0)) - 0.5);
  float sector = TAU / 6.0;
  float a = atan(q.y, q.x);
  a = mod(a + sector * 0.5, sector) - sector * 0.5;
  q = vec2(cos(a), sin(a)) * r;
  float d = 10.0;
  float scale = 1.0;
  float len = 0.4;
  for (int i = 0; i < 6; i++) {
    d = min(d, seg(q, vec2(0.0), vec2(len, 0.0)) / scale);
    q.x -= len * 0.82;
    q.y = abs(q.y);
    q = rot(0.72 + 0.35 * spin) * q;
    q *= 1.5;
    scale *= 1.5;
  }
  float front = easeOut(t) * 1.05;
  float shown = smoothstep(front, front - 0.12, r);
  float tip = exp(-abs(r - front) * 16.0);
  float line = 0.0035 / (d + 0.003);
  vec3 tint = mix(blend(r * 1.3), vec3(0.9, 0.97, 1.0), 0.35);
  return tint * line * (shown * 0.65 + tip * 1.1) * smoothstep(1.0, 0.5, t);
}
`;

/** Repeated inversion: lace that folds through itself. */
export const kali = `
vec3 fx(vec2 p, float t) {
  float grow = 0.15 + easeOut(t) * 0.85;
  float r = length(p);
  vec2 q = rot(hand() * t * 1.6 + seed * TAU) * p / grow * 1.25;
  vec2 c0 = vec2(0.72 + 0.12 * sin(t * 2.6 + seed * 9.0), 0.48 + 0.1 * spin);
  vec3 c = vec3(0.0);
  float last = length(q);
  for (int i = 0; i < 7; i++) {
    q = abs(q) / max(dot(q, q), 0.02) - c0;
    float m = length(q);
    c += blend(fract(float(i) * 0.37 + m * 0.3)) * exp(-abs(m - last) * 7.0) * 0.3;
    c += vec3(1.0, 0.95, 0.9) * exp(-min(abs(q.x), abs(q.y)) * 34.0) * 0.12;
    last = m;
  }
  return c * c * 1.3 * smoothstep(grow, grow * 0.35, r) * smoothstep(1.0, 0.45, t);
}
`;

/** A Julia set whose constant is the collision itself, so no two match. */
export const julia = `
vec3 fx(vec2 p, float t) {
  float grow = 0.12 + easeOut(t) * 0.88;
  vec2 z = rot(hand() * t * 1.2) * p / grow * 1.45;
  float turn = seed * TAU + hand() * (t * 1.1 + 0.4);
  vec2 k = 0.7885 * vec2(cos(turn), sin(turn));
  float trap = 10.0;
  float n = 0.0;
  for (int i = 0; i < 34; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + k;
    trap = min(trap, abs(z.x * z.y));
    if (dot(z, z) > 16.0) break;
    n += 1.0;
  }
  float band = n / 34.0;
  vec3 tint = mix(blend(0.5 + 0.5 * sin(n * 0.7 + t * 5.0)), spectrum(band * 1.4 + seed), 0.35);
  float glow = pow(band, 0.8) * 2.6 + exp(-trap * 18.0) * 0.9 * smoothstep(0.03, 0.2, band);
  return tint * glow * smoothstep(grow, grow * 0.45, length(p)) * smoothstep(1.0, 0.5, t);
}
`;

/** Two voices, one from each bubble, beating against each other. */
export const chord = `
vec3 fx(vec2 p, float t) {
  float gap = 0.2 + 0.12 * t;
  float a = length(p - vec2(gap, spin * 0.15));
  float b = length(p + vec2(gap, spin * 0.15));
  float f = 34.0 + 10.0 * seed;
  float wa = cos(a * f - t * 26.0);
  float wb = cos(b * f * 1.06 - t * 26.0);
  float ra = easeOut(t) * 1.1;
  float ea = smoothstep(ra, ra - 0.2, a) * exp(-a * 1.6);
  float eb = smoothstep(ra, ra - 0.2, b) * exp(-b * 1.6);
  float beat = pow(max(wa * wb, 0.0), 3.0);
  vec3 c = ca * pow(max(wa, 0.0), 6.0) * ea * 0.55 + cb * pow(max(wb, 0.0), 6.0) * eb * 0.55;
  c += mix(blend(0.5), vec3(1.0), 0.5) * beat * ea * eb * 1.8;
  return c * smoothstep(1.0, 0.3, t);
}
`;

/** Bubbles inside bubbles: circles turned inside out again and again. */
export const apollo = `
vec3 fx(vec2 p, float t) {
  float r = length(p);
  float front = easeOut(t) * 1.05;
  float arc = TAU / 5.0;
  float an = mod(atan(p.y, p.x) + hand() * (t * 1.1 + r * 0.9) + seed * TAU, arc) - arc * 0.5;
  vec2 q = vec2(cos(an), abs(sin(an))) * r * mix(2.4, 1.5, easeOut(t)) + vec2(0.3 * seed, 0.3 * spin);
  float s = 1.15 + 0.12 * sin(t * 2.2 + seed * 5.0);
  float w = 1.0;
  vec3 c = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    q = 2.0 * fract(q * 0.5 + 0.5) - 1.0;
    float l = length(q);
    c += blend(fract(float(i) * 0.4 + seed)) * exp(-abs(l - 0.93) * 24.0) * w;
    c += vec3(1.0) * exp(-l * 26.0) * w * 0.4;
    q *= s / max(l * l, 0.03);
    w *= 0.66;
  }
  return c * smoothstep(front, front - 0.35, r) * smoothstep(1.0, 0.45, t);
}
`;
