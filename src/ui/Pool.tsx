import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, useManualGesture } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Mode } from '@/config/modes';
import { POOL } from '@/config/pool';
import { POOL_ROWS, stepPool, trailing, type PoolSettings } from '@/config/poolOptions';
import { TUNING } from '@/config/tuning';
import { FEELS } from '@/config/feels';
import { advancePool, createPool, enter, retire, traceAhead } from '@/core/pool';
import type { Box } from '@/core/types';
import { advance, beginHold, createWorld, heldBy, moveHold, release, swipeOf } from '@/core/world';
import { drawPool, getPoolGpu, poolRoom } from '@/scene/drawPool';
import { Tray } from './Tray';

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

type Props = {
  settings: PoolSettings;
  /** Reduce Motion: no trails. */
  calm: boolean;
  onSettings: (settings: PoolSettings) => void;
  /** To the calm room's menu, or to showdowns. */
  onMode: (mode: Mode) => void;
};

/** The 8-ball trial (docs/pool.md). Opened and left with the mode switch. */
export function Pool({ settings, calm, onSettings, onMode }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
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
  const leaving = calm ? 0 : trailing(settings.trail);
  const trails = useSharedValue(leaving);
  useEffect(() => trails.set(leaving), [trails, leaving]);

  useFrameCallback((frame) => {
    const p = pool.value;
    const w = hand.value;
    const dt = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, TUNING.maxFrame);
    p.trailing = trails.value;
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
      onAccessibilityEscape={() => (open ? close() : onMode('calm'))}
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
      {/* Over the table, so a touch that closes the menu does not also play. */}
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={close} accessible={false} />}
      <Tray
        mode="pool"
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onMode={onMode}
        hint="Changes to the next option"
        onTile={(key) =>
          onSettings(
            stepPool(
              POOL_ROWS.find((r) => r.key === key)!,
              settings,
            ),
          )
        }
        tiles={POOL_ROWS.map(({ key, label, options }) => ({
          key,
          label,
          value: options.find((o) => o.id === settings[key])!.name,
        }))}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: '#070a18' },
});
