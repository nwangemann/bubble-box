import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, useManualGesture } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { POOL } from '@/config/pool';
import { TUNING } from '@/config/tuning';
import { FEELS } from '@/config/feels';
import { advancePool, createPool, enter, retire, traceAhead } from '@/core/pool';
import type { Box } from '@/core/types';
import { advance, beginHold, createWorld, heldBy, moveHold, release, swipeOf } from '@/core/world';
import { drawPool, getPoolGpu, poolRoom } from '@/scene/drawPool';

const buzz = (strength: number) => {
  const s = Haptics.ImpactFeedbackStyle;
  Haptics.impactAsync(strength > 3 ? s.Medium : strength > 1 ? s.Light : s.Soft).catch(() => {});
};
const cheer = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

const steadyHand = () => {
  const hand = createWorld();
  hand.steady = { r: POOL.radius, charge: POOL.cue.charge };
  return hand;
};
const tick = () => {
  Haptics.selectionAsync().catch(() => {});
};

const HANDS = [FEELS.weightless];

/** The 8-ball trial (docs/pool.md). Opened with the mode switch. */
export function Pool({ onLeave }: { onLeave: () => void }) {
  const { width, height } = useWindowDimensions();
  // The calm room's own box and view.
  const view = useMemo(() => ({ cx: width / 2, cy: height / 2, ppu: width / 2 }), [width, height]);
  const box = useMemo<Box>(() => ({ hw: 1, hh: height / width, ...TUNING.box }), [width, height]);
  const room = useMemo(() => poolRoom(box, view), [box, view]);
  const [gpu] = useState(getPoolGpu);
  const [start] = useState(() => createPool(box));
  const pool = useSharedValue(start);
  // Only what is in the hand: the calm room's holding and launching, at one size.
  const hand = useSharedValue(steadyHand());
  const picture = useSharedValue(createPicture(() => {}));
  const dirty = useSharedValue(true);
  const lastBuzz = useSharedValue(0);
  const finger = useSharedValue(-1);

  useFrameCallback((frame) => {
    const p = pool.value;
    const w = hand.value;
    const dt = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, TUNING.maxFrame);
    const moved = advancePool(p, box, dt);
    const h = w.holds[0];
    const heldFor = h ? h.seconds : 0;
    if (h) advance(w, box, HANDS, 1, dt);
    // From here the finger places the shot rather than swipes it.
    const { place, ease, swipe } = POOL.aim;
    if (h && heldFor < place && h.seconds >= place) scheduleOnRN(tick);
    // A still table draws nothing.
    if (!moved && !h && !dirty.value) return;
    dirty.value = moved || !!h;
    if (p.potted > 0) scheduleOnRN(cheer);
    else if (p.knock > POOL.hapticLeast && p.time - lastBuzz.value > POOL.hapticGap) {
      lastBuzz.value = p.time;
      scheduleOnRN(buzz, p.knock);
    }
    p.potted = 0;
    p.knock = 0;
    let sure = 0;
    if (h) {
      const s = swipeOf(h);
      const placing = Math.min(1, Math.max(0, (h.seconds - place) / ease));
      sure = Math.max(placing, 1 - Math.hypot(s.x, s.y) / swipe);
    }
    const trace = h && sure > 0 ? traceAhead(p, box, { ...h.bubble.p }, h.bubble.r) : null;
    const grown = h ? Math.min(1, h.seconds / POOL.cue.appear) : 0;
    picture.value = createPicture((canvas) => {
      'worklet';
      drawPool(canvas, gpu, p, h ? h.bubble : null, grown, trace, sure, box, view);
    });
  });

  const launch = (swiped: boolean) => {
    'worklet';
    const w = hand.value;
    const h = heldBy(w, finger.value);
    if (!h) return;
    const v = swiped && h.seconds < POOL.aim.place ? swipeOf(h) : { x: 0, y: 0 };
    release(w, v.x, v.y, POOL.cue.speed, finger.value);
    const bubble = w.bubbles.pop();
    if (bubble) enter(pool.value, bubble);
    finger.set(-1);
    dirty.set(true);
  };
  const cancel = () => {
    'worklet';
    launch(false);
  };
  const touch = useManualGesture({
    shouldCancelWhenOutside: false,
    onTouchesDown: (e) => {
      'worklet';
      const t = e.changedTouches[0];
      if (!t || finger.value !== -1) return;
      // One cue ball at a time: a new one lets the last go.
      retire(pool.value);
      const x = (t.x - view.cx) / view.ppu;
      const y = (t.y - view.cy) / view.ppu;
      beginHold(hand.value, box, x, y, 'glass', false, t.id);
      finger.set(t.id);
    },
    onTouchesMove: (e) => {
      'worklet';
      for (const t of e.changedTouches)
        if (t.id === finger.value)
          moveHold(hand.value, (t.x - view.cx) / view.ppu, (t.y - view.cy) / view.ppu, t.id);
    },
    onTouchesUp: (e) => {
      'worklet';
      if (e.changedTouches.some((t) => t.id === finger.value)) launch(true);
    },
    onTouchesCancel: cancel,
    onFinalize: cancel,
  });

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      exiting={FadeOut.duration(250)}
      style={styles.wrap}
      accessibilityViewIsModal
      onAccessibilityEscape={onLeave}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={room} />
      </Canvas>
      <GestureDetector gesture={touch}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Picture picture={picture} />
          </Canvas>
        </View>
      </GestureDetector>
      <Pressable
        onPress={onLeave}
        accessibilityRole="button"
        accessibilityLabel="Leave the table"
        style={styles.handle}
      >
        <View style={styles.dot} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: '#070a18' },
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
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#fff',
    boxShadow: '0 0 5px rgba(5,8,20,0.9)',
  },
});
