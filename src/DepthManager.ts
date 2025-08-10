import { Container, DisplayObject } from "pixi.js";

export interface DepthSortableSprite {
  sprite: DisplayObject;
  yPosition: number;
  id: string;
  type: "character" | "npc" | "object";
}

export class DepthManager {
  private container: Container;
  private sprites: Map<string, DepthSortableSprite> = new Map();
  private needsSort = false;

  constructor(container: Container) {
    this.container = container;
  }

  // Register a sprite for depth sorting
  registerSprite(
    id: string,
    sprite: DisplayObject,
    yPosition: number,
    type: "character" | "npc" | "object",
  ): void {
    const sortableSprite: DepthSortableSprite = {
      sprite,
      yPosition,
      id,
      type,
    };

    this.sprites.set(id, sortableSprite);

    // Add to container if not already present
    if (!sprite.parent || sprite.parent !== this.container) {
      this.container.addChild(sprite);
    }

    this.needsSort = true;
    console.log(
      `Registered ${type} sprite ${id} at Y position ${yPosition} for depth sorting`,
    );
  }

  // Update a sprite's Y position (call this when sprite moves)
  updateSpritePosition(id: string, newYPosition: number): void {
    const sortableSprite = this.sprites.get(id);
    if (sortableSprite) {
      sortableSprite.yPosition = newYPosition;
      this.needsSort = true;
    }
  }

  // Remove a sprite from depth sorting
  unregisterSprite(id: string): void {
    const sortableSprite = this.sprites.get(id);
    if (sortableSprite) {
      // Remove from container
      if (sortableSprite.sprite.parent === this.container) {
        this.container.removeChild(sortableSprite.sprite);
      }
      this.sprites.delete(id);
      console.log(`Unregistered sprite ${id} from depth sorting`);
    }
  }

  // Sort all sprites by Y position and update their z-index
  sortSprites(): void {
    if (!this.needsSort) {
      return;
    }

    // Clean up any destroyed sprites first
    this.cleanupDestroyedSprites();

    console.log(`Depth sorting ${this.sprites.size} sprites...`);

    // Convert to array and sort by Y position (lower Y = further back = lower z-index)
    const sortedSprites = Array.from(this.sprites.values()).sort(
      (a, b) => a.yPosition - b.yPosition,
    );

    // Update z-index by reordering children in container
    sortedSprites.forEach((sortableSprite, index) => {
      // Skip if sprite has been destroyed
      if (sortableSprite.sprite.destroyed) {
        console.warn(`Skipping destroyed sprite ${sortableSprite.id}`);
        return;
      }

      // Ensure sprite is a child of our container
      if (sortableSprite.sprite.parent !== this.container) {
        // Remove from current parent if it has one
        if (sortableSprite.sprite.parent) {
          sortableSprite.sprite.parent.removeChild(sortableSprite.sprite);
        }
        // Add to our container
        this.container.addChild(sortableSprite.sprite);
        console.log(
          `Moved sprite ${sortableSprite.id} to depth manager container`,
        );
      }

      // Now set the correct index
      try {
        const currentIndex = this.container.getChildIndex(
          sortableSprite.sprite,
        );
        if (currentIndex !== index) {
          this.container.setChildIndex(sortableSprite.sprite, index);
        }
      } catch (error) {
        console.error(
          `Error setting child index for sprite ${sortableSprite.id}:`,
          error,
        );
      }
    });

    this.needsSort = false;

    console.log(
      "Depth sorting completed. Render order from back to front:",
      sortedSprites.map((s) => `${s.id}(${s.type}):Y${s.yPosition}`).join(", "),
    );
  }

  // Force an immediate sort (useful after bulk operations)
  forceSortSprites(): void {
    this.needsSort = true;
    this.sortSprites();
  }

  // Clear all sprites from depth sorting
  clearAllSprites(): void {
    console.log(`Clearing ${this.sprites.size} sprites from depth sorting`);

    // Remove all sprites from container
    for (const sortableSprite of this.sprites.values()) {
      if (sortableSprite.sprite.parent === this.container) {
        this.container.removeChild(sortableSprite.sprite);
      }
    }

    this.sprites.clear();
    this.needsSort = false;
  }

  // Get all registered sprites (for debugging)
  getRegisteredSprites(): DepthSortableSprite[] {
    return Array.from(this.sprites.values());
  }

  // Get sprite count by type
  getSpriteCount(type?: "character" | "npc" | "object"): number {
    if (!type) {
      return this.sprites.size;
    }

    return Array.from(this.sprites.values()).filter(
      (sprite) => sprite.type === type,
    ).length;
  }

  // Check if sorting is needed
  needsSorting(): boolean {
    return this.needsSort;
  }

  // Clean up destroyed sprites from the registry
  cleanupDestroyedSprites(): void {
    const toRemove: string[] = [];

    for (const [id, sortableSprite] of this.sprites.entries()) {
      if (sortableSprite.sprite.destroyed) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.sprites.delete(id);
      console.log(`Cleaned up destroyed sprite: ${id}`);
    }
  }
}
