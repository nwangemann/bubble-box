import type { TrailLook } from '../config/trails';
import { TUNING } from '../config/tuning';
import type { Bubble, Trail, TrailPoint, Vec3, World } from './types';

const T = TUNING.trail;

/** The trail a bubble leaves. With several in play each bubble keeps one for life. */
export function trailOf(b: Bubble, looks: TrailLook[]) {
  'worklet';
  return looks[Math.floor(((b.id * 0.56984) % 1) * looks.length)];
}

/**
 * Which way a ribbon lies across its path: facing the eye, easing from how it lay before. It never
 * flips, so a bounce folds it rather than twisting it, and flying straight away leaves it as it was.
 */
export function sideOf(p: Vec3, v: Vec3, before: Vec3 | null, focal: number): Vec3 {
  'worklet';
  const ex = p.x;
  const ey = p.y;
  const ez = p.z + focal;
  const long = Math.hypot(ex, ey, ez) * Math.hypot(v.x, v.y, v.z);
  let x = 0;
  let y = 0;
  let z = 0;
  if (long > 1e-6) {
    x = (v.y * ez - v.z * ey) / long;
    y = (v.z * ex - v.x * ez) / long;
    z = (v.x * ey - v.y * ex) / long;
  }
  if (before) {
    const way = x * before.x + y * before.y + z * before.z < 0 ? -1 : 1;
    x = before.x * T.hold + x * way;
    y = before.y * T.hold + y * way;
    z = before.z * T.hold + z * way;
  }
  const l = Math.hypot(x, y, z);
  if (l < 1e-4) return before ?? { x: 1, y: 0, z: 0 };
  return { x: x / l, y: y / l, z: z / l };
}

function lay(world: World, trail: Trail, b: Bubble, focal: number) {
  'worklet';
  const last: TrailPoint | undefined = trail.points[trail.points.length - 1];
  const speed = Math.hypot(b.v.x, b.v.y, b.v.z);
  if (last) {
    const moved = Math.hypot(b.p.x - last.p.x, b.p.y - last.p.y, b.p.z - last.p.z);
    if (moved < T.least) return;
    const was = Math.hypot(last.v.x, last.v.y, last.v.z);
    const along = b.v.x * last.v.x + b.v.y * last.v.y + b.v.z * last.v.z;
    const turned = along < T.corner * speed * was;
    // Corners are kept exactly; straights need fewer points.
    if (!turned && (moved < T.spacing || world.time - last.t < T.interval)) return;
  }
  trail.points.push({
    p: { x: b.p.x, y: b.p.y, z: b.p.z },
    v: { x: b.v.x, y: b.v.y, z: b.v.z },
    side: sideOf(b.p, b.v, last ? last.side : null, focal),
    r: b.r,
    t: world.time,
  });
  if (trail.points.length > T.maxPoints) trail.points.shift();
}

/** Lays down where bubbles have been, and lets what is old go. */
export function layTrails(world: World, focal: number) {
  'worklet';
  const { trailLooks, time } = world;
  if (trailLooks.length === 0 && world.trails.length === 0) return;
  for (const trail of world.trails) {
    while (trail.points.length > 0 && time - trail.points[0]!.t > trail.look.seconds)
      trail.points.shift();
  }
  const laid: Trail[] = [];
  for (const b of world.bubbles) {
    if (b.popping >= 0 || b.join) continue;
    const look = trailOf(b, trailLooks);
    if (!look) continue;
    let trail = world.trails.find((o) => o.bubble === b.id && o.look.id === look.id);
    if (!trail) {
      trail = { bubble: b.id, look, seed: b.seed, style: b.style, born: time, points: [] };
      world.trails.push(trail);
    }
    lay(world, trail, b, focal);
    laid.push(trail);
  }
  // One left behind fades where it hangs.
  world.trails = world.trails.filter((o) => o.points.length > 0 || laid.includes(o));
}
