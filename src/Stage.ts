import { Position } from "./types";
import { InteractiveObjectData } from "./InteractiveObject";

export interface PerspectiveScale {
  minY: number; // Y coordinate for minimum scale (background/far)
  maxY: number; // Y coordinate for maximum scale (foreground/near)
  minScale: number; // Scale factor at minY (e.g., 0.5 = 50% size)
  maxScale: number; // Scale factor at maxY (e.g., 1.5 = 150% size)
}

export interface Stage {
  id: string;
  name: string;
  backgroundAssetKey: string;
  backgroundWidth: number;
  backgroundHeight: number;
  walkableArea: Position[];
  objects: InteractiveObjectData[];
  characterStartPosition: Position;
  keyPosition?: Position; // Optional key sprite position for this stage
  interactionPoints?: Map<string, Position>; // objectId -> interaction position
  perspectiveScale?: PerspectiveScale; // Optional perspective scaling configuration
}

export interface StageTransition {
  fromStageId: string;
  toStageId: string;
  triggerObjectId: string; // Object that triggers the transition
  targetPosition?: Position; // Where to place character in new stage
}
