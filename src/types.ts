export interface GameConfig {
  gameWidth: number;
  gameHeight: number;
  backgroundColor: number;
  targetFPS: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Position;
  width: number;
  height: number;
  description: string;
}

export interface GameState {
  currentAction: "walk" | "use" | "get" | "talk" | "look" | "open";
  isRunning: boolean;
  lastUpdateTime: number;
}
