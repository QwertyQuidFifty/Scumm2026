import { Container } from "pixi.js";
import { InteractiveObject, InteractiveObjectData } from "./InteractiveObject";
import { Position } from "./types";

export class ObjectManager {
  private objects: Map<string, InteractiveObject> = new Map();
  private highlightContainer: Container;
  private hoveredObject?: InteractiveObject;

  constructor() {
    this.highlightContainer = new Container();
  }

  addObject(objectData: InteractiveObjectData): InteractiveObject {
    const object = new InteractiveObject(objectData);
    this.objects.set(object.id, object);
    return object;
  }

  removeObject(id: string): boolean {
    const object = this.objects.get(id);
    if (object) {
      object.destroy();
      this.objects.delete(id);
      return true;
    }
    return false;
  }

  getObject(id: string): InteractiveObject | undefined {
    return this.objects.get(id);
  }

  getAllObjects(): InteractiveObject[] {
    return Array.from(this.objects.values());
  }

  getObjectAtPosition(x: number, y: number): InteractiveObject | undefined {
    // Check objects in reverse order (top to bottom) for proper layering
    const objectArray = Array.from(this.objects.values());
    for (let i = objectArray.length - 1; i >= 0; i--) {
      const object = objectArray[i];
      if (object.containsPoint(x, y)) {
        return object;
      }
    }
    return undefined;
  }

  updateHover(position: Position): InteractiveObject | undefined {
    const newHoveredObject = this.getObjectAtPosition(position.x, position.y);

    // Clear previous hover state
    if (this.hoveredObject && this.hoveredObject !== newHoveredObject) {
      this.hoveredObject.setHovered(false);
      this.updateHighlights();
    }

    // Set new hover state
    if (newHoveredObject && newHoveredObject !== this.hoveredObject) {
      newHoveredObject.setHovered(true);
      this.updateHighlights();
    }

    this.hoveredObject = newHoveredObject;
    return this.hoveredObject;
  }

  clearHover(): void {
    if (this.hoveredObject) {
      this.hoveredObject.setHovered(false);
      this.hoveredObject = undefined;
      this.updateHighlights();
    }
  }

  getHoveredObject(): InteractiveObject | undefined {
    return this.hoveredObject;
  }

  private updateHighlights(): void {
    // Clear existing highlights
    this.highlightContainer.removeChildren();

    // Add highlights for all hovered objects
    for (const object of this.objects.values()) {
      if (object.getIsHovered()) {
        const highlight = object.createHighlight();
        this.highlightContainer.addChild(highlight);
      }
    }
  }

  getHighlightContainer(): Container {
    return this.highlightContainer;
  }

  initializeGameObjects(): void {
    // Initialize the four interactive objects from the feature specification
    // Note: These coordinates are from the original 320x200 spec, scaled for 1024x768
    const scaleX = 1024 / 320;
    const scaleY = 768 / 200;

    this.addObject({
      id: "hotel-sign",
      name: "hotel sign",
      position: { x: 20 * scaleX, y: 30 * scaleY },
      width: 60 * scaleX,
      height: 40 * scaleY,
      description: "A glowing neon hotel sign",
      polygon: [
        { x: 164, y: 17 },
        { x: 222, y: 29 },
        { x: 226, y: 364 },
        { x: 166, y: 354 },
      ],
    });

    this.addObject({
      id: "bar-sign",
      name: "bar sign",
      position: { x: 240 * scaleX, y: 45 * scaleY },
      width: 40 * scaleX,
      height: 25 * scaleY,
      description: "A red neon bar sign",
      polygon: [
        { x: 655, y: 364 },
        { x: 755, y: 316 },
        { x: 750, y: 414 },
        { x: 658, y: 443 },
      ],
    });

    this.addObject({
      id: "building-entrance",
      name: "building entrance",
      position: { x: 80 * scaleX, y: 80 * scaleY },
      width: 30 * scaleX,
      height: 60 * scaleY,
      description: "A dark building entrance",
      polygon: [
        { x: 58, y: 381 },
        { x: 125, y: 393 },
        { x: 123, y: 594 },
        { x: 62, y: 610 },
      ],
    });

    this.addObject({
      id: "cryptic-door",
      name: "cryptic door",
      position: { x: 20 * scaleX, y: 30 * scaleY },
      width: 60 * scaleX,
      height: 40 * scaleY,
      description: "An ornate door without a handle",
      polygon: [
        { x: 870, y: 391 },
        { x: 947, y: 375 },
        { x: 947, y: 630 },
        { x: 870, y: 615 },
      ],
    });

    this.addObject({
      id: "city-in-distance",
      name: "city in distance",
      position: { x: 20 * scaleX, y: 30 * scaleY },
      width: 60 * scaleX,
      height: 40 * scaleY,
      description: "The street leads into the depth of the city",
      polygon: [
        { x: 419, y: 424 },
        { x: 552, y: 424 },
        { x: 552, y: 542 },
        { x: 419, y: 542 },
      ],
    });

    // Add interactive key object that can be picked up
    this.addObject({
      id: "golden-key",
      name: "golden key",
      position: { x: 500, y: 600 }, // Position on the street
      width: 48, // 16 * 3 scale
      height: 24, // 8 * 3 scale
      description: "A shiny golden key that might unlock something important",
    });

    console.log(`Initialized ${this.objects.size} interactive objects`);
  }

  destroy(): void {
    // Clean up all objects
    for (const object of this.objects.values()) {
      object.destroy();
    }
    this.objects.clear();

    // Clean up highlight container
    this.highlightContainer.destroy();

    this.hoveredObject = undefined;
  }
}
