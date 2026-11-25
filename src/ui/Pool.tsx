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
import {
  advancePool,
  createPool,
  enter,
  fitCue,
  retire,
  stillTable,
  traceAhead,
} from '@/core/pool';
import { beginShot, createGame, endShot, judge } from '@/core/poolGame';
import { createRowTurn, followGame, poolRow } from '@/core/poolRow';
import type { Box } from '@/core/types';
import { advance, beginHold, createWorld, heldBy, moveHold, release, swipeOf } from '@/core/world';
import { drawPool, getPoolGpu, poolRoom } from '@/scene/drawPool';
import { Tray } from './Tray';

const buzz = (strength: number) => {
  const s = Haptics.ImpactFeedbackStyle;
  Haptics.impactAsync(strength > 3 ? s.Medium : strength > 1 ? s.Light : s.Soft).catch(() => {});
};
/** A ball falls into a pocket: the firmest thing in the game. */
const drop = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
};
/** It settles into its place in the row. */
const land = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
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
  /** Reduce Motion: no trails, and calmer pots. */
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
  const row = useMemo(() => poolRow(width), [width]);
  const [gpu] = useState(getPoolGpu);
  const [start] = useState(() => createPool(box));
  const pool = useSharedValue(start);
  // Only what is in the hand: the calm room's holding and launching, at one size.
  const hand = useSharedValue(steadyHand());
  const picture = useSharedValue(createPicture(() => {}));
  const dirty = useSharedValue(true);
  const lastBuzz = useSharedValue(0);
  const finger = useSharedValue(-1);
  // Whose turn, and the shot out.
  const game = useSharedValue(createGame());
  // Whose turn and whose groups, as the row shows them.
  const turn = useSharedValue(createRowTurn());
  // A finger down while balls roll, and where it is: its cue ball comes once all have stopped.
  const waiting = useSharedValue(-1);
  const waitAt = useSharedValue({ x: 0, y: 0 });
  const leaving = calm ? 0 : trailing(settings.trail);
  const trails = useSharedValue(leaving);
  useEffect(() => trails.set(leaving), [trails, leaving]);
  const still = useSharedValue(calm);
  useEffect(() => still.set(calm), [still, calm]);

  /** A cue ball into the hand at a place in box units. */
  const hold = (x: number, y: number, id: number) => {
    'worklet';
    // One cue ball at a time: a new one lets the last go.
    retire(pool.value);
    beginHold(hand.value, box, x, y, 'glass', false, id);
    finger.value = id;
    dirty.value = true;
  };

  useFrameCallback((frame) => {
    const p = pool.value;
    const w = hand.value;
    const dt = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, TUNING.maxFrame);
    p.trailing = trails.value;
    p.calm = still.value;
    const moved = advancePool(p, box, dt);
    const g = game.value;
    if (g.shooting && stillTable(p, box)) {
      endShot(g, judge(g, p));
      if (waiting.value !== -1) {
        hold(waitAt.value.x, waitAt.value.y, waiting.value);
        waiting.value = -1;
      }
    }
    const shown = followGame(turn.value, g, dt, p.calm);
    const h = w.holds[0];
    const heldFor = h ? h.seconds : 0;
    if (h) advance(w, box, HANDS, 1, dt);
    // From here the finger places the shot rather than swipes it.
    const { place, ease, swipe } = POOL.aim;
    if (h && heldFor < place && h.seconds >= place) scheduleOnRN(tick);
    // A still table draws nothing.
    if (!moved && !shown && !h && !dirty.value) return;
    dirty.value = moved || shown || !!h;
    if (p.potted > 0) scheduleOnRN(drop);
    else if (p.landed > 0) scheduleOnRN(land);
    else if (p.knock > POOL.hapticLeast && p.time - lastBuzz.value > POOL.hapticGap) {
      lastBuzz.value = p.time;
      scheduleOnRN(buzz, p.knock);
    }
    p.potted = 0;
    p.landed = 0;
    p.knock = 0;
    let sure = 0;
    if (h) {
      const s = swipeOf(h);
      const placing = Math.min(1, Math.max(0, (h.seconds - place) / ease));
      sure = Math.max(placing, 1 - Math.hypot(s.x, s.y) / swipe);
    }
    // Where it would start: clear of any ball resting against the glass.
    const held = h ? { ...h.bubble, p: fitCue(p, box, h.bubble.p, h.bubble.r) } : null;
    const trace = held && sure > 0 ? traceAhead(p, box, held.p, held.r) : null;
    const grown = h ? Math.min(1, h.seconds / POOL.cue.appear) : 0;
    picture.value = createPicture((canvas) => {
      'worklet';
      drawPool(canvas, gpu, p, held, grown, trace, sure, row, turn.value, box, view);
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
    if (bubble) {
      enter(pool.value, box, bubble);
      beginShot(game.value, pool.value);
    }
    finger.set(-1);
    dirty.set(true);
  };
  const cancel = () => {
    'worklet';
    waiting.set(-1);
    launch(false);
  };
  const touch = useManualGesture({
    shouldCancelWhenOutside: false,
    onTouchesDown: (e) => {
      'worklet';
      const t = e.changedTouches[0];
      if (!t || finger.value !== -1 || waiting.value !== -1) return;
      const x = (t.x - view.cx) / view.ppu;
      const y = (t.y - view.cy) / view.ppu;
      // A shot waits for a still table.
      if (game.value.shooting) {
        waiting.set(t.id);
        waitAt.set({ x, y });
      } else hold(x, y, t.id);
    },
    onTouchesMove: (e) => {
      'worklet';
      for (const t of e.changedTouches) {
        const x = (t.x - view.cx) / view.ppu;
        const y = (t.y - view.cy) / view.ppu;
        if (t.id === finger.value) moveHold(hand.value, x, y, t.id);
        else if (t.id === waiting.value) waitAt.set({ x, y });
      }
    },
    onTouchesUp: (e) => {
      'worklet';
      if (e.changedTouches.some((t) => t.id === waiting.value)) waiting.set(-1);
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
