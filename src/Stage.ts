import { Position } from "./types";
import { InteractiveObjectData } from "./InteractiveObject";

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
}

export interface StageTransition {
  fromStageId: string;
  toStageId: string;
  triggerObjectId: string; // Object that triggers the transition
  targetPosition?: Position; // Where to place character in new stage
}
