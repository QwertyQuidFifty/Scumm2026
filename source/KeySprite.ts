import { Container, Graphics } from "pixi.js";

export class KeySprite extends Container {
  private keyGraphics: Graphics;
  private readonly keyColor: number = 0xffd700; // Gold color
  private readonly outlineColor: number = 0x000000; // Black outline
  private readonly keyScale: number = 3; // Scale up for visibility

  constructor() {
    super();
    this.keyGraphics = new Graphics();
    this.addChild(this.keyGraphics);
    this.drawKey();
    this.scale.set(this.keyScale, this.keyScale);
  }

  private drawKey(): void {
    this.keyGraphics.clear();

    // Key dimensions (before scaling): 16x8 pixels

    // Draw key body (horizontal rectangle)
    this.keyGraphics.rect(0, 2, 12, 4).fill(this.keyColor);

    // Draw key head (circular part)
    this.keyGraphics.circle(2, 4, 3).fill(this.keyColor);

    // Draw key teeth (small rectangles at the end)
    this.keyGraphics.rect(12, 1, 2, 2).fill(this.keyColor);

    this.keyGraphics.rect(12, 5, 2, 2).fill(this.keyColor);

    // Add black outline for better visibility
    this.keyGraphics
      .rect(0, 2, 12, 4)
      .stroke({ color: this.outlineColor, width: 0.5 });

    this.keyGraphics
      .circle(2, 4, 3)
      .stroke({ color: this.outlineColor, width: 0.5 });

    this.keyGraphics
      .rect(12, 1, 2, 2)
      .stroke({ color: this.outlineColor, width: 0.5 });

    this.keyGraphics
      .rect(12, 5, 2, 2)
      .stroke({ color: this.outlineColor, width: 0.5 });
  }

  getActualWidth(): number {
    return 16 * this.keyScale;
  }

  getActualHeight(): number {
    return 8 * this.keyScale;
  }

  destroy(): void {
    this.keyGraphics.destroy();
    super.destroy();
  }
}
