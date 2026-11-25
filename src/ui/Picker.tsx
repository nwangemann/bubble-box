import { Canvas, ClipOp, createPicture, Picture, Skia } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import type { CustomLook } from '@/config/custom';
import {
  boxPool,
  feelPool,
  fxPools,
  glassPool,
  lightPool,
  mergePool,
  pullPool,
  ROWS,
  stylePool,
  tapPool,
  trailPool,
  type Setting,
  type Settings,
} from '@/config/defaults';
import {
  dress,
  type BoxLook,
  type Environment,
  type Light,
  type Walls,
} from '@/config/environments';
import { TUNING } from '@/config/tuning';
import { layoutCells } from '@/preview/layout';
import { createStage, play, playToStill, type Part, type Stage } from '@/preview/scripts';
import { drawScene } from '@/scene/drawScene';
import { throughGlass } from '@/scene/glassFilter';
import { getGpu } from '@/scene/gpu';
import { roomPicture } from '@/scene/roomPicture';
import { drawWallLight } from '@/scene/walls';

const P = TUNING.preview;

type Props = {
  setting: Setting;
  settings: Settings;
  mine: CustomLook;
  /** The box and light in use, which Random may have chosen. */
  look: BoxLook;
  light: Light;
  walls: Walls;
  /** Reduce Motion: previews are stills. */
  calm: boolean;
  onPick: (id: string) => void;
  onClose: () => void;
};

/** Every option of one setting, alive, on one canvas. */
export function Picker({
  setting,
  settings,
  mine,
  look,
  light,
  walls,
  calm,
  onPick,
  onClose,
}: Props) {
  const { width, height } = useWindowDimensions();
  const [gpu] = useState(getGpu);
  const [layer] = useState(() => Skia.Paint());
  const [finger] = useState(() => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    return p;
  });
  const row = ROWS.find((r) => r.key === setting)!;
  const density = PixelRatio.get();

  const cells = useMemo(() => {
    const rects = layoutCells(row.options.length, width, height);
    return row.options.map(({ id, name }, i) => {
      const rect = rects[i]!;
      const chosen = (key: Setting) => (key === setting ? id : settings[key]);
      const ppu = rect.width / 2;
      const box = {
        hw: 1,
        hh: rect.height / rect.width,
        depth: P.depth,
        focal: TUNING.box.focal,
      };
      const envs: Environment[] =
        setting === 'box'
          ? boxPool(id).map((b) => dress(b, light, walls))
          : setting === 'light'
            ? lightPool(id).map((l) => dress(look, l, walls))
            : [dress(look, light, walls)];
      const local = { cx: rect.width / 2, cy: rect.height / 2, ppu };
      const glasses = glassPool(chosen('glass'));
      const part: Part = {
        kind: setting,
        box,
        styles: stylePool(chosen('bubble')),
        feels: feelPool(chosen('feel')),
        taps: tapPool(chosen('tap')),
        fx: fxPools(chosen('meet'), chosen('pop')),
        merges: mergePool(chosen('contact')),
        pulls: pullPool(chosen('pull')),
        trails: trailPool(chosen('trail')),
        bounce: setting === 'box' || setting === 'light' ? envs[0]!.bounce : 1,
        // Feels start together, to be compared.
        delay: setting === 'feel' ? 0 : i * P.stagger,
      };
      return {
        id,
        name,
        rect,
        part,
        envs,
        glasses,
        bends: setting === 'glass' ? glasses.map((g) => g.bend > 0) : [false],
        rooms:
          setting === 'box' ||
          setting === 'light' ||
          setting === 'feel' ||
          setting === 'glass' ||
          setting === 'trail'
            ? envs.map((e) => roomPicture(box, local, e))
            : [],
        view: { cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2, ppu },
        clip: Skia.RRectXY(
          Skia.XYWHRect(rect.x, rect.y, rect.width, rect.height),
          P.corner,
          P.corner,
        ),
      };
    });
  }, [row, setting, settings, look, light, walls, width, height]);

  const stages = useSharedValue<Stage[]>([]);
  const drawn = useSharedValue<unknown>(null);
  const picture = useSharedValue(createPicture(() => {}));

  useFrameCallback((frame) => {
    const dt = (frame.timeSincePreviousFrame ?? 0) / 1000;
    if (calm && drawn.value === width) return;
    if (stages.value.length !== cells.length || calm) {
      stages.value = cells.map((a) => {
        'worklet';
        return createStage(a.part);
      });
    }
    drawn.value = calm ? width : null;
    const all = stages.value;
    for (let i = 0; i < cells.length; i++) {
      if (calm) playToStill(all[i]!, cells[i]!.part);
      else play(all[i]!, cells[i]!.part, dt);
    }
    picture.value = createPicture((canvas) => {
      'worklet';
      for (let i = 0; i < cells.length; i++) {
        const a = cells[i]!;
        const { world, clock, turn, finger: touch } = all[i]!;
        const n = a.envs.length;
        const e = a.envs[turn % n]!;
        const content = () => {
          'worklet';
          if (a.rooms.length > 0) {
            canvas.save();
            canvas.translate(a.rect.x, a.rect.y);
            canvas.drawPicture(a.rooms[turn % n]!);
            // Random boxes melt into the next.
            const melt = n > 1 ? (clock - (P.loop.box - P.melt)) / P.melt : 0;
            if (melt > 0) {
              layer.setAlphaf(Math.min(1, melt));
              canvas.saveLayer(layer);
              canvas.drawPicture(a.rooms[(turn + 1) % n]!);
              canvas.restore();
            }
            canvas.restore();
          }
          if (a.rooms.length > 0)
            drawWallLight(
              canvas,
              gpu.lightPaint,
              gpu.walls.light,
              world,
              a.part.box,
              a.view,
              e,
              world.time,
              mine,
            );
          drawScene(
            canvas,
            gpu.bubblePaint,
            gpu.ripplePaint,
            gpu.burstPaint,
            gpu.fx,
            gpu.burstFx,
            world,
            a.part.box,
            a.view,
            e,
            a.bends,
            mine,
            gpu.trails,
          );
        };
        canvas.save();
        canvas.clipRRect(a.clip, ClipOp.Intersect, true);
        const bending = a.glasses.find((g) => g.bend > 0);
        const waves = world.waves.filter((v) => a.bends[Math.floor(v.variant * a.bends.length)]);
        if (gpu.glassEffect && bending && waves.length > 0)
          throughGlass(
            canvas,
            gpu.glassPaint,
            gpu.glassEffect,
            waves,
            bending,
            a.view,
            density,
            content,
            a.rect,
          );
        else content();
        if (touch > 0.01) {
          finger.setColor(Float32Array.of(1, 1, 1, 0.3 * touch));
          canvas.drawCircle(a.view.cx, a.view.cy, P.finger, finger);
        }
        canvas.restore();
      }
    });
  });

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
      <Text style={styles.title} accessibilityRole="header" pointerEvents="none">
        {row.label}
      </Text>
      {cells.map(({ id, name, rect }) => {
        const on = id === settings[setting];
        return (
          <Pressable
            key={id}
            onPress={() => onPick(id)}
            accessibilityRole="button"
            accessibilityLabel={name}
            accessibilityState={{ selected: on }}
            style={[
              styles.cell,
              { left: rect.x, top: rect.y, width: rect.width, height: rect.height + P.label },
            ]}
          >
            <View style={[styles.frame, { height: rect.height }, on && styles.frameOn]} />
            <Text numberOfLines={1} style={[styles.name, on && styles.on]}>
              {name}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close previews"
        style={styles.handle}
      >
        <View style={styles.dot} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // The paused room stays faintly visible.
  veil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,8,20,0.8)' },
  title: {
    position: 'absolute',
    top: P.top - 36,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    letterSpacing: 0.6,
  },
  cell: { position: 'absolute', alignItems: 'center' },
  frame: {
    alignSelf: 'stretch',
    borderRadius: P.corner,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  frameOn: { borderColor: 'rgba(255,255,255,0.28)' },
  name: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.3,
    lineHeight: P.label,
  },
  on: { color: '#fff', fontWeight: '500' },
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
