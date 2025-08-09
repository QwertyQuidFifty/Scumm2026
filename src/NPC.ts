import { Sprite } from "pixi.js";
import { Position } from "./types";
import { CharacterSprites } from "./SpriteGenerator";

export interface NPCData {
  id: string;
  name: string;
  position: Position;
  description: string;
  dialogues?: string[]; // Potential dialogue lines for future use
  defaultAction?: string; // Default action when right-clicking (usually "talk")
  spriteType?: string; // Type of sprite to use (basic, bartender, customer, mechanic)
  interactionPoint?: Position; // Where the character should stand to interact with this NPC
}

export class NPC {
  private sprite: Sprite;
  private data: NPCData;
  private sprites: CharacterSprites;
  private currentFrame: "idle" | "talk" = "idle";

  constructor(data: NPCData, sprites: CharacterSprites) {
    this.data = data;
    this.sprites = sprites;
    
    // Create sprite with idle animation initially
    this.sprite = new Sprite(sprites.idle);
    
    // Set anchor to bottom center (0.5, 1.0) so sprite aligns naturally to ground
    this.sprite.anchor.set(0.5, 1.0);
    
    // Position the sprite
    this.sprite.x = data.position.x;
    this.sprite.y = data.position.y;
    
    // Debug sprite properties
    console.log(`NPC ${data.name} created:`, {
      x: this.sprite.x,
      y: this.sprite.y,
      visible: this.sprite.visible,
      alpha: this.sprite.alpha,
      width: this.sprite.width,
      height: this.sprite.height,
      textureValid: !!sprites.idle,
      textureWidth: sprites.idle?.width,
      textureHeight: sprites.idle?.height
    });
  }

  getSprite(): Sprite {
    return this.sprite;
  }

  getData(): NPCData {
    return { ...this.data };
  }

  getId(): string {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  getPosition(): Position {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPosition(position: Position): void {
    this.sprite.x = position.x;
    this.sprite.y = position.y;
    this.data.position = { ...position };
  }

  getDescription(): string {
    return this.data.description;
  }

  getDefaultAction(): string {
    return this.data.defaultAction || "talk";
  }

  getInteractionPoint(): Position {
    return this.data.interactionPoint || { 
      x: this.sprite.x, 
      y: this.sprite.y + 30 // Default: stand slightly below NPC
    };
  }

  // Switch to talking animation (can be used when player interacts)
  startTalking(): void {
    if (this.currentFrame !== "talk") {
      this.currentFrame = "talk";
      // For now, use walk1 as talking animation - can be enhanced later
      this.sprite.texture = this.sprites.walk1;
    }
  }

  // Return to idle animation
  stopTalking(): void {
    if (this.currentFrame !== "idle") {
      this.currentFrame = "idle";
      this.sprite.texture = this.sprites.idle;
    }
  }

  // Get bounding box for click detection
  getBounds(): { x: number; y: number; width: number; height: number } {
    const bounds = this.sprite.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };
  }

  // Check if a point is within the NPC's clickable area
  containsPoint(x: number, y: number): boolean {
    const bounds = this.getBounds();
    return x >= bounds.x && 
           x <= bounds.x + bounds.width && 
           y >= bounds.y && 
           y <= bounds.y + bounds.height;
  }

  // Cleanup when NPC is removed
  destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    this.sprite.destroy();
  }
}