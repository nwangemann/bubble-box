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
import { scaleAt } from '@/core/projection';
import type { Box } from '@/core/types';
import { INK, oval, poly, scatter, type Shape } from '@/showdown/shapes';
import type { Fighter, Theme } from '@/showdown/types';
import type { View } from './drawScene';

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

/** Scenery for an arena. Its floor is the floor of the box. */
export function arenaPicture(theme: Theme, box: Box, view: View): SkPicture {
  const k = scaleAt(box, box.depth);
  const horizon = box.hh * k;
  return createPicture((canvas) => {
    canvas.save();
    canvas.translate(view.cx, view.cy);
    canvas.scale(view.ppu, view.ppu);
    const grade = (colors: string[], from: number, to: number) => {
      const paint = Skia.Paint();
      paint.setDither(true);
      paint.setShader(
        Skia.Shader.MakeLinearGradient(
          { x: 0, y: from },
          { x: 0, y: to },
          colors.map((c) => Skia.Color(c)),
          null,
          TileMode.Clamp,
        ),
      );
      canvas.drawRect({ x: -1, y: from, width: 2, height: to - from + 0.01 }, paint);
    };
    grade(theme.sky, -box.hh, horizon);
    const { near, far, pattern, ink } = theme.floor;
    grade([far, near], horizon, box.hh);
    canvas.save();
    canvas.clipRect(
      { x: -1, y: horizon, width: 2, height: box.hh - horizon },
      ClipOp.Intersect,
      true,
    );
    drawShapes(canvas, floorShapes(pattern, ink, box));
    canvas.restore();
    drawShapes(canvas, theme.scenery({ horizon, top: -box.hh, bottom: box.hh }));
    canvas.restore();
  });
}

function floorShapes(pattern: Theme['floor']['pattern'], ink: string, box: Box): Shape[] {
  const at = (x: number, t: number): [number, number] => {
    const s = scaleAt(box, t * box.depth);
    return [x * s, box.hh * s];
  };
  if (pattern === 'checker') {
    const tiles: Shape[] = [];
    for (let i = -8; i < 8; i++)
      for (let j = 0; j < 6; j++) {
        if ((i + j) % 2) continue;
        const [x, t] = [i / 4, j / 6];
        tiles.push({
          d: poly(...at(x, t), ...at(x + 0.25, t), ...at(x + 0.25, t + 1 / 6), ...at(x, t + 1 / 6)),
          fill: ink,
        });
      }
    return tiles;
  }
  if (pattern === 'planks')
    return [
      ...Array.from({ length: 17 }, (_, i) => {
        const x = (i - 8) / 4;
        return { d: poly(...at(x, 0), ...at(x, 1)), line: ink, w: 0.012 };
      }),
      ...scatter(22, (a, b) => {
        const x = Math.floor(a * 16 - 8) / 4;
        return { d: poly(...at(x, b), ...at(x + 0.25, b)), line: ink, w: 0.01 };
      }),
    ];
  if (pattern === 'craters')
    return scatter(16, (a, b, c) => {
      const [x, y] = at(a * 4 - 2, b);
      const r = 0.05 + c * 0.12;
      return [
        { d: oval(x, y, r, r * 0.35), fill: ink },
        { d: oval(x, y + r * 0.1, r * 0.85, r * 0.25), fill: '#ffffff22' },
      ];
    }).flat();
  return scatter(70, (a, b, c) => {
    const [x, y] = at(a * 4 - 2, b);
    return { d: oval(x, y, 0.01 + c * 0.04, 0.006 + c * 0.006), fill: `${ink}66` };
  });
}
