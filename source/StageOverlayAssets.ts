import { Graphics, RenderTexture, Renderer } from "pixi.js";
import { Position } from "./types";
import { buildOpenDoorway, type PixelArtImage } from "./overlays/openDoorway";

export type OverlayZIndexType = "foreground" | "inline" | "background";

/**
 * Floor patch under the shop stool's four legs (game coordinates, a
 * perspective quad: back-left, back-right, front-right, front-left). It is
 * an obstacle the player walks around, and the stool's depth line runs
 * through its middle so the player is drawn behind the stool when above it
 * and in front when below it.
 *
 * The front edge sits 12px below the front feet (y 685 / 674): character
 * sprites have blank rows under their soles, so at the shop's scale a
 * character's visible feet are ~11px above their position. The extra depth
 * keeps the route in front of the stool clearly below its front legs.
 */
export const STOOL_FOOTPRINT: Position[] = [
  { x: 550, y: 662 },
  { x: 620, y: 654 },
  { x: 655, y: 686 },
  { x: 580, y: 697 },
];
const STOOL_DEPTH_Y = Math.round(
  STOOL_FOOTPRINT.reduce((sum, p) => sum + p.y, 0) / STOOL_FOOTPRINT.length,
);

export interface OverlayAssetDefinition {
  id: string;
  objectId: string;
  stageName: string;
  assetKey: string;
  position: Position;
  width: number;
  height: number;
  zIndexType: OverlayZIndexType; // New: foreground, inline, or background
  // For inline overlays: the y used for depth sorting (defaults to position.y,
  // the image's bottom edge). Set it to where the prop touches the floor.
  depthY?: number;
  visible: boolean;
  triggerAction?: string;
  // Asset type - polygon data, PNG file reference, or generated pixel art
  assetType: "polygon" | "png" | "pixelart";
  // For polygon assets
  polygon?: Position[];
  fillColor?: number;
  innerFillColor?: number; // For gradient effect
  // For PNG assets
  pngPath?: string;
  // For pixel-art assets
  pixelArt?: PixelArtImage;
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
   * Generate a texture from pixel-art rows (each art pixel drawn as a
   * pixelSize square, with per-colour alpha).
   */
  static createPixelArtTexture(
    renderer: Renderer,
    art: PixelArtImage,
  ): RenderTexture {
    const graphics = new Graphics();
    const size = art.pixelSize;
    art.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const entry = art.palette[row[x]];
        if (!entry) continue; // '.' and unknown keys are transparent
        graphics
          .rect(x * size, y * size, size, size)
          .fill({ color: entry.color, alpha: entry.alpha });
      }
    });

    const renderTexture = RenderTexture.create({
      width: art.rows[0].length * size,
      height: art.rows.length * size,
    });
    renderer.render(graphics, { renderTexture });
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
  /** The lit, open doorway shown when the building entrance is opened. */
  private static openDoorwayOverlay(): OverlayAssetDefinition {
    const art = buildOpenDoorway();
    const width = art.rows[0].length * art.pixelSize;
    const height = art.rows.length * art.pixelSize;
    return {
      id: "building-entrance-open-door",
      objectId: "building-entrance",
      stageName: "cyberpunk-street",
      assetKey: "building_entrance_open",
      // Overlays are anchored bottom-left
      position: { x: art.x, y: art.y + height },
      width,
      height,
      zIndexType: "background", // Behind characters and NPCs
      visible: false, // Initially hidden
      triggerAction: "open",
      assetType: "pixelart",
      pixelArt: art,
    };
  }

  static getAllOverlayAssets(): OverlayAssetDefinition[] {
    return [
      // Building entrance open door for cyberpunk-street stage
      this.openDoorwayOverlay(),

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
        depthY: STOOL_DEPTH_Y, // where its legs meet the floor, not the image edge
        visible: true, // Visible by default (it's a static object)
        assetType: "png",
        pngPath: "./assets/stool-small.png",
      },
    ];
  }
}
