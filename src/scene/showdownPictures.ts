import {
  BlurStyle,
  ClipOp,
  createPicture,
  FilterMode,
  MipmapMode,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkCanvas,
  type SkImage,
  type SkPicture,
} from '@shopify/react-native-skia';
import { ARENA } from '@/config/arena';
import { scaleAt } from '@/core/projection';
import type { Box } from '@/core/types';
import { INK, type Shape } from '@/showdown/shapes';
import type { Fighter, Theme } from '@/showdown/types';
import type { View } from './drawScene';
import { roomPicture } from './roomPicture';

/** Everything here is recorded once on the JS thread and only replayed in the frame loop. */

function path(d: string) {
  const p = Skia.Path.MakeFromSVGString(d);
  if (!p) console.error('Not a path:', d);
  return p ?? Skia.Path.Make();
}

export function drawShapes(canvas: SkCanvas, shapes: Shape[]) {
  for (const s of shapes) {
    const p = path(s.d);
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    if (s.blur) paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, s.blur, true));
    if (s.flip) {
      canvas.save();
      canvas.scale(-1, 1);
    }
    if (s.fill) {
      paint.setColor(Skia.Color(s.fill));
      canvas.drawPath(p, paint);
    }
    if (s.line) {
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeWidth(s.w ?? 0.05);
      paint.setColor(Skia.Color(s.line));
      canvas.drawPath(p, paint);
    }
    if (s.flip) canvas.restore();
  }
}

/** Cartoon outlines become soft seams, as on something moulded rather than drawn. */
const soften = (shapes: Shape[]): Shape[] =>
  shapes.map((s) =>
    s.fill && s.line === INK ? { ...s, line: '#1c133055', w: (s.w ?? 0.05) * 0.5 } : s,
  );

/** A figure as it floats inside its bubble, lit from the upper left. */
function drawFigure(canvas: SkCanvas, f: Fighter) {
  if (f.back) drawShapes(canvas, soften(f.back));
  const ball = Skia.Path.Circle(0, 0, 1);
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  const shadeBall = (colors: string[], stops: number[]) => {
    paint.setShader(
      Skia.Shader.MakeRadialGradient(
        { x: -0.35, y: -0.45 },
        1.65,
        colors.map((c) => Skia.Color(c)),
        stops,
        TileMode.Clamp,
      ),
    );
    canvas.drawPath(ball, paint);
  };
  shadeBall([f.skin[0], f.skin[0], f.skin[1]], [0, 0.2, 1]);
  canvas.save();
  canvas.clipPath(ball, ClipOp.Intersect, true);
  if (f.mark) drawShapes(canvas, soften(f.mark));
  canvas.restore();
  drawShapes(canvas, soften(f.face));
  if (f.front) drawShapes(canvas, soften(f.front));
  if (f.hat) drawShapes(canvas, soften(f.hat));
  // Shade falls over everything on the ball, so it reads as round.
  shadeBall(['#ffffff30', '#ffffff00', '#0a041800', '#0a0418a0'], [0, 0.3, 0.5, 1]);
}

/** Figures are painted once into images this many pixels wide, reaching this many radii. */
const FIGURE = { pixels: 640, reach: 2.2 };

export type FighterLook = {
  figure: SkImage | null;
  src: { x: number; y: number; width: number; height: number };
  /** In figure radii. */
  dest: { x: number; y: number; width: number; height: number };
  lit: number[];
  shade: number[];
};

export function fighterLook(f: Fighter): FighterLook {
  const { pixels, reach } = FIGURE;
  const surface = Skia.Surface.Make(pixels, pixels);
  const canvas = surface?.getCanvas();
  if (canvas) {
    canvas.translate(pixels / 2, pixels / 2);
    canvas.scale(pixels / 2 / reach, pixels / 2 / reach);
    drawFigure(canvas, f);
  }
  const rgb = (c: string) => [...Skia.Color(c)].slice(0, 3);
  return {
    figure: surface?.makeImageSnapshot() ?? null,
    src: { x: 0, y: 0, width: pixels, height: pixels },
    dest: { x: -reach, y: -reach, width: reach * 2, height: reach * 2 },
    lit: rgb(f.skin[0]),
    shade: rgb(f.skin[1]),
  };
}

/** A picture of the view painted once, for films to bend. `scale` is its pixels per point. */
export function pictureShader(picture: SkPicture, width: number, height: number, scale: number) {
  const surface = Skia.Surface.Make(Math.ceil(width * scale), Math.ceil(height * scale));
  if (!surface) return null;
  const canvas = surface.getCanvas();
  canvas.scale(scale, scale);
  canvas.drawPicture(picture);
  return surface
    .makeImageSnapshot()
    .makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
}

/** The core room in a theme's colours, with its mural showing faintly through the back wall. */
export function arenaPicture(theme: Theme, box: Box, view: View): SkPicture {
  const { mural, horizon, ...look } = ARENA;
  const env = { ...look, backdrop: theme.backdrop, ink: theme.ink };
  const room = roomPicture(box, view, env);
  const { hw, hh } = box;
  const s = scaleAt(box, box.depth) * view.ppu;
  return createPicture((canvas) => {
    canvas.drawPicture(room);
    canvas.save();
    canvas.translate(view.cx, view.cy);
    canvas.scale(s, s);
    canvas.clipRect({ x: -hw, y: -hh, width: hw * 2, height: hh * 2 }, ClipOp.Intersect, true);
    const ghost = Skia.Paint();
    ghost.setAlphaf(mural);
    canvas.saveLayer(ghost);
    drawShapes(canvas, theme.mural({ horizon: hh * horizon, top: -hh, bottom: hh }));
    canvas.restore();
    canvas.restore();
  });
}
