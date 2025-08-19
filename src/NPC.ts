import { Sprite } from "pixi.js";
import { Position } from "./types";
import { CharacterSprites, Direction } from "./SpriteGenerator";

export interface NPCData {
  id: string;
  name: string;
  position: Position;
  description: string;
  dialogues?: string[]; // Potential dialogue lines for future use
  defaultAction?: string; // Default action when right-clicking (usually "talk")
  spriteType?: string; // Type of sprite to use (basic, bartender, customer, mechanic)
  interactionPoint?: Position; // Where the character should stand to interact with this NPC
  facingDirection?: Direction; // Which direction the NPC should face (default: down)
}

interface NPCMovementState {
  isMoving: boolean;
  startPosition: Position;
  targetPosition: Position;
  startTime: number;
  duration: number;
}

interface NPCAnimationState {
  currentFrame: "idle" | "walk1" | "walk2" | "talk";
  frameStartTime: number;
  frameDuration: number; // 300ms as per spec
  isWalking: boolean;
}

export class NPC {
  private sprite: Sprite;
  private data: NPCData;
  private sprites: CharacterSprites;
  private currentFrame: "idle" | "talk" = "idle";
  private movementState: NPCMovementState;
  private animationState: NPCAnimationState;
  private moveSpeed: number = 120; // Slightly slower than player for NPCs
  private walkableArea?: Position[];
  private onPositionChange?: (npcId: string, position: Position) => void;
  private currentDialogueIndex: number = 0; // Track which dialogue to show next
  private facingDirection: Direction; // Which direction this NPC faces

  constructor(data: NPCData, sprites: CharacterSprites) {
    this.data = data;
    this.sprites = sprites;
    this.facingDirection = data.facingDirection || "down"; // Use specified direction or default to down

    // Create sprite with idle animation in the specified direction
    this.sprite = new Sprite(sprites[this.facingDirection].idle);

    // Set anchor to bottom center (0.5, 1.0) so sprite aligns naturally to ground
    this.sprite.anchor.set(0.5, 1.0);

    // Position the sprite
    this.sprite.x = data.position.x;
    this.sprite.y = data.position.y;

    // Initialize movement state
    this.movementState = {
      isMoving: false,
      startPosition: { x: data.position.x, y: data.position.y },
      targetPosition: { x: data.position.x, y: data.position.y },
      startTime: 0,
      duration: 0,
    };

    // Initialize animation state
    this.animationState = {
      currentFrame: "idle",
      frameStartTime: 0,
      frameDuration: 300, // 300ms per frame
      isWalking: false,
    };

    // Debug sprite properties
    console.log(`NPC ${data.name} created:`, {
      x: this.sprite.x,
      y: this.sprite.y,
      visible: this.sprite.visible,
      alpha: this.sprite.alpha,
      width: this.sprite.width,
      height: this.sprite.height,
      textureValid: !!sprites.down.idle,
      textureWidth: sprites.down.idle?.width,
      textureHeight: sprites.down.idle?.height,
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
    return (
      this.data.interactionPoint || {
        x: this.sprite.x,
        y: this.sprite.y + 30, // Default: stand slightly below NPC
      }
    );
  }

  // Get available dialogues
  getDialogues(): string[] {
    return this.data.dialogues || [];
  }

  // Get the next dialogue line (cycles through available dialogues)
  getNextDialogue(): string | null {
    const dialogues = this.getDialogues();
    if (dialogues.length === 0) {
      return null;
    }

    const dialogue = dialogues[this.currentDialogueIndex];
    this.currentDialogueIndex =
      (this.currentDialogueIndex + 1) % dialogues.length;

    console.log(
      `NPC ${this.data.name} dialogue: "${dialogue}" (${this.currentDialogueIndex}/${dialogues.length})`,
    );
    return dialogue;
  }

  // Get a random dialogue line
  getRandomDialogue(): string | null {
    const dialogues = this.getDialogues();
    if (dialogues.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * dialogues.length);
    const dialogue = dialogues[randomIndex];

    console.log(`NPC ${this.data.name} random dialogue: "${dialogue}"`);
    return dialogue;
  }

  // Reset dialogue index to start from beginning
  resetDialogueIndex(): void {
    this.currentDialogueIndex = 0;
  }

  // Check if NPC has any dialogues
  hasDialogues(): boolean {
    return this.getDialogues().length > 0;
  }

  // Get position where speech bubble should appear (above the NPC)
  getSpeechBubblePosition(): Position {
    return {
      x: this.sprite.x,
      y: this.sprite.y - 60, // Position speech bubble above NPC
    };
  }

  // Switch to talking animation (can be used when player interacts)
  startTalking(): void {
    if (this.currentFrame !== "talk") {
      this.currentFrame = "talk";
      // For now, use walk1 as talking animation - can be enhanced later
      this.sprite.texture = this.sprites[this.facingDirection].walk1;
    }
  }

  // Return to idle animation
  stopTalking(): void {
    if (this.currentFrame !== "idle") {
      this.currentFrame = "idle";
      this.sprite.texture = this.sprites[this.facingDirection].idle;
    }
  }

  // Set walkable area for pathfinding
  setWalkableArea(walkableArea: Position[]): void {
    this.walkableArea = walkableArea;
  }

  // Set callback for position updates (for depth manager integration)
  setPositionChangeCallback(
    callback: (npcId: string, position: Position) => void,
  ): void {
    this.onPositionChange = callback;
  }

  // Check if a position is walkable
  private isPositionWalkable(x: number, y: number): boolean {
    if (!this.walkableArea || this.walkableArea.length < 3) {
      return true; // If no walkable area defined, allow all positions
    }
    return this.isPointInPolygon(x, y, this.walkableArea);
  }

  // Point in polygon test (same as CharacterController)
  private isPointInPolygon(x: number, y: number, polygon: Position[]): boolean {
    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  }

  // Move NPC to a target position
  moveTo(targetX: number, targetY: number): boolean {
    // Check if target position is walkable
    if (!this.isPositionWalkable(targetX, targetY)) {
      console.log(
        `NPC ${this.data.name} cannot move to (${targetX}, ${targetY}) - position is not walkable`,
      );
      return false;
    }

    // If already at target, don't start movement
    const currentX = this.sprite.x;
    const currentY = this.sprite.y;
    const threshold = 2; // 2 pixel threshold
    if (
      Math.abs(currentX - targetX) < threshold &&
      Math.abs(currentY - targetY) < threshold
    ) {
      return true;
    }

    // Calculate movement duration
    const deltaX = targetX - currentX;
    const deltaY = targetY - currentY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = (distance / this.moveSpeed) * 1000; // Convert to milliseconds

    // Update movement state
    this.movementState = {
      isMoving: true,
      startPosition: { x: currentX, y: currentY },
      targetPosition: { x: targetX, y: targetY },
      startTime: performance.now(),
      duration: duration,
    };

    // Start walking animation
    this.animationState.isWalking = true;
    this.animationState.frameStartTime = performance.now();

    console.log(
      `NPC ${this.data.name} moving from (${currentX.toFixed(1)}, ${currentY.toFixed(1)}) to (${targetX}, ${targetY})`,
    );
    return true;
  }

  // Check if NPC is currently moving
  isMoving(): boolean {
    return this.movementState.isMoving;
  }

  // Update movement and animation (should be called every frame)
  update(currentTime: number): void {
    this.updateMovement(currentTime);
    this.updateAnimation(currentTime);
  }

  private updateMovement(currentTime: number): void {
    if (!this.movementState.isMoving) return;

    const elapsed = currentTime - this.movementState.startTime;
    const progress = Math.min(elapsed / this.movementState.duration, 1.0);

    // Linear interpolation
    const x =
      this.movementState.startPosition.x +
      (this.movementState.targetPosition.x -
        this.movementState.startPosition.x) *
        progress;
    const y =
      this.movementState.startPosition.y +
      (this.movementState.targetPosition.y -
        this.movementState.startPosition.y) *
        progress;

    // Update sprite position
    this.sprite.x = x;
    this.sprite.y = y;

    // Update data position
    this.data.position.x = x;
    this.data.position.y = y;

    // Notify depth manager of position change
    if (this.onPositionChange) {
      this.onPositionChange(this.data.id, { x, y });
    }

    // Check if movement is complete
    if (progress >= 1.0) {
      this.movementState.isMoving = false;
      this.animationState.isWalking = false;
      this.animationState.currentFrame = "idle";
      this.sprite.texture = this.sprites[this.facingDirection].idle;
      console.log(
        `NPC ${this.data.name} arrived at (${this.sprite.x.toFixed(1)}, ${this.sprite.y.toFixed(1)})`,
      );
    }
  }

  private updateAnimation(currentTime: number): void {
    if (!this.animationState.isWalking) {
      // Make sure we're showing idle when not walking
      if (
        this.animationState.currentFrame !== "idle" &&
        this.animationState.currentFrame !== "talk"
      ) {
        this.animationState.currentFrame = "idle";
        this.sprite.texture = this.sprites[this.facingDirection].idle;
      }
      return;
    }

    // Handle walking animation frames
    const elapsed = currentTime - this.animationState.frameStartTime;

    if (elapsed >= this.animationState.frameDuration) {
      // Switch to next walking frame
      if (this.animationState.currentFrame === "walk1") {
        this.animationState.currentFrame = "walk2";
        this.sprite.texture = this.sprites[this.facingDirection].walk2;
      } else {
        this.animationState.currentFrame = "walk1";
        this.sprite.texture = this.sprites[this.facingDirection].walk1;
      }

      this.animationState.frameStartTime = currentTime;
    }
  }

  // Get bounding box for click detection
  getBounds(): { x: number; y: number; width: number; height: number } {
    const bounds = this.sprite.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  // Check if a point is within the NPC's clickable area
  containsPoint(x: number, y: number): boolean {
    const bounds = this.getBounds();
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }

  // Cleanup when NPC is removed
  destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    this.sprite.destroy();
  }
}
