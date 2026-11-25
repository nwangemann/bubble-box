import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { PixelRatio, StyleSheet, View as RNView, useWindowDimensions } from 'react-native';
import { GestureDetector, useManualGesture } from 'react-native-gesture-handler';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { CustomLook } from '@/config/custom';
import type { Environment } from '@/config/environments';
import type { Feel } from '@/config/feels';
import type { Glass } from '@/config/glass';
import type { Pull } from '@/config/pulls';
import type { Tap } from '@/config/taps';
import type { TrailLook } from '@/config/trails';
import { TUNING } from '@/config/tuning';
import { advanceHint, createHint, learnHint } from '@/core/hint';
import { lean, settleTilt } from '@/core/tilt';
import type { Box, FxPools, Vec3 } from '@/core/types';
import {
  advance,
  beginHold,
  beginSweep,
  createWorld,
  endSweep,
  feelOf,
  finishFlick,
  finishTap,
  heldBy,
  moveHold,
  popAll,
  release,
  sweepAlong,
  swipeOf,
  takePopped,
} from '@/core/world';
import { drawScene } from './drawScene';
import { throughGlass } from './glassFilter';
import { getGpu } from './gpu';
import { drawHint } from './hint';
import { roomPicture } from './roomPicture';
import { Tilt } from './Tilt';
import { drawWallLight } from './walls';

type Props = {
  /** Each list holds one entry, or every entry for Random. */
  styles: string[];
  mine: CustomLook;
  feels: Feel[];
  env: Environment;
  glasses: Glass[];
  taps: Tap[];
  fx: FxPools;
  /** Whether touching bubbles merge. */
  merges: boolean[];
  /** How bubbles draw each other; empty for not at all. */
  pulls: Pull[];
  /** What bubbles leave behind; empty for nothing. */
  trails: TrailLook[];
  /** Increment to pop everything. */
  popSignal: number;
  /** Holds everything still while something covers the room. */
  paused: boolean;
  /** Reduce Motion is on. */
  calm: boolean;
  /** Whether the first-time hint is still to come. */
  hints: boolean;
  /** Holds the hint back, while the menu is open. */
  hush: boolean;
  onHinted: () => void;
  onTouch: () => void;
};

const buzz = (strength: number) => {
  const s = Haptics.ImpactFeedbackStyle;
  Haptics.impactAsync(strength > 2 ? s.Medium : strength > 1 ? s.Light : s.Soft).catch(() => {});
};

/** A film giving way: crisp and dry, where a wall is round. */
const buzzPop = (radius: number) => {
  const felt =
    radius < TUNING.haptic.faint
      ? Haptics.selectionAsync()
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  felt.catch(() => {});
};

export function Scene({
  styles,
  mine,
  feels,
  env,
  glasses,
  taps,
  fx,
  merges,
  pulls,
  trails,
  popSignal,
  paused,
  calm,
  hints,
  hush,
  onHinted,
  onTouch,
}: Props) {
  const { width, height } = useWindowDimensions();
  const view = useMemo(() => ({ cx: width / 2, cy: height / 2, ppu: width / 2 }), [width, height]);
  const box = useMemo<Box>(() => ({ hw: 1, hh: height / width, ...TUNING.box }), [width, height]);
  const [gpu] = useState(getGpu);
  const room = useMemo(() => roomPicture(box, view, env), [box, view, env]);
  const density = PixelRatio.get();
  const bends = useMemo(() => glasses.map((g) => g.bend > 0), [glasses]);
  const bending = glasses.find((g) => g.bend > 0);

  const world = useSharedValue(createWorld(fx));
  const picture = useSharedValue(createPicture(() => {}));
  const quiet = useSharedValue(false);
  // Changed walls need one frame, even in an empty room.
  useEffect(() => quiet.set(false), [env, box, quiet]);
  // Water keeps moving while there is anything to move it, then settles.
  const stir = useSharedValue(0);
  const wallTime = useSharedValue(0);
  const hint = useSharedValue(createHint(!hints));
  const lastBuzz = useSharedValue(0);
  const gravity = useSharedValue<Vec3 | null>(null);
  const tilts = useMemo(() => feels.some((f) => f.tilt > 0), [feels]);

  useFrameCallback((frame) => {
    if (paused) return;
    const dt = (frame.timeSincePreviousFrame ?? 0) / 1000;
    const w = world.value;
    const empty =
      w.holds.length === 0 &&
      w.bubbles.length === 0 &&
      w.ripples.length === 0 &&
      w.waves.length === 0 &&
      w.trails.length === 0 &&
      w.bursts.length === 0;
    if (advanceHint(hint.value, w, box, !hush, dt)) scheduleOnRN(onHinted);
    const wet = env.wall === 'water';
    stir.value += ((empty ? 0 : 1) - stir.value) * (1 - Math.exp(-dt / TUNING.walls.settle));
    const still = empty && hint.value.age < 0 && (!wet || stir.value < 0.02);
    // An empty room costs nothing, after one last frame to clear it.
    if (still && quiet.value) return;
    quiet.value = still;
    wallTime.value += dt * stir.value;
    w.fx = fx;
    w.merges = merges;
    w.pulls = pulls;
    w.trailLooks = trails;
    if (empty) settleTilt(w);
    else lean(w, gravity.value, dt);
    advance(w, box, feels, env.bounce, dt);
    if (w.time - lastBuzz.value > TUNING.haptic.gap) {
      // A pop outranks a wall, and one that comes too soon waits its turn.
      const popped = takePopped(w);
      if (popped > 0 || w.impact > TUNING.hapticMinImpact) {
        lastBuzz.value = w.time;
        if (popped > 0) scheduleOnRN(buzzPop, popped);
        else scheduleOnRN(buzz, w.impact);
      }
    }
    picture.value = createPicture((canvas) => {
      'worklet';
      const effect = bending ? gpu.glassEffect : null;
      const waves = w.waves.filter((v) => bends[Math.floor(v.variant * bends.length)]);
      const scene = () => {
        'worklet';
        drawWallLight(
          canvas,
          gpu.lightPaint,
          gpu.walls.light,
          w,
          box,
          view,
          env,
          wallTime.value,
          mine,
        );
        drawScene(
          canvas,
          gpu.bubblePaint,
          gpu.ripplePaint,
          gpu.burstPaint,
          gpu.fx,
          gpu.burstFx,
          w,
          box,
          view,
          env,
          bends,
          mine,
          gpu.trails,
        );
      };
      // The full-screen pass runs only while a wave is alive, and bends the room too.
      if (effect && bending && waves.length > 0) {
        throughGlass(canvas, gpu.glassPaint, effect, waves, bending, view, density, () => {
          'worklet';
          canvas.drawPicture(room);
          scene();
        });
      } else scene();
      drawHint(canvas, gpu.hintPaint, gpu.hintEffect, hint.value, view, env.ink, calm);
    });
  });

  useEffect(() => {
    if (popSignal === 0) return;
    world.modify((w) => {
      'worklet';
      popAll(w);
      return w;
    }, false);
  }, [popSignal, world]);

  /** Fingers that are sweeping, and where each was last. */
  const sweepers = useSharedValue<Record<number, { x: number; y: number }>>({});
  const letGo = (finger: number, swiped: boolean) => {
    'worklet';
    const w = world.value;
    if (finishTap(w, finger)) return;
    const h = heldBy(w, finger);
    if (!h) return;
    if (swiped && finishFlick(w, box, feels, finger)) {
      scheduleOnRN(buzz, 0.5);
      return;
    }
    const v = swiped ? swipeOf(h) : { x: 0, y: 0 };
    release(w, v.x, v.y, feelOf(h.bubble, feels).speed, finger);
  };
  // A touch the system cancels still lets its bubble go, straight ahead.
  const letAllGo = () => {
    'worklet';
    for (const h of [...world.value.holds]) letGo(h.finger, false);
    sweepers.value = {};
    endSweep(world.value);
  };
  const touch = useManualGesture({
    shouldCancelWhenOutside: false,
    onTouchesDown: (e) => {
      'worklet';
      for (const t of e.changedTouches) {
        const x = (t.x - view.cx) / view.ppu;
        const y = (t.y - view.cy) / view.ppu;
        if (world.value.sweep) {
          sweepers.value = { ...sweepers.value, [t.id]: { x, y } };
          continue;
        }
        beginHold(
          world.value,
          box,
          x,
          y,
          styles[Math.floor(Math.random() * styles.length)]!,
          taps[Math.floor(Math.random() * taps.length)]!.pops,
          t.id,
        );
        scheduleOnRN(onTouch);
      }
    },
    onTouchesMove: (e) => {
      'worklet';
      const w = world.value;
      const at = { ...sweepers.value };
      let popped = 0;
      for (const t of e.changedTouches) {
        const x = (t.x - view.cx) / view.ppu;
        const y = (t.y - view.cy) / view.ppu;
        const from = at[t.id];
        if (from) {
          popped += sweepAlong(w, box, from.x, from.y, x, y);
          at[t.id] = { x, y };
        } else moveHold(w, x, y, t.id);
      }
      // Fingers that turn out to be sweeping also pop what they have crossed already.
      for (const h of beginSweep(w)) {
        popped += sweepAlong(w, box, h.start.x, h.start.y, h.target.x, h.target.y);
        at[h.finger] = { x: h.target.x, y: h.target.y };
      }
      sweepers.value = at;
      if (popped > 0 && learnHint(hint.value)) scheduleOnRN(onHinted);
    },
    onTouchesUp: (e) => {
      'worklet';
      const at = { ...sweepers.value };
      for (const t of e.changedTouches) {
        letGo(t.id, true);
        delete at[t.id];
      }
      sweepers.value = at;
      if (Object.keys(at).length === 0) endSweep(world.value);
    },
    onTouchesCancel: letAllGo,
    onFinalize: letAllGo,
  });

  return (
    <RNView style={StyleSheet.absoluteFill}>
      {tilts && !paused && <Tilt gravity={gravity} />}
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={room} />
      </Canvas>
      <GestureDetector gesture={touch}>
        <RNView style={StyleSheet.absoluteFill} collapsable={false}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Picture picture={picture} />
          </Canvas>
        </RNView>
      </GestureDetector>
    </RNView>
  );
}
