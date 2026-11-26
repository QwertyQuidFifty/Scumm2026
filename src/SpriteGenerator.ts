import { Graphics, Texture, Renderer, RenderTexture } from "pixi.js";
import {
  NPC_PALETTE_OVERRIDES,
  PLAYER_FRAMES,
  PLAYER_PALETTE,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  TRANSPARENT,
  type PixelFrame,
  type SpriteDirection,
} from "./sprites/PlayerSprites";

export type SpriteFrame = PixelFrame;
export type Direction = SpriteDirection;

export interface DirectionalFrames {
  idle: Texture;
  walk1: Texture;
  walk2: Texture;
  walk3: Texture;
  walk4: Texture;
}

export interface CharacterSprites {
  up: DirectionalFrames;
  down: DirectionalFrames;
  left: DirectionalFrames;
  right: DirectionalFrames;
}

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

/**
 * Turns the pixel-art frame data in ./sprites/PlayerSprites into PixiJS
 * textures, optionally recoloured for NPC variants.
 */
export class SpriteGenerator {
  private colorPalette: Record<string, number> = { ...PLAYER_PALETTE };

  private readonly spriteWidth = SPRITE_WIDTH;
  private readonly spriteHeight = SPRITE_HEIGHT;
  private readonly pixelScale = 3; // 32x48 native -> 96x144 on screen

  private readonly characterFrames: Record<Direction, SpriteFrame[]> =
    PLAYER_FRAMES;

  generateTextureWithRenderer(
    pixelData: string[],
    renderer: Renderer,
  ): Texture {
    const graphics = new Graphics();

    for (let y = 0; y < this.spriteHeight; y++) {
      const row = pixelData[y] ?? "";
      for (let x = 0; x < this.spriteWidth; x++) {
        const colorKey = row[x] ?? TRANSPARENT;
        if (colorKey === TRANSPARENT) continue;

        const color = this.colorPalette[colorKey] ?? 0xff00ff; // magenta = missing key
        graphics
          .rect(
            x * this.pixelScale,
            y * this.pixelScale,
            this.pixelScale,
            this.pixelScale,
          )
          .fill(color);
      }
    }

    const renderTexture = RenderTexture.create({
      width: this.spriteWidth * this.pixelScale,
      height: this.spriteHeight * this.pixelScale,
    });

    renderer.render(graphics, { renderTexture });
    graphics.destroy();
    return renderTexture;
  }

  generateCharacterSpritesWithRenderer(renderer: Renderer): CharacterSprites {
    const sprites: Partial<CharacterSprites> = {};

    for (const direction of DIRECTIONS) {
      const directionFrames: Partial<DirectionalFrames> = {};
      for (const frame of this.characterFrames[direction]) {
        directionFrames[frame.name as keyof DirectionalFrames] =
          this.generateTextureWithRenderer(frame.data, renderer);
      }
      sprites[direction] = directionFrames as DirectionalFrames;
    }

    return sprites as CharacterSprites;
  }

  getColorPalette(): Record<string, number> {
    return { ...this.colorPalette };
  }

  getSpriteFrameData(): Record<Direction, SpriteFrame[]> {
    return { ...this.characterFrames };
  }

  /** Generate the character set recoloured for an NPC variant. */
  generateNPCSpritesWithRenderer(
    renderer: Renderer,
    npcType: string = "basic",
  ): CharacterSprites {
    const originalPalette = this.colorPalette;
    this.colorPalette = {
      ...PLAYER_PALETTE,
      ...(NPC_PALETTE_OVERRIDES[npcType] ?? {}),
    };

    try {
      return this.generateCharacterSpritesWithRenderer(renderer);
    } finally {
      this.colorPalette = originalPalette;
    }
  }

  getAvailableNPCTypes(): string[] {
    return Object.keys(NPC_PALETTE_OVERRIDES);
  }
}
