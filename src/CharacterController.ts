import { Sprite } from "pixi.js";
import { Position } from "./types";
import { CharacterSprites } from "./SpriteGenerator";
import { InteractiveObject } from "./InteractiveObject";

interface MovementState {
  isMoving: boolean;
  startPosition: Position;
  targetPosition: Position;
  startTime: number;
  duration: number;
}

interface AnimationState {
  currentFrame: "idle" | "walk1" | "walk2";
  frameStartTime: number;
  frameDuration: number; // 300ms as per spec
  isWalking: boolean;
}

export class CharacterController {
  private sprite: Sprite;
  private sprites: CharacterSprites;
  private movementState: MovementState;
  private animationState: AnimationState;
  private moveSpeed: number = 120; // pixels per second (doubled from original 60)
  private walkableArea?: Position[]; // The street polygon

  // Interaction points for each object (within walkable area)
  private interactionPoints: Map<string, Position> = new Map([
    ["hotel-sign", { x: 202, y: 617 }], // Near hotel sign, on street
    ["bar-sign", { x: 689, y: 616 }], // Near bar sign, on street
    ["building-entrance", { x: 108, y: 646 }], // Near building entrance, on street
    ["cryptic-door", { x: 896, y: 673 }], // Right side of the street below bar entrance
    ["city-in-distance", { x: 470, y: 576 }], // City in distance, on street
  ]);

  constructor(sprite: Sprite, sprites: CharacterSprites) {
    this.sprite = sprite;
    this.sprites = sprites;

    // Initialize movement state
    this.movementState = {
      isMoving: false,
      startPosition: { x: sprite.x, y: sprite.y },
      targetPosition: { x: sprite.x, y: sprite.y },
      startTime: 0,
      duration: 0,
    };

    // Initialize animation state
    this.animationState = {
      currentFrame: "idle",
      frameStartTime: 0,
      frameDuration: 300, // 300ms per frame as per spec
      isWalking: false,
    };

    // Set initial sprite to idle
    this.sprite.texture = this.sprites.idle;
  }

  setWalkableArea(polygon: Position[]): void {
    this.walkableArea = [...polygon];
  }

  isPositionWalkable(x: number, y: number): boolean {
    if (!this.walkableArea || this.walkableArea.length < 3) {
      return true; // If no walkable area defined, allow all positions
    }

    return this.isPointInPolygon(x, y, this.walkableArea);
  }

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

  moveTo(targetX: number, targetY: number): boolean {
    // Check if target position is walkable
    if (!this.isPositionWalkable(targetX, targetY)) {
      console.log(
        `Cannot move to (${targetX}, ${targetY}) - position is not walkable`,
      );
      return false;
    }

    // Calculate movement parameters
    const startX = this.sprite.x;
    const startY = this.sprite.y;
    const distance = Math.sqrt(
      (targetX - startX) ** 2 + (targetY - startY) ** 2,
    );
    const duration = distance / this.moveSpeed; // duration in seconds

    // Update movement state
    this.movementState = {
      isMoving: true,
      startPosition: { x: startX, y: startY },
      targetPosition: { x: targetX, y: targetY },
      startTime: performance.now(),
      duration: duration * 1000, // convert to milliseconds
    };

    // Start walking animation
    this.animationState.isWalking = true;
    this.animationState.frameStartTime = performance.now();

    console.log(
      `Moving character from (${startX}, ${startY}) to (${targetX}, ${targetY}) over ${duration.toFixed(2)}s`,
    );

    return true;
  }

  moveToObject(object: InteractiveObject): boolean {
    // Get interaction point for this object
    const interactionPoint = this.interactionPoints.get(object.id);

    if (interactionPoint) {
      return this.moveTo(interactionPoint.x, interactionPoint.y);
    }

    // Fallback: try to find a walkable point near the object
    const objectCenter = object.getCenter();
    const walkablePoint = this.findNearestWalkablePoint(
      objectCenter.x,
      objectCenter.y,
    );

    if (walkablePoint) {
      return this.moveTo(walkablePoint.x, walkablePoint.y);
    }

    console.log(`Cannot find walkable point near object: ${object.name}`);
    return false;
  }

  private findNearestWalkablePoint(x: number, y: number): Position | null {
    // Search in expanding circles for a walkable point
    for (let radius = 10; radius <= 100; radius += 10) {
      for (let angle = 0; angle < 360; angle += 30) {
        const radians = (angle * Math.PI) / 180;
        const testX = x + Math.cos(radians) * radius;
        const testY = y + Math.sin(radians) * radius;

        if (this.isPositionWalkable(testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }

    return null;
  }

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

    // Check if movement is complete
    if (progress >= 1.0) {
      this.movementState.isMoving = false;
      this.animationState.isWalking = false;
      this.animationState.currentFrame = "idle";
      this.sprite.texture = this.sprites.idle;
      console.log(
        `Character arrived at (${this.sprite.x.toFixed(1)}, ${this.sprite.y.toFixed(1)})`,
      );
    }
  }

  private updateAnimation(currentTime: number): void {
    if (!this.animationState.isWalking) return;

    const elapsed = currentTime - this.animationState.frameStartTime;

    if (elapsed >= this.animationState.frameDuration) {
      // Cycle through animation frames: walk1 → idle → walk2 → idle → repeat
      switch (this.animationState.currentFrame) {
        case "idle":
          this.animationState.currentFrame =
            Math.random() > 0.5 ? "walk1" : "walk2";
          break;
        case "walk1":
          this.animationState.currentFrame = "idle";
          break;
        case "walk2":
          this.animationState.currentFrame = "idle";
          break;
      }

      // Update sprite texture
      this.sprite.texture = this.sprites[this.animationState.currentFrame];
      this.animationState.frameStartTime = currentTime;
    }
  }

  isMoving(): boolean {
    return this.movementState.isMoving;
  }

  getCurrentPosition(): Position {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getInteractionPoints(): Map<string, Position> {
    return new Map(this.interactionPoints);
  }

  setInteractionPoint(objectId: string, position: Position): void {
    this.interactionPoints.set(objectId, { ...position });
  }
}
