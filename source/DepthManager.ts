import { Container } from "pixi.js";

type DisplayObject = Container;

export interface DepthSortableSprite {
  sprite: DisplayObject;
  yPosition: number;
  type: "character" | "npc" | "object";
  id: string;
}

export class DepthManager {
  private container: Container;
  private sprites: Map<string, DepthSortableSprite> = new Map();
  private needsSort: boolean = false;

  constructor(container: Container) {
    this.container = container;
  }

  registerSprite(
    id: string,
    sprite: DisplayObject,
    yPosition: number,
    type: "character" | "npc" | "object",
  ): void {
    // Check if already registered
    if (this.sprites.has(id)) {
      this.updateSpritePosition(id, yPosition);
      return;
    }

    // Remove from old container if it has a parent
    if (sprite.parent && sprite.parent !== this.container) {
      sprite.parent.removeChild(sprite);
    }

    // Add to our managed container only if not already there
    if (sprite.parent !== this.container) {
      this.container.addChild(sprite);
    }

    // Track it for depth sorting
    this.sprites.set(id, { sprite, yPosition, type, id });

    // Mark as needing sort instead of sorting immediately (more efficient)
    this.needsSort = true;
    this.sortSpritesIfNeeded();
  }

  unregisterSprite(id: string): void {
    const spriteData = this.sprites.get(id);
    if (spriteData) {
      // Remove from container
      if (spriteData.sprite.parent === this.container) {
        this.container.removeChild(spriteData.sprite);
      }
      // Remove from tracking
      this.sprites.delete(id);
    }
  }

  updateSpritePosition(id: string, yPosition: number): void {
    const spriteData = this.sprites.get(id);
    if (spriteData) {
      const oldPosition = spriteData.yPosition;
      spriteData.yPosition = yPosition;

      // Only resort if the Y position actually changed significantly
      // This is more like classic SCUMM behavior
      if (Math.abs(oldPosition - yPosition) > 1) {
        this.needsSort = true;
      }
    }
  }

  sortSpritesIfNeeded(): void {
    if (this.needsSort) {
      this.sortSprites();
      this.needsSort = false;
    }
  }

  sortSprites(): void {
    const spritesArray = Array.from(this.sprites.values());

    // Sort by Y position (lower Y = rendered behind, higher Y = rendered in front)
    spritesArray.sort((a, b) => a.yPosition - b.yPosition);

    // Filter to only sprites that are actually in our container
    const validSprites = spritesArray.filter(
      (spriteData) =>
        spriteData.sprite &&
        !spriteData.sprite.destroyed &&
        spriteData.sprite.parent === this.container,
    );

    // Reorder children in container based on sort
    validSprites.forEach((spriteData, index) => {
      try {
        this.container.setChildIndex(spriteData.sprite, index);
      } catch {
        // Remove problematic sprite from tracking
        this.sprites.delete(spriteData.id);
      }
    });

    // Clean up sprites that are no longer in the container
    for (const [id, spriteData] of this.sprites.entries()) {
      if (
        !spriteData.sprite ||
        spriteData.sprite.destroyed ||
        spriteData.sprite.parent !== this.container
      ) {
        this.sprites.delete(id);
      }
    }
  }

  // Force a re-sort (useful after stage transitions)
  forceSortSprites(): void {
    this.needsSort = true;
    this.sortSpritesIfNeeded();
  }

  getContainer(): Container {
    return this.container;
  }

  // Debug method
  logSpriteInfo(): void {
    console.log("Current depth-managed sprites:");
    Array.from(this.sprites.values())
      .sort((a, b) => a.yPosition - b.yPosition)
      .forEach((sprite, index) => {
        console.log(
          `  ${index}: ${sprite.id} (${sprite.type}) at Y=${sprite.yPosition}`,
        );
      });
  }
}
