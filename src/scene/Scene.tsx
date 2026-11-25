import { Canvas, createPicture, Picture, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { PixelRatio, StyleSheet, View as RNView, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Environment } from '@/config/environments';
import type { Feel } from '@/config/feels';
import type { Glass } from '@/config/glass';
import { TUNING } from '@/config/tuning';
import type { Box } from '@/core/types';
import {
  advance,
  beginHold,
  createWorld,
  finishTap,
  moveHold,
  popAll,
  release,
} from '@/core/world';
import { drawScene } from './drawScene';
import { compileEffects } from './effects';
import { compileGlass, throughGlass } from './glassFilter';
import { roomPicture } from './roomPicture';

type Props = {
  style: string;
  feel: Feel;
  env: Environment;
  glass: Glass;
  /** Whether a quick tap on a bubble pops it. */
  tapPops: boolean;
  /** Increment to pop everything. */
  popSignal: number;
  onTouch: () => void;
};

const buzz = (strength: number) => {
  const s = Haptics.ImpactFeedbackStyle;
  Haptics.impactAsync(strength > 2 ? s.Medium : strength > 1 ? s.Light : s.Soft).catch(() => {});
};

export function Scene({ style, feel, env, glass, tapPops, popSignal, onTouch }: Props) {
  const { width, height } = useWindowDimensions();
  const view = useMemo(() => ({ cx: width / 2, cy: height / 2, ppu: width / 2 }), [width, height]);
  const box = useMemo<Box>(() => ({ hw: 1, hh: height / width, ...TUNING.box }), [width, height]);
  const [gpu] = useState(() => {
    const bubblePaint = Skia.Paint();
    const ripplePaint = Skia.Paint();
    ripplePaint.setAntiAlias(true);
    return {
      fx: compileEffects(),
      glassEffect: compileGlass(),
      glassPaint: Skia.Paint(),
      bubblePaint,
      ripplePaint,
    };
  });
  const room = useMemo(() => roomPicture(box, view, env), [box, view, env]);
  const density = PixelRatio.get();

  const world = useSharedValue(createWorld());
  const picture = useSharedValue(createPicture(() => {}));
  const quiet = useSharedValue(true);
  const lastBuzz = useSharedValue(0);

  useFrameCallback((frame) => {
    const dt = (frame.timeSincePreviousFrame ?? 0) / 1000;
    const w = world.value;
    const empty =
      !w.held && w.bubbles.length === 0 && w.ripples.length === 0 && w.waves.length === 0;
    // An empty room costs nothing, after one last frame to clear it.
    if (empty && quiet.value) return;
    quiet.value = empty;
    advance(w, box, feel, env.bounce, dt);
    if (w.impact > TUNING.hapticMinImpact && w.time - lastBuzz.value > 0.06) {
      lastBuzz.value = w.time;
      scheduleOnRN(buzz, w.impact);
    }
    picture.value = createPicture((canvas) => {
      'worklet';
      const effect = glass.bend > 0 ? gpu.glassEffect : null;
      const scene = () => {
        'worklet';
        drawScene(canvas, gpu.bubblePaint, gpu.ripplePaint, gpu.fx, w, box, view, env, !!effect);
      };
      // The full-screen pass runs only while a wave is alive, and bends the room too.
      if (effect && w.waves.length > 0) {
        throughGlass(canvas, gpu.glassPaint, effect, w.waves, glass, view, density, () => {
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
      beginHold(
        world.value,
        box,
        (e.x - view.cx) / view.ppu,
        (e.y - view.cy) / view.ppu,
        style,
        tapPops,
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
      release(world.value, e.velocityX / view.ppu, e.velocityY / view.ppu, feel.speed);
    },
    // A touch the system cancels still lets its bubble go, straight ahead.
    onFinalize: () => {
      'worklet';
      if (finishTap(world.value)) return;
      release(world.value, 0, 0, feel.speed);
    },
  });

  return (
    <RNView style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={room} />
      </Canvas>
      <GestureDetector gesture={pan}>
        <RNView style={StyleSheet.absoluteFill} collapsable={false}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Picture picture={picture} />
          </Canvas>
        </RNView>
      </GestureDetector>
    </RNView>
  );
}
