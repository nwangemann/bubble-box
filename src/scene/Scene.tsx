import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { PixelRatio, StyleSheet, View as RNView, useWindowDimensions } from 'react-native';
import {
  GestureDetector,
  useManualGesture,
  usePanGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Environment } from '@/config/environments';
import type { Feel } from '@/config/feels';
import type { Glass } from '@/config/glass';
import type { Tap } from '@/config/taps';
import { TUNING } from '@/config/tuning';
import type { Box, FxPools } from '@/core/types';
import {
  advance,
  beginHold,
  beginSweep,
  createWorld,
  endSweep,
  feelOf,
  finishTap,
  moveHold,
  popAll,
  release,
  sweepAlong,
} from '@/core/world';
import { drawScene } from './drawScene';
import { throughGlass } from './glassFilter';
import { getGpu } from './gpu';
import { roomPicture } from './roomPicture';

type Props = {
  /** Each list holds one entry, or every entry for Random. */
  styles: string[];
  feels: Feel[];
  env: Environment;
  glasses: Glass[];
  taps: Tap[];
  fx: FxPools;
  /** Increment to pop everything. */
  popSignal: number;
  /** Holds everything still while something covers the room. */
  paused: boolean;
  onTouch: () => void;
};

const buzz = (strength: number) => {
  const s = Haptics.ImpactFeedbackStyle;
  Haptics.impactAsync(strength > 2 ? s.Medium : strength > 1 ? s.Light : s.Soft).catch(() => {});
};

export function Scene({
  styles,
  feels,
  env,
  glasses,
  taps,
  fx,
  popSignal,
  paused,
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
  const quiet = useSharedValue(true);
  const lastBuzz = useSharedValue(0);

  useFrameCallback((frame) => {
    if (paused) return;
    const dt = (frame.timeSincePreviousFrame ?? 0) / 1000;
    const w = world.value;
    const empty =
      !w.held &&
      w.bubbles.length === 0 &&
      w.ripples.length === 0 &&
      w.waves.length === 0 &&
      w.bursts.length === 0;
    // An empty room costs nothing, after one last frame to clear it.
    if (empty && quiet.value) return;
    quiet.value = empty;
    w.fx = fx;
    advance(w, box, feels, env.bounce, dt);
    if (w.impact > TUNING.hapticMinImpact && w.time - lastBuzz.value > 0.06) {
      lastBuzz.value = w.time;
      scheduleOnRN(buzz, w.impact);
    }
    picture.value = createPicture((canvas) => {
      'worklet';
      const effect = bending ? gpu.glassEffect : null;
      const waves = w.waves.filter((v) => bends[Math.floor(v.variant * bends.length)]);
      const scene = () => {
        'worklet';
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

  const pan = usePanGesture({
    minDistance: 0,
    maxPointers: 1,
    shouldCancelWhenOutside: false,
    onBegin: (e) => {
      'worklet';
      if (world.value.sweep) return;
      beginHold(
        world.value,
        box,
        (e.x - view.cx) / view.ppu,
        (e.y - view.cy) / view.ppu,
        styles[Math.floor(Math.random() * styles.length)]!,
        taps[Math.floor(Math.random() * taps.length)]!.pops,
      );
      scheduleOnRN(onTouch);
    },
    onUpdate: (e) => {
      'worklet';
      moveHold(world.value, (e.x - view.cx) / view.ppu, (e.y - view.cy) / view.ppu);
    },
    onDeactivate: (e) => {
      'worklet';
      if (finishTap(world.value)) return;
      const h = world.value.held;
      if (h)
        release(
          world.value,
          e.velocityX / view.ppu,
          e.velocityY / view.ppu,
          feelOf(h.bubble, feels).speed,
        );
    },
    // A touch the system cancels still lets its bubble go, straight ahead.
    onFinalize: () => {
      'worklet';
      if (finishTap(world.value)) return;
      const h = world.value.held;
      if (h) release(world.value, 0, 0, feelOf(h.bubble, feels).speed);
    },
  });

  const fingers = useSharedValue<Record<number, { x: number; y: number }>>({});
  const sweep = useManualGesture({
    shouldCancelWhenOutside: false,
    onTouchesDown: (e) => {
      'worklet';
      const at: Record<number, { x: number; y: number }> = {};
      for (const t of e.allTouches) at[t.id] = { x: t.x, y: t.y };
      fingers.value = at;
      if (e.numberOfTouches >= 2) beginSweep(world.value);
    },
    onTouchesMove: (e) => {
      'worklet';
      if (!world.value.sweep) return;
      const at: Record<number, { x: number; y: number }> = { ...fingers.value };
      let popped = 0;
      for (const t of e.changedTouches) {
        const from = at[t.id] ?? t;
        popped += sweepAlong(
          world.value,
          box,
          (from.x - view.cx) / view.ppu,
          (from.y - view.cy) / view.ppu,
          (t.x - view.cx) / view.ppu,
          (t.y - view.cy) / view.ppu,
        );
        at[t.id] = { x: t.x, y: t.y };
      }
      fingers.value = at;
      if (popped > 0) scheduleOnRN(buzz, 0.5);
    },
    onTouchesUp: (e) => {
      'worklet';
      if (e.numberOfTouches === 0) endSweep(world.value);
    },
    onFinalize: () => {
      'worklet';
      endSweep(world.value);
    },
  });
  const touch = useSimultaneousGestures(pan, sweep);

  return (
    <RNView style={StyleSheet.absoluteFill}>
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
