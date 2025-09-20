import { Graphics, RenderTexture, Renderer } from "pixi.js";
import { Position } from "./types";

export type OverlayZIndexType = "foreground" | "inline" | "background";

export interface OverlayAssetDefinition {
  id: string;
  objectId: string;
  stageName: string;
  assetKey: string;
  position: Position;
  width: number;
  height: number;
  zIndexType: OverlayZIndexType; // New: foreground, inline, or background
  visible: boolean;
  triggerAction?: string;
  // Asset type - either polygon data or PNG file reference
  assetType: "polygon" | "png";
  // For polygon assets
  polygon?: Position[];
  fillColor?: number;
  innerFillColor?: number; // For gradient effect
  // For PNG assets
  pngPath?: string;
}

export class StageOverlayAssets {
  /**
   * Generate a texture from polygon data
   */
  static createPolygonTexture(
    renderer: Renderer,
    polygon: Position[],
    fillColor: number = 0x0f0f0f,
    innerFillColor?: number,
  ): RenderTexture {
    const graphics = new Graphics();

    // Base dark fill
    graphics.poly(polygon).fill(fillColor);

    // Add inner lighting effect if specified
    if (innerFillColor !== undefined) {
      const innerPolygon = polygon.map((point) => ({
        x: point.x + (point.x > 0 ? -8 : 8), // Shrink inward by 8 pixels
        y: point.y + (point.y > 0 ? -8 : 8), // Shrink inward by 8 pixels
      }));
      graphics.poly(innerPolygon).fill(innerFillColor);
    }

    // Get bounding box for render texture
    const bounds = graphics.bounds;
    const width = Math.ceil(bounds.width);
    const height = Math.ceil(bounds.height);

    // Create render texture
    const renderTexture = RenderTexture.create({
      width: width,
      height: height,
    });

    // Adjust graphics position to account for negative coordinates
    graphics.x = -bounds.x;
    graphics.y = -bounds.y;

    // Render to texture
    renderer.render(graphics, { renderTexture });

    // Cleanup
    graphics.destroy();

    return renderTexture;
  }

  /**
   * Get all overlay asset definitions for a specific stage
   */
  static getStageOverlayAssets(stageId: string): OverlayAssetDefinition[] {
    return this.getAllOverlayAssets().filter(
      (asset) => asset.stageName === stageId,
    );
  }

  /**
   * Get all overlay asset definitions
   */
  static getAllOverlayAssets(): OverlayAssetDefinition[] {
    return [
      // Building entrance open door for cyberpunk-street stage
      {
        id: "building-entrance-open-door",
        objectId: "building-entrance",
        stageName: "cyberpunk-street",
        assetKey: "building_entrance_open",
        position: { x: 58, y: 634 }, // Match the polygon coordinates
        width: 96,
        height: 230,
        zIndexType: "background", // Behind characters and NPCs
        visible: false, // Initially hidden
        triggerAction: "open",
        assetType: "polygon",
        polygon: [
          { x: 0, y: 450 - 634 }, // Top-left: (58-58, 450-634) = (0, -184)
          { x: 124 - 58, y: 470 - 634 }, // Top-right: (124-58, 470-634) = (66, -164)
          { x: 124 - 58, y: 634 - 634 }, // Bottom-right: (124-58, 634-634) = (66, 0)
          { x: 0, y: 650 - 634 }, // Bottom-left: (58-58, 650-634) = (0, 16)
        ],
        fillColor: 0x0f0f0f, // Very dark base
        innerFillColor: 0x2a1f0f, // Dim warm light in center area
      },

      // Small stool in mechstore
      {
        id: "mechstore-stool",
        objectId: "stool-small", // Create a matching interactive object
        stageName: "test-indoor", // This is the mechstore stage
        assetKey: "stool_small",
        position: { x: 500, y: 700 }, // Within walkable area (336-899, 613-772) - TEST: moved up for depth testing
        width: 64, // Estimated width for small stool
        height: 64, // Estimated height for small stool
        zIndexType: "inline", // Y-position based depth like NPCs
        visible: true, // Visible by default (it's a static object)
        assetType: "png",
        pngPath: "./assets/stool-small.png",
      },
    ];
  }
}
