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
      defaultAction: "look", // Signs should be looked at
      polygon: [
        { x: 164, y: 57 }, // 17 + 40 (background offset)
        { x: 222, y: 69 }, // 29 + 40
        { x: 226, y: 404 }, // 364 + 40
        { x: 166, y: 394 }, // 354 + 40
      ],
    });

    this.addObject({
      id: "bar-sign",
      name: "bar sign",
      position: { x: 240 * scaleX, y: 45 * scaleY },
      width: 40 * scaleX,
      height: 25 * scaleY,
      description: "A red neon bar sign",
      defaultAction: "look", // Signs should be looked at
      polygon: [
        { x: 655, y: 404 }, // 364 + 40
        { x: 755, y: 356 }, // 316 + 40
        { x: 750, y: 454 }, // 414 + 40
        { x: 658, y: 483 }, // 443 + 40
      ],
    });

    this.addObject({
      id: "building-entrance",
      name: "building entrance",
      position: { x: 80 * scaleX, y: 80 * scaleY },
      width: 30 * scaleX,
      height: 60 * scaleY,
      description: "A dark building entrance",
      defaultAction: "open", // Doors/entrances should be opened
      polygon: [
        { x: 58, y: 421 }, // 381 + 40
        { x: 125, y: 433 }, // 393 + 40
        { x: 123, y: 634 }, // 594 + 40
        { x: 62, y: 650 }, // 610 + 40
      ],
    });

    this.addObject({
      id: "cryptic-door",
      name: "cryptic door",
      position: { x: 20 * scaleX, y: 30 * scaleY },
      width: 60 * scaleX,
      height: 40 * scaleY,
      description: "An ornate door without a handle",
      defaultAction: "open", // Doors should be opened
      polygon: [
        { x: 870, y: 431 }, // 391 + 40
        { x: 947, y: 415 }, // 375 + 40
        { x: 947, y: 670 }, // 630 + 40
        { x: 870, y: 655 }, // 615 + 40
      ],
    });

    this.addObject({
      id: "city-in-distance",
      name: "city in distance",
      position: { x: 20 * scaleX, y: 30 * scaleY },
      width: 60 * scaleX,
      height: 40 * scaleY,
      description: "The street leads into the depth of the city",
      defaultAction: "walk", // Paths/streets should be walked to
      polygon: [
        { x: 419, y: 464 }, // 424 + 40
        { x: 552, y: 464 }, // 424 + 40
        { x: 552, y: 582 }, // 542 + 40
        { x: 419, y: 582 }, // 542 + 40
      ],
    });
    this.addObject({
      id: "bar-door",
      name: "bar",
      position: { x: 20 * scaleX, y: 30 * scaleY },
      width: 60 * scaleX,
      height: 40 * scaleY,
      description: "The dimly lit entrance to the bar",
      defaultAction: "walk", // Paths/streets should be walked to
      polygon: [
        { x: 720, y: 534 }, // 494 + 40
        { x: 746, y: 536 }, // 496 + 40
        { x: 746, y: 637 }, // 597 + 40
        { x: 720, y: 633 }, // 593 + 40
      ],
    });

    // Add interactive key object that can be picked up
    this.addObject({
      id: "golden-key",
      name: "golden key",
      position: { x: 500, y: 640 }, // Position on the street - adjusted for background move
      width: 48, // 16 * 3 scale
      height: 24, // 8 * 3 scale
      description: "A shiny golden key that might unlock something important",
      defaultAction: "get", // Items should be picked up
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
