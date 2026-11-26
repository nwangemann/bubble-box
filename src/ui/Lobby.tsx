import { Canvas, ClipOp, createPicture, Picture, Skia } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ENTRANTS, RULES, type RuleId } from '@/config/rules';
import { MODE_SWITCH, type Mode } from '@/config/modes';
import { SHOWDOWN_UI as U } from '@/config/showdownUi';
import { TUNING } from '@/config/tuning';
import { drawFigure, drawLiquid, showdownLook } from '@/scene/drawShowdown';
import { getGpu } from '@/scene/gpu';
import { arenaPicture, pictureShader } from '@/scene/showdownPictures';
import { THEME_IDS, THEMES, type ThemeId } from '@/showdown';
import { castFor, castName, mostOf, stepCast, type CastChoice } from '@/showdown/casts';
import { ModeSwitch } from './ModeSwitch';

const C = U.card;
const COLUMNS = 2;

type Props = {
  rule: RuleId;
  onRule: (rule: RuleId) => void;
  /** How many enter. */
  count: number;
  onCount: (count: number) => void;
  cast: CastChoice;
  onCast: (cast: CastChoice) => void;
  onPick: (arena: ThemeId) => void;
  onRandom: () => void;
  /** To the calm room's menu, or to 8-ball. */
  onMode: (mode: Mode) => void;
  onClose: () => void;
};

/** Every arena as a card, and the rule they are fought under. */
export function Lobby({
  rule,
  onRule,
  count,
  onCount,
  cast,
  onCast,
  onPick,
  onRandom,
  onMode,
  onClose,
}: Props) {
  const { width, height } = useWindowDimensions();
  // The saved count waits for a cast that has as many.
  const most = mostOf(cast);
  const entering = Math.min(count, most);
  const step = (by: number) => onCount(Math.max(ENTRANTS.least, Math.min(most, entering + by)));
  const [{ liquid }] = useState(getGpu);
  const cards = useMemo(() => {
    const rows = Math.ceil(THEME_IDS.length / COLUMNS);
    const w = (width - U.side * 2 - C.gap * (COLUMNS - 1)) / COLUMNS;
    const h = (height - C.top - C.bottom - C.gap * (rows - 1)) / rows;
    return THEME_IDS.map((id, i) => ({
      id,
      x: U.side + (i % COLUMNS) * (w + C.gap),
      y: C.top + Math.floor(i / COLUMNS) * (h + C.gap),
      w,
      h,
    }));
  }, [width, height]);
  // The rooms, and what films bend, stay as they are while the cast changes.
  const rooms = useMemo(
    () =>
      cards.map(({ id, w, h }) => {
        const box = { hw: 1, hh: h / w, depth: TUNING.showdown.depth, focal: TUNING.box.focal };
        const room = arenaPicture(THEMES[id], box, { cx: w / 2, cy: h / 2, ppu: w / 2 });
        return { room, shader: pictureShader(room, w, h, 1) };
      }),
    [cards],
  );
  const picture = useMemo(
    () =>
      createPicture((canvas) => {
        cards.forEach(({ id, x, y, w, h }, at) => {
          const { room, shader } = rooms[at]!;
          // Random promises no cast in particular, so each card shows another's.
          const guests = THEME_IDS[(at + 1) % THEME_IDS.length]!;
          const one = castFor(cast, id);
          const who =
            one === 'mixed'
              ? [0, 1, 2].map((i) => THEMES[THEME_IDS[(at + i) % THEME_IDS.length]!].cast[at]!)
              : THEMES[cast === 'random' ? guests : one].cast.slice(0, 3);
          canvas.save();
          canvas.translate(x, y);
          canvas.clipRRect(
            Skia.RRectXY(Skia.XYWHRect(0, 0, w, h), C.corner, C.corner),
            ClipOp.Intersect,
            true,
          );
          canvas.drawPicture(room);
          const look = showdownLook(THEMES[id], who);
          look.cast.forEach((f, i) => {
            const r = (w / 2) * C.ball;
            const at = { x: w * (0.2 + 0.3 * i), y: h * (i === 1 ? 0.32 : 0.52) };
            drawFigure(canvas, look.layer, f, at.x, at.y, r, 0, 1, 0);
            if (!liquid || !shader) return;
            const back = { shader, scale: 1 };
            drawLiquid(canvas, look.film, liquid, back, f, look.room, at.x, at.y, r, r, {
              time: 3,
              seed: (i * 0.61803) % 1,
              motif: i,
              tear: 0,
              modes: [0, 0],
              axis: [1, 0, 0],
              hole: [0, 0, 1],
              away: [0, 0],
              partners: [],
              dyes: [],
            });
          });
          canvas.restore();
        });
      }),
    [cards, rooms, liquid, cast],
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
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Picture picture={picture} />
      </Canvas>
      <View style={styles.head} pointerEvents="box-none">
        <Text style={styles.title} accessibilityRole="header">
          Showdown
        </Text>
        <View style={styles.rules}>
          {(Object.keys(RULES) as RuleId[]).map((id) => (
            <Pressable
              key={id}
              onPress={() => onRule(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: id === rule }}
              style={[styles.rule, id === rule && styles.ruleOn]}
            >
              <Text style={[styles.ruleText, id === rule && styles.ruleTextOn]}>
                {RULES[id].name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.about}>{RULES[rule].about}</Text>
        <View
          style={styles.count}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Entrants"
          accessibilityValue={{ min: ENTRANTS.least, max: most, now: entering }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        >
          <Pressable onPress={() => step(-1)} hitSlop={4} style={styles.step}>
            <Text style={styles.sign}>−</Text>
          </Pressable>
          <Text style={styles.number}>{entering} bubbles</Text>
          <Pressable onPress={() => step(1)} hitSlop={4} style={styles.step}>
            <Text style={styles.sign}>+</Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <View
            style={styles.count}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Cast"
            accessibilityValue={{ text: castName(cast) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) =>
              onCast(stepCast(cast, e.nativeEvent.actionName === 'increment' ? 1 : -1))
            }
          >
            <Pressable onPress={() => onCast(stepCast(cast, -1))} hitSlop={4} style={styles.step}>
              <Text style={styles.sign}>‹</Text>
            </Pressable>
            <Text style={styles.number} numberOfLines={1}>
              {castName(cast)}
            </Text>
            <Pressable onPress={() => onCast(stepCast(cast, 1))} hitSlop={4} style={styles.step}>
              <Text style={styles.sign}>›</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={onRandom}
            accessibilityRole="button"
            accessibilityLabel="Random arena"
            style={({ pressed }) => [styles.random, pressed && styles.pressed]}
          >
            <Text style={styles.ruleText}>Random arena</Text>
          </Pressable>
        </View>
      </View>
      {cards.map(({ id, x, y, w, h }) => (
        <Pressable
          key={id}
          onPress={() => onPick(id)}
          accessibilityRole="button"
          accessibilityLabel={`${THEMES[id].name} showdown`}
          style={({ pressed }) => [
            styles.card,
            { left: x, top: y, width: w, height: h },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.plate}>
            <Text style={[styles.name, { fontFamily: THEMES[id].font, color: THEMES[id].accent }]}>
              {THEMES[id].name}
            </Text>
          </View>
        </Pressable>
      ))}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close showdowns"
        style={styles.handle}
      >
        <View style={styles.dot} />
      </Pressable>
      <View style={styles.modes} pointerEvents="box-none">
        <ModeSwitch mode="showdown" onMode={onMode} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  veil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,8,20,0.88)' },
  head: { position: 'absolute', top: U.top, left: 0, right: 0, alignItems: 'center' },
  title: { color: 'rgba(255,255,255,0.6)', fontSize: 13, letterSpacing: 0.6 },
  rules: {
    flexDirection: 'row',
    marginTop: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rule: { minHeight: 40, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 20 },
  ruleOn: { backgroundColor: '#fff' },
  ruleText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  ruleTextOn: { color: '#0b1024', fontWeight: '700' },
  count: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sign: { color: '#fff', fontSize: 24, fontWeight: '300' },
  number: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    width: 100,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  about: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  random: {
    minHeight: 40,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modes: { position: 'absolute', left: 0, right: 0, bottom: MODE_SWITCH.bottom },
  card: {
    position: 'absolute',
    borderRadius: C.corner,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  pressed: { opacity: 0.75 },
  plate: {
    height: C.name,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,8,20,0.66)',
  },
  name: { fontSize: 20 },
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
