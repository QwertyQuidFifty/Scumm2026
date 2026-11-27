import {
  BlurFilter,
  CanvasSource,
  Container,
  Renderer,
  Sprite,
  Texture,
} from "pixi.js";
import {
  extractNeon,
  neonBrightness,
  type NeonSegment,
  type NeonSign,
} from "./neonSigns";

interface SegmentSprites {
  sign: NeonSign;
  segment: NeonSegment;
  /** Darkened copy of the tube, faded in when it cuts out. */
  dim: Sprite;
  /** Additive copy that brightens the tube at flicker peaks. */
  boost: Sprite;
  /** Blurred additive halo. */
  glow: Sprite;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/**
 * Animated overlays for the neon signs painted into a stage background.
 * The neon pixels are cut out of the background texture itself, so the
 * overlays line up exactly with the painted signs.
 */
export class NeonSignLayer {
  readonly container = new Container();
  private readonly parts: SegmentSprites[] = [];
  private readonly textures: Texture[] = [];

  /**
   * @param background the stage's background texture
   * @param area the size the background is drawn at (sign rects use this space)
   */
  constructor(
    renderer: Renderer,
    background: Texture,
    signs: NeonSign[],
    area: { width: number; height: number },
  ) {
    if (signs.length === 0) return;
    const { pixels, width, height } = renderer.extract.pixels(background);
    const sx = width / area.width;
    const sy = height / area.height;

    for (const sign of signs) {
      for (const segment of sign.segments) {
        const r = segment.rect;
        const crop = { x: r.x * sx, y: r.y * sy, w: r.w * sx, h: r.h * sy };
        const neon = extractNeon(pixels, width, height, crop);
        if (neon.count === 0) continue;

        const canvas = document.createElement("canvas");
        canvas.width = neon.width;
        canvas.height = neon.height;
        canvas
          .getContext("2d")!
          .putImageData(
            new ImageData(neon.data, neon.width, neon.height),
            0,
            0,
          );
        const texture = new Texture({
          source: new CanvasSource({ resource: canvas, scaleMode: "nearest" }),
        });
        this.textures.push(texture);

        const place = (): Sprite => {
          const s = new Sprite(texture);
          s.x = Math.floor(crop.x) / sx;
          s.y = Math.floor(crop.y) / sy;
          s.scale.set(1 / sx, 1 / sy);
          return s;
        };

        const dim = place();
        dim.tint = 0x241a2c;
        dim.alpha = 0;

        const glow = place();
        glow.blendMode = "add";
        glow.filters = [new BlurFilter({ strength: 10, quality: 3 })];

        const boost = place();
        boost.blendMode = "add";
        boost.alpha = 0;

        this.container.addChild(dim, glow, boost);
        this.parts.push({ sign, segment, dim, boost, glow });
      }
    }
  }

  /** Animate all signs for the current time (ms). */
  update(timeMs: number): void {
    for (const { sign, segment, dim, boost, glow } of this.parts) {
      const b = neonBrightness(segment.behaviour, timeMs, segment.seed);
      // Off: cover the painted tube with a dark copy. On: no cover.
      dim.alpha = clamp((0.9 - b) / 0.8, 0, 0.92);
      // Peaks: brighten the tube itself.
      boost.alpha = clamp((b - 0.9) * 2.5, 0, 0.6);
      // Halo follows the brightness.
      glow.alpha = sign.glow * clamp(b, 0, 1.15) * 0.6;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
    for (const t of this.textures) t.destroy(true);
    this.parts.length = 0;
  }
}
