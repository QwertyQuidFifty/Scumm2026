import { Sprite } from "pixi.js";
import { Position } from "./types";
import { CharacterSprites, Direction } from "./SpriteGenerator";
import { InteractiveObject } from "./InteractiveObject";
import { talkFrameAt } from "./TalkAnimation";
import { IdleAnimator, PLAYER_IDLE } from "./IdleAnimation";
import { NavMesh } from "./navigation/pathfinding";

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
  private obstacles: Position[][] = []; // Footprints of props that block walking
  private navMesh?: NavMesh; // Rebuilt lazily when the area or obstacles change
  /** Remaining points of the current route, walked in order. */
  private route: Position[] = [];
  private moveCallback?: (position: Position) => void; // Callback for position updates
  /** Reports whether the player's own speech is currently shown. */
  private isSpeaking?: () => boolean;
  /** When the current speech started (null when not talking). */
  private talkStartTime: number | null = null;
  /** Blinks and fidgets while standing still (fidgets start after ~7s). */
  private readonly idle = new IdleAnimator(PLAYER_IDLE, 1);
  private idleActive = false;
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
    this.navMesh = undefined;
  }

  /** Footprints of props the character must walk around. */
  setObstacles(obstacles: Position[][]): void {
    this.obstacles = obstacles.map((o) => o.map((p) => ({ ...p })));
    this.navMesh = undefined;
  }

  /** The current navigation data (for debug drawing). */
  getNavMesh(): NavMesh | undefined {
    return this.getMesh();
  }

  /** Points still to walk to on the current route. */
  getRoute(): Position[] {
    return this.movementState.isMoving
      ? [{ ...this.movementState.targetPosition }, ...this.route]
      : [];
  }

  private getMesh(): NavMesh | undefined {
    if (!this.walkableArea || this.walkableArea.length < 3) return undefined;
    if (!this.navMesh) {
      this.navMesh = new NavMesh(
        { walkable: this.walkableArea, obstacles: this.obstacles },
        { yFactor: this.yMovementFactor },
      );
    }
    return this.navMesh;
  }

  setInteractionPoints(interactionPoints: Map<string, Position>): void {
    this.interactionPoints.clear();
    interactionPoints.forEach((position, objectId) => {
      this.interactionPoints.set(objectId, { ...position });
    });
  }

  isPositionWalkable(x: number, y: number): boolean {
    const mesh = this.getMesh();
    if (!mesh) return true; // If no walkable area defined, allow all positions
    return mesh.isWalkable({ x, y });
  }

  /**
   * Walk to a point, routing around obstacles. Clicking inside an obstacle
   * walks to the nearest point beside it. Returns false if the point is off
   * the floor or unreachable.
   */
  moveTo(targetX: number, targetY: number): boolean {
    const start = { x: this.sprite.x, y: this.sprite.y };
    const mesh = this.getMesh();
    const route = mesh
      ? mesh.findPath(start, { x: targetX, y: targetY })
      : [{ x: targetX, y: targetY }];

    if (!route || route.length === 0) {
      console.log(
        `Cannot move to (${targetX}, ${targetY}) - position is not walkable`,
      );
      return false;
    }

    console.log(
      `Moving character from (${start.x}, ${start.y}) to (${targetX}, ${targetY}) via ${route.length} leg(s)`,
    );
    this.route = route;
    this.startNextLeg(performance.now());
    return true;
  }

  /** Begin walking the next point of the route. */
  private startNextLeg(now: number): void {
    const next = this.route.shift();
    if (!next) return;

    const startX = this.sprite.x;
    const startY = this.sprite.y;
    const deltaX = next.x - startX;
    const deltaY = next.y - startY;

    // Horizontal and vertical motion run at different speeds and finish together
    const xTime = Math.abs(deltaX) / this.moveSpeed;
    const yTime = Math.abs(deltaY) / (this.moveSpeed * this.yMovementFactor);
    const duration = Math.max(xTime, yTime);

    this.movementState = {
      isMoving: true,
      startPosition: { x: startX, y: startY },
      targetPosition: { x: next.x, y: next.y },
      startTime: now,
      duration: duration * 1000, // convert to milliseconds
    };

    // Face the way this leg goes (tiny legs keep the current facing)
    if (Math.hypot(deltaX, deltaY) > 1) {
      this.updateDirection(
        this.calculateDirection({ x: startX, y: startY }, next),
      );
    }

    if (!this.animationState.isWalking) {
      this.animationState.isWalking = true;
      this.animationState.frameStartTime = now;
    }
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

    // Check if this leg is complete
    if (progress >= 1.0 && this.route.length > 0) {
      this.startNextLeg(currentTime);
      return;
    }
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
    // Talking (only while standing still): mouth and gesture animation.
    if (!this.animationState.isWalking && this.isSpeaking?.()) {
      if (this.talkStartTime === null) this.talkStartTime = currentTime;
      const frame = talkFrameAt(currentTime - this.talkStartTime);
      const direction = this.animationState.currentDirection;
      const texture = this.sprites[direction][frame];
      if (this.sprite.texture !== texture) this.sprite.texture = texture;
      this.idleActive = false;
      return;
    }
    if (this.talkStartTime !== null) {
      // Speech just ended (or we started walking): drop back to idle now.
      this.talkStartTime = null;
      if (!this.animationState.isWalking) {
        this.animationState.currentFrame = "idle";
        this.sprite.texture =
          this.sprites[this.animationState.currentDirection].idle;
        this.animationState.frameStartTime = currentTime;
      }
    }

    // Standing still: blinks, and fidgets once idle for a while.
    if (!this.animationState.isWalking) {
      if (!this.idleActive) {
        this.idle.reset(currentTime);
        this.idleActive = true;
      }
      const state = this.idle.frameAt(currentTime);
      const direction = state.faceCamera
        ? "down"
        : this.animationState.currentDirection;
      const texture = this.sprites[direction][state.frame];
      if (this.sprite.texture !== texture) this.sprite.texture = texture;
      this.animationState.currentFrame = "idle";
      return;
    }
    this.idleActive = false;

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
    this.navMesh = undefined; // route costs depend on it
  }

  /** Supply a check for whether the player's own speech is on screen. */
  setSpeakingCheck(check: () => boolean): void {
    this.isSpeaking = check;
  }

  /** Turn (without moving) to face a point, e.g. the NPC being talked to. */
  faceTowards(target: Position): void {
    const direction = this.calculateDirection(
      { x: this.sprite.x, y: this.sprite.y },
      target,
    );
    this.updateDirection(direction);
  }

  getDirection(): Direction {
    return this.animationState.currentDirection;
  }

  setMoveCallback(callback: (position: Position) => void): void {
    this.moveCallback = callback;
  }
}
