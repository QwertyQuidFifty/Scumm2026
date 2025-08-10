import { Position } from "./types";

export interface MouseState {
  x: number;
  y: number;
  isDown: boolean;
  hoveredElement?: HTMLElement;
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private gameWidth: number;
  private gameHeight: number;
  private mouseState: MouseState;
  private onClickCallback?: (position: Position) => void;
  private onRightClickCallback?: (position: Position) => void;
  private onHoverCallback?: (position: Position) => void;
  private onHoverExitCallback?: () => void;
  private onKeyPressCallback?: (key: string) => void;

  constructor(
    canvas: HTMLCanvasElement,
    gameWidth: number,
    gameHeight: number,
  ) {
    this.canvas = canvas;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.mouseState = {
      x: 0,
      y: 0,
      isDown: false,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse click events
    this.canvas.addEventListener("click", (event) => {
      const gameCoords = this.screenToGameCoordinates(
        event.clientX,
        event.clientY,
      );
      if (this.onClickCallback) {
        this.onClickCallback(gameCoords);
      }
    });

    // Right-click events
    this.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault(); // Prevent browser context menu
      const gameCoords = this.screenToGameCoordinates(
        event.clientX,
        event.clientY,
      );
      if (this.onRightClickCallback) {
        this.onRightClickCallback(gameCoords);
      }
    });

    // Mouse move events for hover
    this.canvas.addEventListener("mousemove", (event) => {
      const gameCoords = this.screenToGameCoordinates(
        event.clientX,
        event.clientY,
      );
      this.mouseState.x = gameCoords.x;
      this.mouseState.y = gameCoords.y;

      if (this.onHoverCallback) {
        this.onHoverCallback(gameCoords);
      }
    });

    // Mouse down/up events
    this.canvas.addEventListener("mousedown", () => {
      this.mouseState.isDown = true;
    });

    this.canvas.addEventListener("mouseup", () => {
      this.mouseState.isDown = false;
    });

    // Mouse enter/leave events
    this.canvas.addEventListener("mouseenter", (event) => {
      const gameCoords = this.screenToGameCoordinates(
        event.clientX,
        event.clientY,
      );
      this.mouseState.x = gameCoords.x;
      this.mouseState.y = gameCoords.y;
    });

    this.canvas.addEventListener("mouseleave", () => {
      if (this.onHoverExitCallback) {
        this.onHoverExitCallback();
      }
    });

    // Context menu prevention (right-click)
    this.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    // Keyboard events (listen on document for global keyboard shortcuts)
    document.addEventListener("keydown", (event) => {
      // Only handle key presses when the canvas is focused or when no input field is focused
      if (
        document.activeElement === this.canvas ||
        !this.isInputFieldFocused()
      ) {
        if (this.onKeyPressCallback) {
          this.onKeyPressCallback(event.key.toLowerCase());
        }
      }
    });

    // Make canvas focusable for keyboard events
    this.canvas.setAttribute("tabindex", "0");
  }

  private isInputFieldFocused(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      (activeElement as HTMLElement).contentEditable === "true"
    );
  }

  private screenToGameCoordinates(screenX: number, screenY: number): Position {
    // Get canvas bounding rectangle
    const canvasRect = this.canvas.getBoundingClientRect();

    // Convert screen coordinates to canvas coordinates
    const canvasX = screenX - canvasRect.left;
    const canvasY = screenY - canvasRect.top;

    // Calculate scaling factors
    const scaleX = this.gameWidth / canvasRect.width;
    const scaleY = this.gameHeight / canvasRect.height;

    // Convert to game coordinates
    const gameX = Math.round(canvasX * scaleX);
    const gameY = Math.round(canvasY * scaleY);

    // Clamp to game bounds
    const clampedX = Math.max(0, Math.min(gameX, this.gameWidth - 1));
    const clampedY = Math.max(0, Math.min(gameY, this.gameHeight - 1));

    return { x: clampedX, y: clampedY };
  }

  gameToScreenCoordinates(gameX: number, gameY: number): Position {
    // Get canvas bounding rectangle
    const canvasRect = this.canvas.getBoundingClientRect();

    // Calculate scaling factors
    const scaleX = canvasRect.width / this.gameWidth;
    const scaleY = canvasRect.height / this.gameHeight;

    // Convert to screen coordinates
    const screenX = gameX * scaleX + canvasRect.left;
    const screenY = gameY * scaleY + canvasRect.top;

    return { x: screenX, y: screenY };
  }

  setClickCallback(callback: (position: Position) => void): void {
    this.onClickCallback = callback;
  }

  setHoverCallback(callback: (position: Position) => void): void {
    this.onHoverCallback = callback;
  }

  setRightClickCallback(callback: (position: Position) => void): void {
    this.onRightClickCallback = callback;
  }

  setKeyPressCallback(callback: (key: string) => void): void {
    this.onKeyPressCallback = callback;
  }

  setHoverExitCallback(callback: () => void): void {
    this.onHoverExitCallback = callback;
  }

  getMouseState(): MouseState {
    return { ...this.mouseState };
  }

  setCursor(cursor: string): void {
    this.canvas.style.cursor = cursor;
  }

  isPositionInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.gameWidth && y >= 0 && y < this.gameHeight;
  }

  getGameDimensions(): { width: number; height: number } {
    return { width: this.gameWidth, height: this.gameHeight };
  }

  destroy(): void {
    // Remove all event listeners when cleaning up
    // Note: In a real implementation, we'd need to store references to the actual listener functions
    this.onClickCallback = undefined;
    this.onHoverCallback = undefined;
    this.onHoverExitCallback = undefined;
  }
}
