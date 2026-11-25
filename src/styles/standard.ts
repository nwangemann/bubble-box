export const soap = `
half4 style(vec2 p, vec3 n, float rim) {
  vec2 s = skin(n, 0.06);
  float flow = fbm(s * 1.6 + vec2(0.0, time * 0.09) + fbm(s * 2.2 - time * 0.06) * 1.4);
  vec3 col = mix(vec3(0.8, 0.88, 1.0), film(0.6 + flow * 1.1 + rim * 0.8 + p.y * 0.3), 0.72);
  float a = 0.1 + 0.85 * rimPow(rim, 1.5);
  vec3 c = col * a * 0.85 + shine(n);
  return half4(c, a * 0.45);
}
half4 halo() { return half4(0.6, 0.7, 1.0, 0.07); }
`;

export const glass = `
half4 style(vec2 p, vec3 n, float rim) {
  float edge = rimPow(rim, 2.6);
  float caustic = spot(n, vec3(0.45, 0.7, 0.35), 9.0) * 0.45;
  vec3 c = vec3(0.75, 0.88, 1.0) * edge * 0.75 + vec3(0.85, 0.95, 1.0) * caustic + shine(n) * 1.1;
  c.r += 0.14 * rimPow(rim, 5.0);
  c += vec3(0.04, 0.06, 0.09);
  return half4(c, 0.1 + edge * 0.3);
}
half4 halo() { return half4(0.7, 0.85, 1.0, 0.05); }
`;

export const pearl = `
half4 style(vec2 p, vec3 n, float rim) {
  vec2 s = skin(n, 0.04);
  float milk = fbm(s * 1.1 + time * 0.04);
  vec3 tint = spectrum(0.1 + milk * 0.8 + rim * 0.55 + p.x * 0.15);
  vec3 c = mix(vec3(0.93, 0.9, 0.94), tint, 0.22 + 0.25 * rim);
  float lit = 0.5 + 0.55 * max(dot(n, normalize(vec3(-0.4, -0.65, 0.6))), 0.0);
  c = c * lit + spot(n, vec3(-0.45, -0.6, 0.65), 28.0) * 0.45 + 0.18 * rimPow(rim, 3.0);
  return half4(c * 0.95, 0.95);
}
half4 halo() { return half4(1.0, 0.88, 0.95, 0.1); }
`;
