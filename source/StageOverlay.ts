import { Sprite, Container, Texture, Renderer } from "pixi.js";
import { Position } from "./types";
import { OverlayZIndexType } from "./StageOverlayAssets";

export interface StageOverlayData {
  id: string;
  objectId: string; // The interactive object this overlay relates to
  assetKey: string; // Key for the overlay asset
  position: Position; // Position on stage
  width: number;
  height: number;
  zIndexType: OverlayZIndexType; // Layering type: foreground, inline, or background
  visible: boolean; // Initial visibility
  triggerAction?: string; // Action that toggles this overlay (e.g., "open")
}

export class StageOverlay {
  private data: StageOverlayData;
  private sprite: Sprite;
  private container: Container;

  constructor(data: StageOverlayData, texture: Texture) {
    this.data = data;

    // Create container for positioning
    this.container = new Container();
    this.container.x = data.position.x;
    this.container.y = data.position.y;
    this.container.visible = data.visible;

    // Z-index will be handled by the StageManager based on zIndexType

    // Create sprite
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0, 1); // Bottom-left anchor for proper stage positioning

    this.container.addChild(this.sprite);

    console.log(
      `Created stage overlay: ${data.id} at (${data.position.x}, ${data.position.y})`,
    );
  }

  show(): void {
    this.container.visible = true;
    this.data.visible = true;
    console.log(`Showing overlay: ${this.data.id}`);
  }

  hide(): void {
    this.container.visible = false;
    this.data.visible = false;
    console.log(`Hiding overlay: ${this.data.id}`);
  }

  toggle(): void {
    if (this.data.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.data.visible;
  }

  getObjectId(): string {
    return this.data.objectId;
  }

  getId(): string {
    return this.data.id;
  }

  getTriggerAction(): string | undefined {
    return this.data.triggerAction;
  }

  getZIndexType(): OverlayZIndexType {
    return this.data.zIndexType;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}

export class StageOverlayManager {
  private overlays: Map<string, StageOverlay> = new Map();
  private container: Container;
  // @ts-expect-error - renderer will be used for future asset generation
  private renderer?: Renderer;

  constructor() {
    this.container = new Container();
    this.container.sortableChildren = true; // Enable z-index sorting
  }

  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
  }

  addOverlay(overlayData: StageOverlayData, texture: Texture): boolean {
    if (this.overlays.has(overlayData.id)) {
      console.warn(`Stage overlay with id ${overlayData.id} already exists`);
      return false;
    }

    try {
      const overlay = new StageOverlay(overlayData, texture);
      this.overlays.set(overlayData.id, overlay);

      // Add to container
      this.container.addChild(overlay.getContainer());

      console.log(`Added stage overlay: ${overlayData.id}`);
      return true;
    } catch (error) {
      console.error(`Error adding stage overlay ${overlayData.id}:`, error);
      return false;
    }
  }

  getOverlay(id: string): StageOverlay | undefined {
    return this.overlays.get(id);
  }

  getOverlayByObjectId(objectId: string): StageOverlay | undefined {
    for (const overlay of this.overlays.values()) {
      if (overlay.getObjectId() === objectId) {
        return overlay;
      }
    }
    return undefined;
  }

  getOverlayByObjectAndAction(
    objectId: string,
    action: string,
  ): StageOverlay | undefined {
    for (const overlay of this.overlays.values()) {
      if (
        overlay.getObjectId() === objectId &&
        overlay.getTriggerAction() === action
      ) {
        return overlay;
      }
    }
    return undefined;
  }

  showOverlay(id: string): boolean {
    const overlay = this.overlays.get(id);
    if (overlay) {
      overlay.show();
      return true;
    }
    return false;
  }

  hideOverlay(id: string): boolean {
    const overlay = this.overlays.get(id);
    if (overlay) {
      overlay.hide();
      return true;
    }
    return false;
  }

  toggleOverlay(id: string): boolean {
    const overlay = this.overlays.get(id);
    if (overlay) {
      overlay.toggle();
      return true;
    }
    return false;
  }

  // Toggle overlay by object ID and action
  toggleOverlayByAction(objectId: string, action: string): boolean {
    const overlay = this.getOverlayByObjectAndAction(objectId, action);
    if (overlay) {
      overlay.toggle();
      return true;
    }
    console.warn(
      `No overlay found for object ${objectId} with action ${action}`,
    );
    return false;
  }

  getContainer(): Container {
    return this.container;
  }

  clearAll(): void {
    for (const overlay of this.overlays.values()) {
      overlay.destroy();
    }
    this.overlays.clear();
    console.log("Cleared all stage overlays");
  }
}
