import {
  BlendMode,
  Canvas,
  createPicture,
  Picture,
  Skia,
  TileMode,
  type SkPicture,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { customLook, DEFAULT_CUSTOM } from '@/config/custom';
import { DEFAULT_WALLS, dress, ENVIRONMENTS, LIGHTS } from '@/config/environments';
import { MODE_SWITCH as M, type Mode } from '@/config/modes';
import { POOL } from '@/config/pool';
import { TUNING } from '@/config/tuning';
import { createWorld, newBubble } from '@/core/world';
import { drawFigure, drawLiquid, showdownLook } from '@/scene/drawShowdown';
import { drawDisc, getPoolGpu } from '@/scene/drawPool';
import { drawScene } from '@/scene/drawScene';
import { getGpu } from '@/scene/gpu';
import { pictureShader } from '@/scene/showdownPictures';
import { THEMES } from '@/showdown';

const MARGIN = 14;
/** Its balls are near, so the haze of either table would do. */
const AIR = POOL.tables.space.air;

/** Drifting soap bubbles in a quiet dusk, drawn by the room's own shaders. */
function calmPicture(w: number, h: number) {
  const gpu = getGpu();
  const box = { hw: 1, hh: h / w, depth: TUNING.box.depth, focal: TUNING.box.focal };
  const ppu = w / 2;
  const world = createWorld();
  world.time = 4;
  for (const b of M.calm.bubbles) {
    const p = { x: b.x * 2 - 1, y: ((b.y - 0.5) * h) / ppu, z: 0 };
    world.bubbles.push(newBubble(world, 'soap', (b.r * h) / ppu, p));
  }
  return createPicture((canvas) => {
    const sky = Skia.Paint();
    sky.setDither(true);
    sky.setShader(
      Skia.Shader.MakeRadialGradient(
        { x: w * 0.72, y: h * 0.3 },
        w * 0.8,
        M.calm.sky.map((c) => Skia.Color(c)),
        null,
        TileMode.Clamp,
      ),
    );
    canvas.drawRect(Skia.XYWHRect(0, 0, w, h), sky);
    drawScene(
      canvas,
      gpu.bubblePaint,
      gpu.ripplePaint,
      gpu.burstPaint,
      gpu.fx,
      gpu.burstFx,
      world,
      box,
      { cx: w / 2, cy: h / 2, ppu },
      dress(ENVIRONMENTS.lattice, LIGHTS.night, DEFAULT_WALLS),
      [false],
      customLook(DEFAULT_CUSTOM),
    );
  });
}

/** Two entrants colliding in a burst of heat, drawn as they are in a showdown. */
function showdownPicture(w: number, h: number) {
  const { liquid } = getGpu();
  const S = M.showdown;
  const x = S.at.x * w;
  const y = S.at.y * h;
  const r = S.at.r * h;
  const sky = createPicture((canvas) => {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setDither(true);
    paint.setShader(
      Skia.Shader.MakeRadialGradient(
        { x, y },
        w * 0.62,
        S.sky.map((c) => Skia.Color(c)),
        [0, 0.3, 0.7, 1],
        TileMode.Clamp,
      ),
    );
    canvas.drawRect(Skia.XYWHRect(0, 0, w, h), paint);
    // Rays from where they meet.
    paint.setShader(null);
    paint.setColor(Skia.Color('#ffe9a024'));
    for (let i = 0; i < S.rays; i++) {
      const a = (i / S.rays) * Math.PI * 2 + 0.1;
      const wide = (Math.PI / S.rays) * 0.5;
      const to = (d: number) => ({ x: x + Math.cos(a + d) * w, y: y + Math.sin(a + d) * w });
      canvas.drawPath(Skia.Path.Polygon([{ x, y }, to(-wide), to(wide)], true), paint);
    }
  });
  const theme = THEMES[S.theme];
  const look = showdownLook(
    theme,
    S.fighters.map((i) => theme.cast[i]!),
  );
  const shader = pictureShader(sky, w, h, 2);
  return createPicture((canvas) => {
    canvas.drawPicture(sky);
    look.cast.forEach((f, i) => {
      const side = i === 0 ? -1 : 1;
      const cx = x + side * r * 0.97;
      drawFigure(canvas, look.layer, f, cx, y, r * 1.15, side * -10, 1, 0);
      if (!liquid || !shader) return;
      const back = { shader, scale: 2 };
      drawLiquid(canvas, look.film, liquid, back, f, look.room, cx, y, r, r, {
        time: 3,
        seed: i * 0.618,
        motif: i,
        tear: 0,
        modes: [-0.08, 0],
        axis: [1, 0, 0],
        hole: [0, 0, 1],
        away: [0, 0],
        partners: [],
        dyes: [],
      });
    });
    // The flash between them.
    const flash = Skia.Paint();
    flash.setBlendMode(BlendMode.Plus);
    flash.setShader(
      Skia.Shader.MakeRadialGradient(
        { x, y },
        r * 0.8,
        [Skia.Color('#fff4c8d0'), Skia.Color('#ff9a3c50'), Skia.Color('#ff5a2000')],
        [0, 0.35, 1],
        TileMode.Clamp,
      ),
    );
    canvas.drawCircle(x, y, r * 0.8, flash);
  });
}

/** The 8 among balls of the rack, drawn by the table's own shader. */
function poolPicture(w: number, h: number) {
  const { ball, effect } = getPoolGpu();
  return createPicture((canvas) => {
    const sky = Skia.Paint();
    sky.setDither(true);
    sky.setShader(
      Skia.Shader.MakeRadialGradient(
        { x: w / 2, y: h * 0.36 },
        w * 0.7,
        M.pool.sky.map((c) => Skia.Color(c)),
        null,
        TileMode.Clamp,
      ),
    );
    canvas.drawRect(Skia.XYWHRect(0, 0, w, h), sky);
    if (!effect) return;
    for (const b of M.pool.balls) {
      const r = b.r * h;
      drawDisc(canvas, ball, effect, b.ball, b.x * w, b.y * h, r, r, 1, 0, 0, AIR);
    }
  });
}

let drawn: { w: number; calm: SkPicture; showdown: SkPicture; pool: SkPicture } | null = null;
const SIDE_HEIGHT = M.height - M.inset * 2;

/** Painted once for a width; opening the menu again costs nothing. */
function pictures(w: number) {
  if (drawn?.w !== w)
    drawn = {
      w,
      calm: calmPicture(w, SIDE_HEIGHT),
      showdown: showdownPicture(w, SIDE_HEIGHT),
      pool: poolPicture(w, SIDE_HEIGHT),
    };
  return drawn;
}
type Props = { mode: Mode; onMode: (mode: Mode) => void };

/** Switches between the calm room, showdowns and 8-ball. Each side is a small window onto its own. */
export function ModeSwitch({ mode, onMode }: Props) {
  const { width } = useWindowDimensions();
  const w = (Math.min(M.width, width - MARGIN * 2) - M.inset * 4) / 3;
  const { calm, showdown, pool } = useMemo(() => pictures(w), [w]);
  return (
    <View style={styles.track} accessibilityRole="tablist" accessibilityLabel="Mode">
      {(
        [
          ['calm', 'Calm', 'calm', calm],
          ['showdown', 'Showdown', 'SHOWDOWN', showdown],
          ['pool', '8-ball', '8-ball', pool],
        ] as const
      ).map(([id, name, label, picture]) => {
        const on = id === mode;
        return (
          <Pressable
            key={id}
            onPress={() => !on && onMode(id)}
            accessibilityRole="tab"
            accessibilityLabel={name}
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [
              styles.side,
              { width: w },
              on && ON[id],
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.window, !on && { opacity: M.off }]}>
              <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                <Picture picture={picture} />
              </Canvas>
              <Text allowFontScaling={false} style={NAME[id]}>
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'center',
    height: M.height,
    padding: M.inset,
    gap: M.inset,
    borderRadius: M.corner,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  side: { height: SIDE_HEIGHT, borderRadius: M.corner - M.inset },
  window: {
    flex: 1,
    borderRadius: M.corner - M.inset,
    overflow: 'hidden',
  },
  calmOn: { boxShadow: '0 0 0 2px #cfe4ff, 0 0 14px rgba(140,190,255,0.6)' },
  showdownOn: { boxShadow: '0 0 0 2px #ffd35c, 0 0 14px rgba(255,110,50,0.8)' },
  poolOn: { boxShadow: '0 0 0 2px #96cdf0, 0 0 14px rgba(70,170,220,0.7)' },
  pressed: { transform: [{ scale: 0.96 }] },
  calmName: {
    position: 'absolute',
    left: 18,
    bottom: 10,
    color: '#fff',
    fontSize: 19,
    fontWeight: '200',
    letterSpacing: 3,
  },
  showdownName: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 5,
    textAlign: 'center',
    color: '#fff3c4',
    fontFamily: 'Futura-CondensedExtraBold',
    fontSize: 17,
    letterSpacing: 0.6,
    textShadowColor: '#4a0a20',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 2 },
  },
  poolName: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 5,
    textAlign: 'center',
    color: '#e2f4ff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: '#04080f',
    textShadowRadius: 3,
  },
});

const ON = { calm: styles.calmOn, showdown: styles.showdownOn, pool: styles.poolOn };
const NAME = { calm: styles.calmName, showdown: styles.showdownName, pool: styles.poolName };
