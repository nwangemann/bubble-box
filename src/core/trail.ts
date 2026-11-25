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

/** Where a bubble is now, as the next point of its trail. */
export function pointAt(b: Bubble, last: TrailPoint | undefined, focal: number, t: number) {
  'worklet';
  const moved = last ? Math.hypot(b.p.x - last.p.x, b.p.y - last.p.y, b.p.z - last.p.z) : 0;
  const point: TrailPoint = {
    p: { x: b.p.x, y: b.p.y, z: b.p.z },
    v: { x: b.v.x, y: b.v.y, z: b.v.z },
    side: sideOf(b.p, b.v, last ? last.side : null, focal),
    r: b.r,
    t,
    along: (last ? last.along : 0) + moved / Math.max(T.small, b.r),
  };
  return point;
}

/** Images every `gap` along a path, always in the same places as the path goes on. */
export function imagesOf(points: TrailPoint[], gap: number): TrailPoint[] {
  'worklet';
  const out: TrailPoint[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    for (let n = Math.floor(a.along / gap) + 1; n * gap <= b.along; n++) {
      const k = (n * gap - a.along) / (b.along - a.along);
      out.push({
        ...b,
        p: {
          x: a.p.x + (b.p.x - a.p.x) * k,
          y: a.p.y + (b.p.y - a.p.y) * k,
          z: a.p.z + (b.p.z - a.p.z) * k,
        },
        r: a.r + (b.r - a.r) * k,
        t: a.t + (b.t - a.t) * k,
        along: n * gap,
      });
    }
  }
  return out;
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
  trail.points.push(pointAt(b, last, focal, world.time));
  if (trail.points.length > T.maxPoints) trail.points.shift();
}

/** Lays down where bubbles have been, and lets what is old go. */
export function layTrails(world: World, focal: number) {
  'worklet';
  const { trailLooks, time } = world;
  if (trailLooks.length === 0 && world.trails.length === 0) return;
  for (const trail of world.trails) {
    // The last to go stays until the next has gone too, so the end fades rather than snaps.
    while (
      trail.points.length > 0 &&
      time - (trail.points[1] ?? trail.points[0]!).t > trail.look.seconds
    )
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
