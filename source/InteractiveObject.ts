import { Graphics } from "pixi.js";
import { Position } from "./types";
import { ActionType } from "./CommandPanel";

export interface InteractiveObjectData {
  id: string;
  name: string;
  position: Position;
  width: number;
  height: number;
  description: string;
  defaultAction: ActionType; // Default action for right-click and highlighting
  polygon?: Position[]; // Optional polygon points for irregular shapes
}

export class InteractiveObject {
  public readonly id: string;
  public readonly name: string;
  public readonly position: Position;
  public readonly width: number;
  public readonly height: number;
  public readonly description: string;
  public readonly defaultAction: ActionType; // Default action for right-click and highlighting
  public readonly polygon?: Position[]; // Optional polygon points for irregular shapes
  private highlightGraphics?: Graphics;
  private isHovered: boolean = false;

  constructor(data: InteractiveObjectData) {
    this.id = data.id;
    this.name = data.name;
    this.position = { ...data.position };
    this.width = data.width;
    this.height = data.height;
    this.description = data.description;
    this.defaultAction = data.defaultAction;
    this.polygon = data.polygon ? [...data.polygon] : undefined;
  }

  containsPoint(x: number, y: number): boolean {
    // If polygon is defined, use polygon collision detection
    if (this.polygon && this.polygon.length >= 3) {
      return this.isPointInPolygon(x, y, this.polygon);
    }

    // Otherwise, use rectangle collision detection
    return (
      x >= this.position.x &&
      x <= this.position.x + this.width &&
      y >= this.position.y &&
      y <= this.position.y + this.height
    );
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

  setHovered(hovered: boolean): void {
    this.isHovered = hovered;
  }

  getIsHovered(): boolean {
    return this.isHovered;
  }

  createHighlight(): Graphics {
    if (!this.highlightGraphics) {
      this.highlightGraphics = new Graphics();
    }

    this.highlightGraphics.clear();

    if (this.isHovered) {
      // Draw green outline (2px stroke, #00ff00)
      if (this.polygon && this.polygon.length >= 3) {
        // Draw polygon outline
        this.highlightGraphics
          .poly(this.polygon)
          .stroke({ color: 0x00ff00, width: 2 });
      } else {
        // Draw rectangle outline
        this.highlightGraphics
          .rect(this.position.x, this.position.y, this.width, this.height)
          .stroke({ color: 0x00ff00, width: 2 });
      }
    }

    return this.highlightGraphics;
  }

  getHighlightGraphics(): Graphics | undefined {
    return this.highlightGraphics;
  }

  getBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (this.polygon && this.polygon.length >= 3) {
      // Calculate bounding box for polygon
      const xs = this.polygon.map((p) => p.x);
      const ys = this.polygon.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }

    // Return rectangle bounds
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
    };
  }

  getCenter(): Position {
    if (this.polygon && this.polygon.length >= 3) {
      // Calculate centroid for polygon
      const bounds = this.getBounds();
      return {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      };
    }

    // Return rectangle center
    return {
      x: this.position.x + this.width / 2,
      y: this.position.y + this.height / 2,
    };
  }

  destroy(): void {
    if (this.highlightGraphics) {
      this.highlightGraphics.destroy();
      this.highlightGraphics = undefined;
    }
  }
}
