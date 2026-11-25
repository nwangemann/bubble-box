import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState } from 'react';
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
import { ordinal, winsOf, type Tally } from '@/config/tally';
import { HALO } from '@/config/arena';
import { TUNING } from '@/config/tuning';
import { paceOf } from '@/core/duel';
import { featsOf } from '@/core/feats';
import { choose, createShowdown, entrantAt } from '@/core/showdown';
import type { Box } from '@/core/types';
import { advance } from '@/core/world';
import {
  castOf,
  drawFigure,
  drawHalo,
  drawLiquid,
  drawShowdown,
  showdownLook,
  type Backdrop,
} from '@/scene/drawShowdown';
import { getGpu } from '@/scene/gpu';
import { MOTIFS } from '@/scene/liquid';
import { arenaPicture, pictureShader } from '@/scene/showdownPictures';
import { crewOf, type CastId } from '@/showdown/casts';
import type { Arena } from '@/showdown/types';
import { SHOWDOWN_UI as U } from '@/config/showdownUi';

type Props = {
  arena: Arena;
  cast: CastId;
  rule: Rule;
  /** How many enter. */
  count: number;
  /** Reduce Motion. */
  calm: boolean;
  /** Who was rooted for last, by name. Rooted for again if entering. */
  favourite: string | null;
  onFavourite: (name: string | null) => void;
  tally: Tally;
  /** Who won, and whether it was called. */
  onWon: (name: string, called: boolean) => void;
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
export function Showdown({
  arena,
  cast,
  rule,
  count,
  calm,
  favourite,
  onFavourite,
  tally,
  onWon,
  onAgain,
  onNext,
  onLeave,
}: Props) {
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
  const [crew] = useState(() => crewOf(cast, count));
  const [look] = useState(() =>
    showdownLook(
      arena,
      crew.map((m) => m.fighter),
    ),
  );
  const room = useMemo(() => arenaPicture(arena, box, view), [arena, box, view]);
  const [{ liquid, roomContact }] = useState(getGpu);
  const back = useMemo<Backdrop | null>(() => {
    const shader = pictureShader(room, width, height, U.backdrop);
    return shader && { shader, scale: U.backdrop };
  }, [room, width, height]);
  const [start] = useState(() => {
    const w = createShowdown(box, rule, count, crew.length);
    const at = w.duel!.entrants.findIndex((i) => crew[i]!.fighter.name === favourite);
    choose(w, at + 1, false);
    return w;
  });
  // The one rooted for, by bubble id, and whether it rages. The frame loop hands them to the duel.
  const [pick, setPick] = useState({ id: start.duel!.favourite, rage: false });
  const picked = useSharedValue(pick);
  const holding = useSharedValue(false);
  const world = useSharedValue(start);
  const picture = useSharedValue(createPicture(() => {}));
  const told = useSharedValue(0);
  const phase = useSharedValue('ready');

  // Only these few moments reach React: a clash, the start and the win.
  const [out, setOut] = useState<number[]>([]);
  const [news, setNews] = useState('');
  const [stage, setStage] = useState<'ready' | 'fight' | 'won'>('ready');
  const [best, setBest] = useState<{
    cast: number;
    wins: number;
    feats: FeatId[];
    called: boolean;
  } | null>(null);
  const onClash = (winner: number, loser: number) => {
    thud();
    setOut((o) => [...o, loser]);
    const { fighter, home } = crew[winner]!;
    const verb = home.verbs[loser % home.verbs.length]!;
    const mine = loser === start.duel!.entrants[pick.id - 1];
    setNews(`${fighter.name} ${verb} ${crew[loser]!.fighter.name}${mine ? ', well fought' : ''}`);
  };
  const onPhase = (
    next: 'ready' | 'fight' | 'won',
    champion: number,
    wins: number,
    feats: FeatId[],
    called: boolean,
  ) => {
    setStage(next);
    if (next !== 'won') return;
    cheer();
    setNews('');
    setBest({ cast: champion, wins, feats, called });
    onWon(crew[champion]!.fighter.name, called);
  };

  useFrameCallback((frame) => {
    const w = world.value;
    const duel = w.duel;
    if (!duel) return;
    const dt = ((frame.timeSincePreviousFrame ?? 0) / 1000) * (calm ? TUNING.showdown.calm : 1);
    const { id: favoured, rage } = picked.value;
    duel.hold = holding.value;
    if (favoured !== duel.favourite || rage !== duel.rage) choose(w, favoured, rage);
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
      scheduleOnRN(
        onPhase,
        duel.phase,
        castOf(w, id),
        duel.wins[id] ?? 0,
        feats,
        id > 0 && id === duel.favourite && !duel.rage,
      );
    }
    picture.value = createPicture((canvas) => {
      'worklet';
      drawShowdown(canvas, look, liquid, roomContact, back, w, box, view, calm);
    });
  });

  const [entrants] = useState(() => [...start.duel!.entrants]);
  const rows = Math.ceil(count / U.perRow);
  const perRow = Math.ceil(count / rows);
  const cell = Math.min(U.cell, (width - U.side * 2) / perRow);
  const pitch = rows > 1 ? cell * U.pitch : U.roster;
  const rosterHeight = pitch * rows;
  const placeOf = (at: number) => {
    const row = Math.floor(at / perRow);
    const across = Math.min(perRow, count - row * perRow);
    return {
      x: width / 2 + cell * (at - row * perRow + 0.5 - across / 2),
      y: pitch * (row + 0.55),
    };
  };
  const rootFor = (id: number, rage: boolean) => {
    const next = { id, rage };
    setPick(next);
    picked.set(next);
    onFavourite(id ? crew[entrants[id - 1]!]!.fighter.name : null);
  };
  /** Bubble id in the roster or the line-up beneath a touch, or 0. */
  const under = (x: number, y: number) => {
    const at = entrants.findIndex((_, i) => {
      const p = placeOf(i);
      return Math.abs(x - p.x) <= cell / 2 && Math.abs(y - U.top - p.y) <= pitch / 2;
    });
    if (at >= 0) return at + 1;
    const reach = TUNING.showdown.favourite.touch / view.ppu;
    return entrantAt(start, box, (x - view.cx) / view.ppu, (y - view.cy) / view.ppu, reach);
  };
  // A tap on the one already chosen makes it rage, and another lets it go.
  const again = useRef(false);
  const touch = (x: number, y: number, begins: boolean) => {
    const id = under(x, y);
    if (begins) again.current = id > 0 && id === pick.id;
    if (!id || id === pick.id) return;
    again.current = false;
    rootFor(id, false);
  };
  const release = () => {
    holding.set(false);
    if (again.current) rootFor(pick.rage ? 0 : pick.id, !pick.rage);
    again.current = false;
  };
  const name = pick.id ? crew[entrants[pick.id - 1]!]!.fighter.name : null;
  const step = (by: number) => rootFor((pick.id + by + count + 1) % (count + 1), false);
  const roster = useMemo(
    () =>
      createPicture((canvas) => {
        entrants.forEach((i, at) => {
          const f = look.cast[i]!;
          const row = Math.floor(at / perRow);
          const across = Math.min(perRow, count - row * perRow);
          const x = width / 2 + cell * (at - row * perRow + 0.5 - across / 2);
          const y = U.bleed + pitch * (row + 0.55);
          const r = cell * 0.44;
          const gone = out.includes(i);
          if (at + 1 === pick.id)
            drawHalo(
              canvas,
              pick.rage ? look.hot : look.halo,
              x,
              y,
              r,
              gone ? HALO.gone : HALO.roster,
            );
          drawFigure(canvas, look.layer, f, x, y, r * 1.2, 0, gone ? 0.2 : 1, 0);
          if (gone || !liquid || !back) return;
          drawLiquid(canvas, look.film, liquid, back, f, look.room, x, y, r, r, {
            ...STILL,
            motif: i % MOTIFS,
            seed: (at * 0.61803) % 1,
          });
        });
      }),
    [look, out, cell, pitch, perRow, entrants, count, width, liquid, back, pick],
  );

  const rooting = !name
    ? 'Tap one to root for it'
    : pick.rage
      ? `${name} is raging`
      : `Rooting for ${name}, tap again to enrage`;
  const crowns = best ? winsOf(tally, crew[best.cast]!.fighter.name) : 0;

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
          <Canvas style={{ width, height: rosterHeight + U.bleed * 2, marginVertical: -U.bleed }}>
            <Picture picture={roster} />
          </Canvas>
          <Text
            style={styles.news}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityLiveRegion="polite"
          >
            {news || (stage === 'ready' ? rooting : `${count} bubbles`)}
          </Text>
        </Animated.View>
      )}
      {stage === 'ready' && (
        <Animated.View
          entering={FadeIn.duration(700)}
          exiting={FadeOut.duration(400)}
          style={[styles.card, { top: U.top + rosterHeight + 34 }]}
          pointerEvents="none"
        >
          <Text style={[styles.big, { fontFamily: arena.font, color: arena.accent }]}>
            {arena.name}
          </Text>
          <Text style={styles.small}>{arena.tagline}</Text>
          <Text style={styles.faint}>{rule.about}</Text>
        </Animated.View>
      )}
      {stage === 'ready' && (
        <View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Favourite"
          accessibilityValue={{ text: name ?? 'None' }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            holding.set(true);
            touch(e.nativeEvent.pageX, e.nativeEvent.pageY, true);
          }}
          onResponderMove={(e) => touch(e.nativeEvent.pageX, e.nativeEvent.pageY, false)}
          onResponderRelease={release}
          onResponderTerminate={() => {
            again.current = false;
            holding.set(false);
          }}
        />
      )}
      {best && (
        <>
          <Animated.View
            entering={calm ? FadeIn : FadeInDown.delay(900).duration(900)}
            style={styles.crown}
            pointerEvents="none"
          >
            <Text style={[styles.title, { color: arena.accent }]}>
              {crew[best.cast]?.home.title}
            </Text>
            <Text
              style={[styles.big, { fontFamily: arena.font }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {crew[best.cast]?.fighter.name}
            </Text>
            <Text style={styles.small}>
              {best.wins === 1 ? '1 knock-out' : `${best.wins} knock-outs`}
              {crowns > 1 && `, ${ordinal(crowns)} crown`}
            </Text>
            {best.called && tally.called > 1 && (
              <Text style={styles.faint}>Your {ordinal(tally.called)} right call</Text>
            )}
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
