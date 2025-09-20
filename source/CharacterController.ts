import { Sprite } from "pixi.js";
import { Position } from "./types";
import { CharacterSprites, Direction } from "./SpriteGenerator";
import { InteractiveObject } from "./InteractiveObject";

interface MovementState {
  isMoving: boolean;
  startPosition: Position;
  targetPosition: Position;
  startTime: number;
  duration: number;
}

interface AnimationState {
  currentFrame: "idle" | "walk1" | "walk2" | "walk3" | "walk4";
  frameStartTime: number;
  frameDuration: number; // Reduced to 250ms for smoother 4-frame animation
  isWalking: boolean;
  currentDirection: Direction; // Track which way character is facing
}

export class CharacterController {
  private sprite: Sprite;
  private sprites: CharacterSprites;
  private movementState: MovementState;
  private animationState: AnimationState;
  private moveSpeed: number = 180; // pixels per second (increased 50% from 120 for better feel)
  private walkableArea?: Position[]; // The street polygon
  private moveCallback?: (position: Position) => void; // Callback for position updates
  // Interaction points for each object (within walkable area) - adjusted for background offset
  private interactionPoints: Map<string, Position> = new Map([
    ["hotel-sign", { x: 202, y: 657 }], // Near hotel sign, on street (617 + 40)
    ["bar-sign", { x: 689, y: 656 }], // Near bar sign, on street (616 + 40)
    ["building-entrance", { x: 108, y: 686 }], // Near building entrance, on street (646 + 40)
    ["cryptic-door", { x: 896, y: 713 }], // Right side of the street below bar entrance (673 + 40)
    ["city-in-distance", { x: 470, y: 616 }], // City in distance, on street (576 + 40)
  ]);
  private yMovementFactor: number = 0.5; // Factor for Y-axis movement damping (0.5 = half Y movement)

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

    // Initialize animation state - start facing down (standard adventure game default)
    this.animationState = {
      currentFrame: "idle",
      frameStartTime: 0,
      frameDuration: 250, // 250ms per frame for smooth 4-frame animation
      isWalking: false,
      currentDirection: "down",
    };

    // Set initial sprite to idle facing down
    this.sprite.texture = this.sprites.down.idle;
  }

  setWalkableArea(polygon: Position[]): void {
    this.walkableArea = [...polygon];
  }

  setInteractionPoints(interactionPoints: Map<string, Position>): void {
    this.interactionPoints.clear();
    interactionPoints.forEach((position, objectId) => {
      this.interactionPoints.set(objectId, { ...position });
    });
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
    // Check if target position is walkable (original coordinates)
    if (!this.isPositionWalkable(targetX, targetY)) {
      console.log(
        `Cannot move to (${targetX}, ${targetY}) - position is not walkable`,
      );
      return false;
    }

    // Calculate movement parameters with different axis speeds
    const startX = this.sprite.x;
    const startY = this.sprite.y;
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;

    // Calculate time needed for each axis at their respective speeds
    const xSpeed = this.moveSpeed; // Normal speed for X
    const ySpeed = this.moveSpeed * this.yMovementFactor; // Reduced speed for Y

    const xTime = Math.abs(deltaX) / xSpeed;
    const yTime = Math.abs(deltaY) / ySpeed;

    // Use the longer time so both axes complete simultaneously
    const duration = Math.max(xTime, yTime);

    // Update movement state with original target coordinates
    this.movementState = {
      isMoving: true,
      startPosition: { x: startX, y: startY },
      targetPosition: { x: targetX, y: targetY },
      startTime: performance.now(),
      duration: duration * 1000, // convert to milliseconds
    };

    // Calculate and update direction based on movement
    const newDirection = this.calculateDirection(
      { x: startX, y: startY },
      { x: targetX, y: targetY },
    );
    this.updateDirection(newDirection);

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

    // Simple linear interpolation to the scaled target
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

    // Notify depth manager of position change
    if (this.moveCallback) {
      this.moveCallback({ x, y });
    }

    // Check if movement is complete
    if (progress >= 1.0) {
      this.movementState.isMoving = false;
      this.animationState.isWalking = false;
      this.animationState.currentFrame = "idle";
      // Set idle texture in current direction
      const currentDirection = this.animationState.currentDirection;
      this.sprite.texture = this.sprites[currentDirection].idle;
      console.log(
        `Character arrived at (${this.sprite.x.toFixed(1)}, ${this.sprite.y.toFixed(1)})`,
      );
    }
  }

  private updateAnimation(currentTime: number): void {
    const elapsed = currentTime - this.animationState.frameStartTime;

    if (elapsed >= this.animationState.frameDuration) {
      if (this.animationState.isWalking) {
        // Smooth 4-frame walking cycle: walk1 → walk2 → walk3 → walk4 → repeat
        switch (this.animationState.currentFrame) {
          case "idle":
          case "walk4":
            this.animationState.currentFrame = "walk1";
            break;
          case "walk1":
            this.animationState.currentFrame = "walk2";
            break;
          case "walk2":
            this.animationState.currentFrame = "walk3";
            break;
          case "walk3":
            this.animationState.currentFrame = "walk4";
            break;
        }
      } else {
        // Not walking - set to idle
        this.animationState.currentFrame = "idle";
      }

      // Update sprite texture using current direction
      const currentDirection = this.animationState.currentDirection;
      const currentFrame = this.animationState.currentFrame;
      this.sprite.texture = this.sprites[currentDirection][currentFrame];
      this.animationState.frameStartTime = currentTime;
    }
  }

  isMoving(): boolean {
    return this.movementState.isMoving;
  }

  // Calculate direction based on movement vector
  private calculateDirection(from: Position, to: Position): Direction {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Determine primary direction (like Monkey Island - prioritize horizontal movement)
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    } else {
      return dy > 0 ? "down" : "up";
    }
  }

  // Update character direction and refresh sprite
  private updateDirection(direction: Direction): void {
    if (this.animationState.currentDirection !== direction) {
      this.animationState.currentDirection = direction;
      // Immediately update sprite texture
      const currentFrame = this.animationState.currentFrame;
      this.sprite.texture = this.sprites[direction][currentFrame];
    }
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

  setYMovementFactor(factor: number): void {
    this.yMovementFactor = Math.max(0.1, Math.min(1.0, factor)); // Clamp between 0.1 and 1.0
  }

  setMoveCallback(callback: (position: Position) => void): void {
    this.moveCallback = callback;
  }
}
