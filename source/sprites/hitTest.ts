/**
 * Pixel-accurate hit testing for character sprites.
 *
 * Character frames are 32x48 pixel grids ('0' is transparent). A point
 * counts as a hit when it falls on a drawn pixel, or within `margin` grid
 * pixels of one, so characters stay easy to click without their empty
 * surroundings catching clicks meant for things behind them.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */
import { SPRITE_HEIGHT, SPRITE_WIDTH, TRANSPARENT } from "./compositor.ts";

export interface SpriteGeometry {
  /** Sprite position (its anchor point) in world coordinates. */
  x: number;
  y: number;
  /** Anchor as a fraction of the texture size (0.5, 1 = bottom centre). */
  anchorX: number;
  anchorY: number;
  /** Texture size in texture pixels, and the sprite's scale. */
  textureWidth: number;
  textureHeight: number;
  scaleX: number;
  scaleY: number;
}

/** Which frame-grid cell a world point falls in (may be outside the grid). */
export function gridCellAt(
  sprite: SpriteGeometry,
  worldX: number,
  worldY: number,
): { col: number; row: number } {
  const localX =
    (worldX - sprite.x) / sprite.scaleX + sprite.textureWidth * sprite.anchorX;
  const localY =
    (worldY - sprite.y) / sprite.scaleY + sprite.textureHeight * sprite.anchorY;
  return {
    col: Math.floor((localX / sprite.textureWidth) * SPRITE_WIDTH),
    row: Math.floor((localY / sprite.textureHeight) * SPRITE_HEIGHT),
  };
}

/** True when a drawn pixel lies within `margin` cells of (col, row). */
export function hitsDrawnPixel(
  rows: string[],
  col: number,
  row: number,
  margin = 1,
): boolean {
  for (let r = row - margin; r <= row + margin; r++) {
    const line = rows[r];
    if (!line) continue;
    for (let c = col - margin; c <= col + margin; c++) {
      const key = line[c];
      if (key !== undefined && key !== TRANSPARENT) return true;
    }
  }
  return false;
}

/** Does a world point hit the character drawn by `rows` in this sprite? */
export function spriteHit(
  rows: string[],
  sprite: SpriteGeometry,
  worldX: number,
  worldY: number,
  margin = 1,
): boolean {
  const { col, row } = gridCellAt(sprite, worldX, worldY);
  return hitsDrawnPixel(rows, col, row, margin);
}
