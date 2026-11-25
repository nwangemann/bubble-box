import {
  BlurStyle,
  createPicture,
  PaintStyle,
  Skia,
  TileMode,
  type SkPicture,
} from '@shopify/react-native-skia';
import type { RoomLook } from '@/config/environments';
import { scaleAt } from '@/core/projection';
import type { Box } from '@/core/types';
import type { View } from './drawScene';
import { getGpu } from './gpu';
import { drawMaterial } from './walls';

type P3 = [number, number, number];

/** Records the static room: backdrop, faces, edges and grid. Called when the environment changes. */
export function roomPicture(box: Box, view: View, env: RoomLook): SkPicture {
  const at = ([x, y, z]: P3) => {
    const s = scaleAt(box, z) * view.ppu;
    return { x: view.cx + x * s, y: view.cy + y * s };
  };
  const mix = (p: P3, q: P3, t: number): P3 => [
    p[0] + (q[0] - p[0]) * t,
    p[1] + (q[1] - p[1]) * t,
    p[2] + (q[2] - p[2]) * t,
  ];
  const { hw, hh, depth } = box;
  const faces: [P3, P3, P3, P3][] = [
    [
      [-hw, -hh, 0],
      [-hw, hh, 0],
      [-hw, hh, depth],
      [-hw, -hh, depth],
    ],
    [
      [hw, -hh, 0],
      [hw, hh, 0],
      [hw, hh, depth],
      [hw, -hh, depth],
    ],
    [
      [-hw, -hh, 0],
      [hw, -hh, 0],
      [hw, -hh, depth],
      [-hw, -hh, depth],
    ],
    [
      [-hw, hh, 0],
      [hw, hh, 0],
      [hw, hh, depth],
      [-hw, hh, depth],
    ],
    [
      [-hw, -hh, depth],
      [hw, -hh, depth],
      [hw, hh, depth],
      [-hw, hh, depth],
    ],
  ];
  const [r, g, b] = env.ink;
  const ink = (a: number) => Float32Array.of(r / 255, g / 255, b / 255, a);

  return createPicture((canvas) => {
    const back = Skia.Paint();
    back.setDither(true);
    back.setShader(
      Skia.Shader.MakeRadialGradient(
        { x: view.cx, y: view.cy },
        view.cy * 1.15,
        env.backdrop.map((c) => Skia.Color(c)),
        null,
        TileMode.Clamp,
      ),
    );
    canvas.drawRect({ x: 0, y: 0, width: view.cx * 2, height: view.cy * 2 }, back);

    drawMaterial(canvas, getGpu().walls.materials, box, view, env);

    const fill = Skia.Paint();
    fill.setAntiAlias(true);
    const line = Skia.Paint();
    line.setAntiAlias(true);
    line.setStyle(PaintStyle.Stroke);
    // Softness turns hard lines into wide, dim ones.
    const blur = (env.softness * view.ppu) / 40;
    if (blur > 0.3) line.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
    const widen = 1 + env.softness * 4;
    faces.forEach((face, i) => {
      const path = Skia.Path.Polygon(face.map(at), true);
      if (env.faceOpacity > 0) {
        fill.setColor(ink(env.faceOpacity * (i === 4 ? 0.5 : i === 2 ? 1.4 : 1)));
        canvas.drawPath(path, fill);
      }
      if (env.edgeOpacity > 0) {
        line.setStrokeWidth(widen);
        line.setColor(ink(env.edgeOpacity));
        canvas.drawPath(path, line);
      }
    });
    line.setStrokeWidth(0.7 * widen);
    line.setColor(ink(env.gridOpacity));
    for (const [p, q, s, t] of faces) {
      for (let i = 1; i < env.grid; i++) {
        const k = i / env.grid;
        for (const [from, to] of [
          [at(mix(p, q, k)), at(mix(t, s, k))],
          [at(mix(p, t, k)), at(mix(q, s, k))],
        ] as const)
          canvas.drawLine(from.x, from.y, to.x, to.y, line);
      }
    }
  });
}
