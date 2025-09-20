import { Sprite } from "pixi.js";
import { PerspectiveScale } from "./Stage";

export class PerspectiveScaler {
  private perspectiveConfig?: PerspectiveScale;
  private baseScale: number = 3; // Base scale factor for character sprite

  constructor() {}

  setPerspectiveConfig(config?: PerspectiveScale): void {
    this.perspectiveConfig = config;
  }

  setBaseScale(scale: number): void {
    this.baseScale = scale;
  }

  /**
   * Calculate the appropriate scale factor based on Y position
   * @param yPosition - Current Y position of the sprite
   * @returns Scale factor to apply to the sprite
   */
  calculateScaleFactor(yPosition: number): number {
    if (!this.perspectiveConfig) {
      return this.baseScale; // No perspective scaling, return base scale
    }

    const { minY, maxY, minScale, maxScale } = this.perspectiveConfig;

    // Clamp Y position to the perspective range
    const clampedY = Math.max(minY, Math.min(maxY, yPosition));

    // Calculate interpolation factor (0 at minY, 1 at maxY)
    const t = (clampedY - minY) / (maxY - minY);

    // Linearly interpolate between min and max scale
    const perspectiveScale = minScale + t * (maxScale - minScale);

    // Apply perspective scale to base scale
    return this.baseScale * perspectiveScale;
  }

  /**
   * Apply perspective scaling to a sprite based on its Y position
   * @param sprite - The sprite to scale
   */
  updateSpriteScale(sprite: Sprite): void {
    const scaleFactor = this.calculateScaleFactor(sprite.y);
    sprite.scale.set(scaleFactor, scaleFactor);
  }

  /**
   * Get debug information about current scaling
   * @param yPosition - Y position to check
   * @returns Debug info object
   */
  getDebugInfo(yPosition: number): {
    yPosition: number;
    scaleFactor: number;
    perspectiveEnabled: boolean;
    config?: PerspectiveScale;
  } {
    return {
      yPosition,
      scaleFactor: this.calculateScaleFactor(yPosition),
      perspectiveEnabled: !!this.perspectiveConfig,
      config: this.perspectiveConfig,
    };
  }
}
