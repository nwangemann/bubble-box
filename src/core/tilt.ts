import { TUNING as T } from '../config/tuning';
import type { Vec3, World } from './types';

/**
 * Turns the way gravity points, in box axes (x right, y down, z away), into a pull on bubbles.
 * Only a change from how the phone rests in the hand pulls, and that rest slowly follows the hand.
 * `gravity` is null when there is no sensor.
 */
export function lean(world: World, gravity: Vec3 | null, dt: number) {
  'worklet';
  const G = T.tilt;
  const { pull } = world.tilt;
  const size = gravity ? Math.hypot(gravity.x, gravity.y, gravity.z) : 0;
  const ease = 1 - Math.exp(-dt / G.ease);
  let k = 0;
  let dx = 0;
  let dy = 0;
  let dz = 0;
  if (gravity && size > 1e-3) {
    const x = gravity.x / size;
    const y = gravity.y / size;
    const z = gravity.z / size;
    const rest = world.tilt.rest ?? { x, y, z };
    dx = x - rest.x;
    dy = y - rest.y;
    dz = z - rest.z;
    const away = Math.hypot(dx, dy, dz);
    if (away > G.slop) k = (Math.min(1, (away - G.slop) / (G.full - G.slop)) * G.pull) / away;
    const follow = 1 - Math.exp(-dt / G.settle);
    world.tilt.rest = {
      x: rest.x + dx * follow,
      y: rest.y + dy * follow,
      z: rest.z + dz * follow,
    };
  } else world.tilt.rest = null;
  pull.x += (dx * k - pull.x) * ease;
  pull.y += (dy * k - pull.y) * ease;
  pull.z += (dz * k - pull.z) * ease;
}

/** Forgets the tilt, so the next bubble starts with the phone at rest. */
export function settleTilt(world: World) {
  'worklet';
  world.tilt.rest = null;
  world.tilt.pull = { x: 0, y: 0, z: 0 };
}
