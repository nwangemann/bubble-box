import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {
  CUSTOM,
  PATTERN_IDS,
  PATTERNS,
  wheel,
  type Custom,
  type CustomLook,
} from '@/config/custom';
import { feelPool, fxPools, NONE, tapPool, DEFAULTS } from '@/config/defaults';
import type { Environment } from '@/config/environments';
import { TUNING } from '@/config/tuning';
import { createStage, play, playToStill, type Part, type Stage } from '@/preview/scripts';
import { drawScene } from '@/scene/drawScene';
import { getGpu } from '@/scene/gpu';
import { Slider } from './Slider';

const M = TUNING.maker;

type Props = {
  custom: Custom;
  mine: CustomLook;
  env: Environment;
  /** Reduce Motion: the bubble is a still. */
  calm: boolean;
  onChange: (custom: Custom) => void;
  onClose: () => void;
};

/** One large bubble, with the colours and patterns that make it. */
export function Maker({ custom, mine, env, calm, onChange, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [gpu] = useState(getGpu);
  const size = Math.min(width * M.width, height * M.height);
  const view = { cx: size / 2, cy: size / 2, ppu: size / 2 };
  const part = useMemo<Part>(
    () => ({
      kind: 'bubble',
      box: { hw: 1, hh: 1, depth: TUNING.preview.depth, focal: TUNING.box.focal },
      styles: [CUSTOM],
      feels: feelPool(DEFAULTS.feel),
      taps: tapPool(DEFAULTS.tap),
      fx: fxPools(NONE, NONE),
      merges: [false],
      pulls: [],
      trails: [],
      bounce: 1,
      delay: 0,
    }),
    [],
  );
  const stage = useSharedValue<Stage | null>(null);
  const drawn = useSharedValue<CustomLook | null>(null);
  const picture = useSharedValue(createPicture(() => {}));

  useFrameCallback((frame) => {
    if (calm && drawn.value === mine) return;
    const s = stage.value === null || calm ? createStage(part) : stage.value;
    stage.value = s;
    drawn.value = calm ? mine : null;
    if (calm) playToStill(s, part);
    else play(s, part, (frame.timeSincePreviousFrame ?? 0) / 1000);
    picture.value = createPicture((canvas) => {
      'worklet';
      drawScene(
        canvas,
        gpu.bubblePaint,
        gpu.ripplePaint,
        gpu.burstPaint,
        gpu.fx,
        gpu.burstFx,
        s.world,
        part.box,
        view,
        env,
        [false],
        mine,
      );
    });
  });

  const colours = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const [r, g, b] = wheel(i / 6, custom.vivid).map((v) => Math.round(v * 255));
        return `rgb(${r},${g},${b})`;
      }),
    [custom.vivid],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      exiting={FadeOut.duration(250)}
      style={styles.veil}
      accessibilityViewIsModal
      onAccessibilityEscape={onClose}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
      <Canvas style={{ width: size, height: size }} pointerEvents="none">
        <Picture picture={picture} />
      </Canvas>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.names}
        accessibilityLabel="Pattern"
      >
        {PATTERN_IDS.map((id) => (
          <Pressable
            key={id}
            onPress={() => onChange({ ...custom, pattern: id })}
            accessibilityRole="button"
            accessibilityState={{ selected: id === custom.pattern }}
            style={styles.option}
          >
            <Text style={[styles.name, id === custom.pattern && styles.on]}>
              {PATTERNS[id].name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.sliders}>
        {(
          [
            ['colour', 'Colour', colours],
            ['second', 'Second', colours],
            ['vivid', 'Vivid', undefined],
            ['size', 'Size', undefined],
          ] as const
        ).map(([key, label, track]) => (
          <View key={key} style={styles.slider}>
            <Slider
              label={label}
              labelWidth={M.label}
              colours={track}
              value={custom[key]}
              onChange={(value) => onChange({ ...custom, [key]: value })}
            />
          </View>
        ))}
      </View>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Done"
        style={styles.handle}
      >
        <View style={styles.dot} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // The paused room stays faintly visible.
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5,8,20,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 66,
  },
  row: { flexGrow: 0, alignSelf: 'stretch', marginTop: 12 },
  names: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 12 },
  option: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  name: { color: 'rgba(255,255,255,0.68)', fontSize: 15, fontWeight: '300', letterSpacing: 0.3 },
  on: { color: '#fff', fontWeight: '500' },
  sliders: { alignSelf: 'stretch', paddingHorizontal: 28, marginTop: 4 },
  slider: { height: 44, flexDirection: 'row' },
  // Over the tray's own dot, so the same place closes both.
  handle: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    width: 64,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
});
