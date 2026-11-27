import { CanvasSource, Renderer, Sprite, Texture } from "pixi.js";
import { cutPolygon, type WalkBehind } from "./walkBehinds";

/**
 * Sprites for a stage's walk-behinds, cut out of its background texture.
 * Each sprite is positioned exactly over the painted object; the caller
 * registers it for depth sorting at the walk-behind's depth line.
 */
export class WalkBehindLayer {
  readonly sprites: { def: WalkBehind; sprite: Sprite }[] = [];
  private readonly textures: Texture[] = [];

  /**
   * @param background the stage's background texture
   * @param area the size the background is drawn at (polygons use this space)
   * @param offset where the background's top-left is drawn
   */
  constructor(
    renderer: Renderer,
    background: Texture,
    defs: WalkBehind[],
    area: { width: number; height: number },
    offset: { x: number; y: number },
  ) {
    if (defs.length === 0) return;
    const { pixels, width, height } = renderer.extract.pixels(background);
    const sx = width / area.width;
    const sy = height / area.height;

    for (const def of defs) {
      const polygon = def.polygon.map((p) => ({ x: p.x * sx, y: p.y * sy }));
      const cut = cutPolygon(pixels, width, height, polygon);
      if (cut.width === 0 || cut.height === 0) continue;

      const canvas = document.createElement("canvas");
      canvas.width = cut.width;
      canvas.height = cut.height;
      canvas
        .getContext("2d")!
        .putImageData(new ImageData(cut.data, cut.width, cut.height), 0, 0);
      const texture = new Texture({
        source: new CanvasSource({ resource: canvas, scaleMode: "nearest" }),
      });
      this.textures.push(texture);

      const sprite = new Sprite(texture);
      sprite.x = offset.x + cut.x / sx;
      sprite.y = offset.y + cut.y / sy;
      sprite.scale.set(1 / sx, 1 / sy);
      this.sprites.push({ def, sprite });
    }
  }

  destroy(): void {
    for (const { sprite } of this.sprites) sprite.destroy();
    for (const t of this.textures) t.destroy(true);
    this.sprites.length = 0;
  }
}
