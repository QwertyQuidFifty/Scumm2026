import { Container, Graphics } from "pixi.js";
import type { PixelArtImage } from "./overlays/openDoorway";
import { buildKeyArt } from "./sprites/keyArt";

/** Draw pixel art into a Graphics, each art pixel a pixelSize square. */
export function drawPixelArt(graphics: Graphics, art: PixelArtImage): void {
  const size = art.pixelSize;
  art.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const entry = art.palette[row[x]];
      if (!entry) continue; // '.' and unknown keys are transparent
      graphics
        .rect(x * size, y * size, size, size)
        .fill({ color: entry.color, alpha: entry.alpha });
    }
  });
}

/** The golden key lying in the scene (48x24, matching its click area). */
export class KeySprite extends Container {
  private keyGraphics: Graphics;

  constructor() {
    super();
    this.keyGraphics = new Graphics();
    drawPixelArt(this.keyGraphics, buildKeyArt(2));
    this.addChild(this.keyGraphics);
  }

  destroy(): void {
    this.keyGraphics.destroy();
    super.destroy();
  }
}
