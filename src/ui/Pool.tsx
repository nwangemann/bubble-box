import { Canvas, createPicture, Path, Picture, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureDetector, useManualGesture } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { Mode } from '@/config/modes';
import { POOL } from '@/config/pool';
import { nextSound, SOUND_CHOICE, soundName, type SoundChoice } from '@/config/sound';
import {
  computerPlays,
  cueAim,
  POOL_ROWS,
  stepPool,
  tableOf,
  trailing,
  type PoolSettings,
} from '@/config/poolOptions';
import { TUNING } from '@/config/tuning';
import { FEELS } from '@/config/feels';
import {
  advancePool,
  clearTable,
  createPool,
  enter,
  fitCue,
  retire,
  rollOf,
  spotBall,
  stillTable,
  traceAhead,
  newestPot,
} from '@/core/pool';
import {
  beginShot,
  createGame,
  downOf,
  EIGHT,
  endShot,
  judge,
  nextGame,
  onEight,
  weigh,
} from '@/core/poolGame';
import { createOpponent, opponentTurn, restOpponent } from '@/core/opponent';
import { createRowTurn, followGame, poolRow, potEnds } from '@/core/poolRow';
import type { Box, Held } from '@/core/types';
import { advance, beginHold, createWorld, heldBy, moveHold, release, swipeOf } from '@/core/world';
import { drawPool, getPoolGpu, poolRoom } from '@/scene/drawPool';
import { soundPot } from '@/services/tones';
import { Tray } from './Tray';

const SOUND_KEY = 'sound';

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

/** The finger is moving fast enough for a flick that says draw or follow. */
const flicked = (h: Held) => {
  'worklet';
  const s = swipeOf(h);
  return Math.hypot(s.x, s.y) >= POOL.roll.least;
};
/** The hold that is the computer's, as no finger's id is. */
const COMPUTER = -2;

/** Round again: an arc of the room's ink with its head, for play again. */
const AGAIN = (() => {
  const c = 20;
  const r = 9;
  const path = Skia.PathBuilder.Make();
  path.addArc({ x: c - r, y: c - r, width: 2 * r, height: 2 * r }, -60, 300);
  // The head, at the arc's end, pointing on round (clockwise on screen).
  const end = ((-60 + 300) * Math.PI) / 180;
  const x = c + r * Math.cos(end);
  const y = c + r * Math.sin(end);
  const on = Math.atan2(Math.cos(end), -Math.sin(end));
  const barb = (turn: number) => ({
    x: x - 5 * Math.cos(on + turn),
    y: y - 5 * Math.sin(on + turn),
  });
  const [p1, p2] = [barb(0.6), barb(-0.6)];
  path.moveTo(p1.x, p1.y);
  path.lineTo(x, y);
  path.lineTo(p2.x, p2.y);
  return path.detach();
})();
const TALLY_WIDTH = 40;

/** What VoiceOver calls each player. */
const namesOf = (computer: boolean) =>
  computer ? (['You', 'The computer'] as const) : (['Player 1', 'Player 2'] as const);

/** Who won, and the count so far, for VoiceOver. */
const told = (winner: 0 | 1, wins: [number, number], computer: boolean) => {
  const [one, two] = namesOf(computer);
  return `${winner === 0 ? one : two} won. ${one} ${computer ? 'have' : 'has'} ${wins[0]}, ${two.toLowerCase()} ${wins[1]}`;
};

type Props = {
  settings: PoolSettings;
  /** Reduce Motion: no trails, and calmer pots. */
  calm: boolean;
  onSettings: (settings: PoolSettings) => void;
  /** The app's one Sound choice: its tile is here too. */
  sound: SoundChoice;
  onSound: (sound: SoundChoice) => void;
  /** To the calm room's menu, or to showdowns. */
  onMode: (mode: Mode) => void;
};

/** The 8-ball trial (docs/pool.md). Opened and left with the mode switch. */
export function Pool({ settings, calm, onSettings, sound, onSound, onMode }: Props) {
  const [open, setOpen] = useState(false);
  // Who won the game just over, until play again.
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  // Wins since 8-ball was opened; leaving it starts again.
  const [wins, setWins] = useState<[number, number]>([0, 0]);
  const close = useCallback(() => setOpen(false), []);
  /** A game is over: who won, and the count with it, together so VoiceOver hears both. */
  const ended = useCallback((who: 0 | 1, count: [number, number]) => {
    setWinner(who);
    setWins(count);
  }, []);
  const { width, height } = useWindowDimensions();
  // The calm room's own box and view.
  const view = useMemo(() => ({ cx: width / 2, cy: height / 2, ppu: width / 2 }), [width, height]);
  const box = useMemo<Box>(() => ({ hw: 1, hh: height / width, ...TUNING.box }), [width, height]);
  const cloth = tableOf(settings.cloth);
  const table = POOL.tables[cloth];
  const room = useMemo(() => poolRoom(box, view, POOL.tables[cloth]), [box, view, cloth]);
  const mark = table.mark.join(',');
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
  const tableId = useSharedValue(cloth);
  useEffect(() => tableId.set(cloth), [tableId, cloth]);
  const asCue = cueAim(settings.aim);
  const aimCue = useSharedValue(asCue);
  useEffect(() => aimCue.set(asCue), [aimCue, asCue]);
  // Player 2 played by the phone.
  const versus = computerPlays(settings.opponent);
  const computer = useSharedValue(versus);
  useEffect(() => computer.set(versus), [computer, versus]);
  const opponent = useSharedValue(createOpponent());
  const tones = sound === 'tones';
  const sounding = useSharedValue(tones);
  useEffect(() => sounding.set(tones), [sounding, tones]);
  // The table last drawn on: another redraws even a still one.
  const drawnOn = useSharedValue(cloth);

  // Where the ball in the hand was before a flick began.
  const steady = useSharedValue({ x: 0, y: 0 });

  /** A cue ball into the hand at a place in box units. */
  const hold = (x: number, y: number, id: number) => {
    'worklet';
    // One cue ball at a time: a new one lets the last go.
    retire(pool.value);
    beginHold(hand.value, box, x, y, 'glass', false, id);
    finger.value = id;
    dirty.value = true;
  };

  const launch = (swiped: boolean) => {
    'worklet';
    const w = hand.value;
    const h = heldBy(w, finger.value);
    if (!h) return;
    const placing = h.seconds >= POOL.aim.place;
    const v = swiped && !placing ? swipeOf(h) : { x: 0, y: 0 };
    // While placing, a flick at lifting says draw or follow, and it goes from where it was before.
    const roll = swiped && placing ? rollOf(swipeOf(h)) : 0;
    if (swiped && placing && flicked(h)) {
      h.bubble.p.x = steady.value.x;
      h.bubble.p.y = steady.value.y;
    }
    // A straight shot calls the pocket its line marks for the 8; a swiped one, whose line fades,
    // calls none.
    const p = pool.value;
    let called = -1;
    if (v.x === 0 && v.y === 0) {
      const t = traceAhead(p, box, fitCue(p, box, h.bubble.p, h.bubble.r), h.bubble.r);
      if (t.hit === EIGHT && t.drops) called = t.pocket;
    }
    release(w, v.x, v.y, POOL.cue.speed, finger.value);
    const bubble = w.bubbles.pop();
    if (bubble) {
      enter(p, box, bubble, roll);
      beginShot(game.value, p, called);
    }
    finger.set(-1);
    dirty.set(true);
  };
  const cancel = () => {
    'worklet';
    waiting.set(-1);
    // The computer's hold is not a finger's to end.
    if (finger.value !== COMPUTER) launch(false);
  };
  /** Lets the computer's hold go without a shot. */
  const unhold = () => {
    'worklet';
    if (finger.value !== COMPUTER) return;
    release(hand.value, 0, 0, 0, COMPUTER);
    hand.value.bubbles.pop();
    finger.value = -1;
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
    weigh(g, p);
    if (g.shooting && stillTable(p, box)) {
      endShot(g, judge(g, p));
      if (g.winner !== null) {
        // Over: the table holds as it ended until play again.
        p.over = true;
        waiting.value = -1;
        scheduleOnRN(ended, g.winner, g.wins);
      }
    }
    // A new game's first shot waits for its rack to have swelled in.
    if (g.racking && p.racked && p.balls.every((b) => b.back < 0)) g.racking = false;
    // The 8 is set back once its pot has played out; a new rack has it there already.
    const eight = p.balls[EIGHT]!;
    if (g.spotting && !g.shooting && (eight.sunk < 0 || eight.sunk >= potEnds(p.calm))) {
      spotBall(p, box, EIGHT);
      g.spotting = false;
    }
    const ready = !g.shooting && !g.spotting && !g.racking && g.winner === null;
    const its = computer.value && g.turn === 1;
    // A finger held through the last shot gets nothing on the computer's turn.
    if (ready && its) waiting.value = -1;
    if (!g.shooting && !g.spotting && !g.racking && waiting.value !== -1) {
      hold(waitAt.value.x, waitAt.value.y, waiting.value);
      waiting.value = -1;
    }
    const op = opponent.value;
    if (ready && its && (finger.value === -1 || finger.value === COMPUTER)) {
      const mine = heldBy(w, COMPUTER);
      const act = opponentTurn(op, p, g, box, dt, mine ? mine.seconds : -1, p.calm, Math.random);
      if (act.kind === 'hold') hold(act.x, act.y, COMPUTER);
      else if (act.kind === 'move') moveHold(w, act.x, act.y, COMPUTER);
      else if (act.kind === 'send') launch(false);
    } else if (op.phase !== 'rest' || finger.value === COMPUTER) {
      // Its turn is over, or a friend plays now.
      unhold();
      restOpponent(op);
    }
    const shown = followGame(turn.value, g, dt, p.calm);
    const h = w.holds[0];
    const heldFor = h ? h.seconds : 0;
    if (h) advance(w, box, HANDS, 1, dt);
    // From here the finger places the shot rather than swipes it.
    const { place, ease, swipe } = POOL.aim;
    if (h && heldFor < place && h.seconds >= place && finger.value !== COMPUTER) scheduleOnRN(tick);
    // A still table draws nothing.
    if (drawnOn.value !== tableId.value) {
      drawnOn.value = tableId.value;
      dirty.value = true;
    }
    if (!moved && !shown && !h && !dirty.value) return;
    dirty.value = moved || shown || !!h;
    if (p.potted > 0 && sounding.value) scheduleOnRN(soundPot, newestPot(p), POOL.pot.meaning);
    if (p.potted > 0) scheduleOnRN(drop);
    else if (p.landed > 0) scheduleOnRN(land);
    else if (p.knock > POOL.hapticLeast && p.time - lastBuzz.value > POOL.hapticGap) {
      lastBuzz.value = p.time;
      scheduleOnRN(buzz, p.knock);
    }
    p.potted = 0;
    p.landed = 0;
    p.knock = 0;
    // A flick while placing leaves the shot where it was.
    if (h && !(h.seconds >= place && flicked(h))) {
      steady.value = { x: h.bubble.p.x, y: h.bubble.p.y };
    }
    let sure = 0;
    if (h) {
      const s = swipeOf(h);
      const placing = Math.min(1, Math.max(0, (h.seconds - place) / ease));
      sure = Math.max(placing, 1 - Math.hypot(s.x, s.y) / swipe);
    }
    // Where it would start: clear of any ball resting against the glass.
    const at = h && h.seconds >= place ? { ...h.bubble.p, ...steady.value } : h?.bubble.p;
    const held = h && at ? { ...h.bubble, p: fitCue(p, box, at, h.bubble.r) } : null;
    const trace = held && sure > 0 ? traceAhead(p, box, held.p, held.r) : null;
    // Once the shooter's group is cleared, the line calls the pocket it would send the 8 into.
    const called =
      trace && trace.hit === EIGHT && trace.drops && onEight(g, downOf(p)) ? trace.pocket : -1;
    const grown = h ? Math.min(1, h.seconds / POOL.cue.appear) : 0;
    const power = h ? Math.min(1, h.seconds / POOL.cue.charge) : 0;
    picture.value = createPicture((canvas) => {
      'worklet';
      const t = POOL.tables[tableId.value];
      const c = aimCue.value ? power : -1;
      drawPool(canvas, gpu, p, held, grown, trace, sure, called, row, turn.value, box, view, t, c);
    });
  });

  const touch = useManualGesture({
    shouldCancelWhenOutside: false,
    onTouchesDown: (e) => {
      'worklet';
      const t = e.changedTouches[0];
      const g = game.value;
      // Once over, only play again goes on.
      if (!t || finger.value !== -1 || waiting.value !== -1 || g.winner !== null) return;
      // The computer's turn is its own.
      if (computer.value && g.turn === 1 && !g.shooting) return;
      const x = (t.x - view.cx) / view.ppu;
      const y = (t.y - view.cy) / view.ppu;
      // A shot waits for a still table.
      if (g.shooting || g.spotting || g.racking) {
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

  useEffect(() => {
    if (winner !== null) AccessibilityInfo.announceForAccessibility(told(winner, wins, versus));
  }, [winner, wins, versus]);
  /** What is left fades, the table is set again, and the other player breaks. */
  const again = () => {
    setWinner(null);
    scheduleOnUI(() => {
      'worklet';
      clearTable(pool.value);
      nextGame(game.value);
      dirty.value = true;
    });
  };

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
      {wins[0] + wins[1] > 0 &&
        ([0, 1] as const).map((who) => (
          <Animated.View
            // A new count fades in as the winner's rings finish lighting.
            key={`${who}-${wins[who]}`}
            entering={FadeIn.delay(calm ? 0 : POOL.row.win.seconds * 1000).duration(500)}
            pointerEvents="none"
            style={[
              styles.tally,
              { left: width / 2 + (who === 0 ? -1 : 1) * (row.end - row.radius) - TALLY_WIDTH / 2 },
            ]}
          >
            <Text
              style={[styles.count, { color: `rgba(${mark},${POOL.row.tally.opacity})` }]}
              accessibilityLabel={`${namesOf(versus)[who]}: ${wins[who]} won`}
            >
              {wins[who]}
            </Text>
          </Animated.View>
        ))}
      {winner !== null && (
        <Animated.View
          entering={FadeIn.delay(calm ? 0 : POOL.row.win.after * 1000).duration(600)}
          exiting={FadeOut.duration(300)}
          style={styles.again}
        >
          <Pressable
            onPress={again}
            accessibilityRole="button"
            accessibilityLabel={`${told(winner, wins, versus)}. Play again`}
            hitSlop={12}
            style={({ pressed }) => [
              styles.ring,
              { borderColor: `rgba(${mark},0.6)` },
              pressed && styles.pressed,
            ]}
          >
            <Canvas style={styles.glyph} pointerEvents="none">
              <Path
                path={AGAIN}
                color={`rgb(${mark})`}
                style="stroke"
                strokeWidth={2}
                strokeCap="round"
                strokeJoin="round"
              />
            </Canvas>
          </Pressable>
        </Animated.View>
      )}
      {/* Over the table, so a touch that closes the menu does not also play. */}
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={close} accessible={false} />}
      <Tray
        mode="pool"
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onMode={onMode}
        hint="Changes to the next option"
        onTile={(key) =>
          key === SOUND_KEY
            ? onSound(nextSound(sound))
            : onSettings(
                stepPool(
                  POOL_ROWS.find((r) => r.key === key)!,
                  settings,
                ),
              )
        }
        tiles={[
          ...POOL_ROWS.map(({ key, label, options }) => ({
            key,
            label,
            value: options.find((o) => o.id === settings[key])!.name,
          })),
          { key: SOUND_KEY, label: SOUND_CHOICE.label, value: soundName(sound) },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: '#070a18' },
  // Above the dot, clear of the table's middle.
  again: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center' },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    backgroundColor: 'rgba(5,8,20,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  tally: { position: 'absolute', top: POOL.row.top + POOL.row.tally.below, width: TALLY_WIDTH },
  count: {
    textAlign: 'center',
    fontSize: POOL.row.tally.size,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  glyph: { width: 40, height: 40 },
});
