import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ARENA_FEEL } from '@/config/feels';
import { FEATS, type FeatId } from '@/config/feats';
import type { Rule } from '@/config/rules';
import { TUNING } from '@/config/tuning';
import { paceOf } from '@/core/duel';
import { featsOf } from '@/core/feats';
import { createShowdown } from '@/core/showdown';
import type { Box } from '@/core/types';
import { advance } from '@/core/world';
import {
  castOf,
  drawFigure,
  drawLiquid,
  drawShowdown,
  showdownLook,
  type Backdrop,
} from '@/scene/drawShowdown';
import { getGpu } from '@/scene/gpu';
import { arenaPicture, pictureShader } from '@/scene/showdownPictures';
import type { Arena, Cast } from '@/showdown/types';
import { SHOWDOWN_UI as U } from '@/config/showdownUi';

type Props = {
  arena: Arena;
  cast: Cast;
  rule: Rule;
  /** How many enter. */
  count: number;
  /** Reduce Motion. */
  calm: boolean;
  onAgain: () => void;
  onNext: () => void;
  onLeave: () => void;
};

const thud = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
};
const cheer = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

const STILL = {
  time: 3,
  tear: 0,
  modes: [0, 0],
  axis: [1, 0, 0],
  hole: [0, 0, 1],
  away: [0, 0],
  partners: [],
  dyes: [],
};
const FEELS = [ARENA_FEEL];

/** One showdown from line-up to winner. Remount it for another. */
export function Showdown({ arena, cast, rule, count, calm, onAgain, onNext, onLeave }: Props) {
  const { width, height } = useWindowDimensions();
  const view = useMemo(() => ({ cx: width / 2, cy: height / 2, ppu: width / 2 }), [width, height]);
  const box = useMemo<Box>(
    () => ({
      hw: 1,
      hh: height / width,
      depth: TUNING.showdown.depth,
      focal: TUNING.box.focal,
    }),
    [width, height],
  );
  const [look] = useState(() => showdownLook(arena, cast.cast));
  const room = useMemo(() => arenaPicture(arena, box, view), [arena, box, view]);
  const [{ liquid, roomContact }] = useState(getGpu);
  const back = useMemo<Backdrop | null>(() => {
    const shader = pictureShader(room, width, height, U.backdrop);
    return shader && { shader, scale: U.backdrop };
  }, [room, width, height]);
  const [start] = useState(() => createShowdown(box, rule, count, cast.cast.length));
  const world = useSharedValue(start);
  const picture = useSharedValue(createPicture(() => {}));
  const told = useSharedValue(0);
  const phase = useSharedValue('ready');

  // Only these few moments reach React: a clash, the start and the win.
  const [out, setOut] = useState<number[]>([]);
  const [news, setNews] = useState('');
  const [stage, setStage] = useState<'ready' | 'fight' | 'won'>('ready');
  const [best, setBest] = useState<{ cast: number; wins: number; feats: FeatId[] } | null>(null);
  const onClash = (winner: number, loser: number) => {
    thud();
    setOut((o) => [...o, loser]);
    const verb = cast.verbs[loser % cast.verbs.length]!;
    setNews(`${cast.cast[winner]!.name} ${verb} ${cast.cast[loser]!.name}`);
  };
  const onPhase = (
    next: 'ready' | 'fight' | 'won',
    champion: number,
    wins: number,
    feats: FeatId[],
  ) => {
    setStage(next);
    if (next !== 'won') return;
    cheer();
    setNews('');
    setBest({ cast: champion, wins, feats });
  };

  useFrameCallback((frame) => {
    const w = world.value;
    const duel = w.duel;
    if (!duel) return;
    const dt = ((frame.timeSincePreviousFrame ?? 0) / 1000) * (calm ? TUNING.showdown.calm : 1);
    advance(w, box, FEELS, 1, Math.min(dt, TUNING.maxFrame) * paceOf(w));
    const fresh = duel.out - told.value;
    if (fresh > 0) {
      told.value = duel.out;
      for (const c of duel.clashes.slice(-fresh))
        scheduleOnRN(onClash, castOf(w, c.winner), castOf(w, c.loser));
    }
    if (duel.phase !== phase.value) {
      phase.value = duel.phase;
      const id = duel.champion;
      const feats = duel.phase === 'won' ? featsOf(duel) : [];
      scheduleOnRN(onPhase, duel.phase, castOf(w, id), duel.wins[id] ?? 0, feats);
    }
    picture.value = createPicture((canvas) => {
      'worklet';
      drawShowdown(canvas, look, liquid, roomContact, back, w, box, view, calm);
    });
  });

  const [entrants] = useState(() => [...start.duel!.entrants]);
  const cell = Math.min(U.cell, (width - U.side * 2) / count);
  const roster = useMemo(
    () =>
      createPicture((canvas) => {
        const left = width / 2 - U.side - (cell * count) / 2;
        entrants.forEach((i, at) => {
          const f = look.cast[i]!;
          const x = left + cell * (at + 0.5);
          const y = U.roster * 0.55;
          const r = cell * 0.44;
          const gone = out.includes(i);
          drawFigure(canvas, look.layer, f, x, y, r * 1.2, 0, gone ? 0.2 : 1, 0);
          if (gone || !liquid || !back) return;
          drawLiquid(canvas, look.film, liquid, back, f, look.room, x, y, r, r, {
            ...STILL,
            motif: i,
            seed: (at * 0.61803) % 1,
          });
        });
      }),
    [look, out, cell, entrants, count, width, liquid, back],
  );

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
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={picture} />
      </Canvas>
      {stage !== 'won' && (
        <Animated.View exiting={FadeOut.duration(400)} style={styles.top} pointerEvents="none">
          <Canvas style={{ width: width - U.side * 2, height: U.roster }}>
            <Picture picture={roster} />
          </Canvas>
          <Text style={styles.news} numberOfLines={1} accessibilityLiveRegion="polite">
            {news || `${count} bubbles`}
          </Text>
        </Animated.View>
      )}
      {stage === 'ready' && (
        <Animated.View
          entering={FadeIn.duration(700)}
          exiting={FadeOut.duration(400)}
          style={styles.card}
          pointerEvents="none"
        >
          <Text style={[styles.big, { fontFamily: arena.font, color: arena.accent }]}>
            {arena.name}
          </Text>
          <Text style={styles.small}>{arena.tagline}</Text>
          <Text style={styles.faint}>{rule.about}</Text>
        </Animated.View>
      )}
      {best && (
        <>
          <Animated.View
            entering={calm ? FadeIn : FadeInDown.delay(900).duration(900)}
            style={styles.crown}
            pointerEvents="none"
          >
            <Text style={[styles.title, { color: arena.accent }]}>{cast.title}</Text>
            <Text
              style={[styles.big, { fontFamily: arena.font }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {cast.cast[best.cast]?.name}
            </Text>
            <Text style={styles.small}>
              {best.wins === 1 ? '1 knock-out' : `${best.wins} knock-outs`}
            </Text>
          </Animated.View>
          {best.feats.length > 0 && (
            <Animated.View
              entering={calm ? FadeIn : FadeInDown.delay(U.feats.delay).duration(U.feats.rise)}
              style={styles.feats}
              pointerEvents="none"
            >
              {best.feats.map((id) => (
                <Text
                  key={id}
                  style={[styles.feat, { fontFamily: arena.font, color: arena.accent }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {FEATS[id]}
                </Text>
              ))}
            </Animated.View>
          )}
          <Animated.View entering={FadeInDown.delay(1600)} style={styles.buttons}>
            {(
              [
                ['Again', onAgain],
                ['Another arena', onNext],
                ['Back to calm', onLeave],
              ] as const
            ).map(([label, go], i) => (
              <Pressable
                key={label}
                onPress={go}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.button,
                  i === 0 && { backgroundColor: arena.accent },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.buttonText, i === 0 && styles.buttonFirst]}>{label}</Text>
              </Pressable>
            ))}
          </Animated.View>
        </>
      )}
      <Pressable
        onPress={onLeave}
        accessibilityRole="button"
        accessibilityLabel="Leave the showdown"
        style={styles.handle}
      >
        <View style={styles.dot} />
      </Pressable>
    </Animated.View>
  );
}

const shadow = {
  textShadowColor: 'rgba(8,4,20,0.85)',
  textShadowRadius: 8,
  textShadowOffset: { width: 0, height: 2 },
};
const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: '#070a18' },
  top: { position: 'absolute', top: U.top, left: U.side, right: U.side, alignItems: 'center' },
  news: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 2, ...shadow },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: U.top + U.roster + 34,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  crown: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: U.top + 6,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4, ...shadow },
  big: { color: '#fff', fontSize: 42, lineHeight: 52, textAlign: 'center', ...shadow },
  small: { color: '#fff', fontSize: 16, fontWeight: '500', marginTop: 4, ...shadow },
  // Grows upwards from above the buttons, clear of the champion.
  feats: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: U.feats.bottom,
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: U.feats.gap,
  },
  feat: { fontSize: U.feats.size, textAlign: 'center', ...shadow },
  faint: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, ...shadow },
  buttons: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 84,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: 'rgba(5,8,20,0.74)',
  },
  pressed: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonFirst: { color: '#1c1330' },
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
