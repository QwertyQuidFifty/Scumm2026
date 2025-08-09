import { Position } from "./types";
import { InteractiveObjectData } from "./InteractiveObject";
import { NPCData } from "./NPC";

export interface PerspectiveScale {
  minY: number; // Y coordinate for minimum scale (background/far)
  maxY: number; // Y coordinate for maximum scale (foreground/near)
  minScale: number; // Scale factor at minY (e.g., 0.5 = 50% size)
  maxScale: number; // Scale factor at maxY (e.g., 1.5 = 150% size)
}

export interface PerspectiveMovement {
  yMovementFactor: number; // Factor to reduce Y-axis movement (1.0 = normal, 0.5 = half speed, etc.)
}

export interface Stage {
  id: string;
  name: string;
  backgroundAssetKey: string;
  backgroundWidth: number;
  backgroundHeight: number;
  walkableArea: Position[];
  objects: InteractiveObjectData[];
  npcs?: NPCData[]; // Optional NPCs for this stage
  characterStartPosition: Position;
  keyPosition?: Position; // Optional key sprite position for this stage
  interactionPoints?: Map<string, Position>; // objectId -> interaction position
  perspectiveScale?: PerspectiveScale; // Optional perspective scaling configuration
  perspectiveMovement?: PerspectiveMovement; // Optional perspective movement configuration
}

export interface StageTransition {
  fromStageId: string;
  toStageId: string;
  triggerObjectId: string; // Object that triggers the transition
  targetPosition?: Position; // Where to place character in new stage
}
