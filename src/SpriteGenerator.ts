import { Graphics, Texture, Renderer, RenderTexture } from "pixi.js";
import {
  buildCharacterFrames,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  TRANSPARENT,
  type CharacterDesign,
  type PixelFrame,
  type SpriteDirection,
} from "./sprites/compositor";
import { CHARACTER_DESIGNS, PLAYER_DESIGN } from "./sprites/designs";

export type SpriteFrame = PixelFrame;
export type Direction = SpriteDirection;

export interface DirectionalFrames {
  idle: Texture;
  walk1: Texture;
  walk2: Texture;
  walk3: Texture;
  walk4: Texture;
  talk1: Texture; // mouth open
  talk2: Texture; // mouth open + hand gesture
  talk3: Texture; // mouth closed + hand gesture
  blink: Texture; // eyes closed (idle)
  sigh: Texture; // upper body settled by a pixel (idle)
}

export interface CharacterSprites {
  up: DirectionalFrames;
  down: DirectionalFrames;
  left: DirectionalFrames;
  right: DirectionalFrames;
}

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

/**
 * Turns the character designs in ./sprites/designs into PixiJS textures.
 */
export class SpriteGenerator {
  private readonly spriteWidth = SPRITE_WIDTH;
  private readonly spriteHeight = SPRITE_HEIGHT;
  private readonly pixelScale = 3; // 32x48 native -> 96x144 on screen

  private readonly characterFrames: Record<Direction, SpriteFrame[]> =
    buildCharacterFrames(PLAYER_DESIGN);

  generateTextureWithRenderer(
    pixelData: string[],
    renderer: Renderer,
    palette: Record<string, number> = PLAYER_DESIGN.palette,
  ): Texture {
    const graphics = new Graphics();

    for (let y = 0; y < this.spriteHeight; y++) {
      const row = pixelData[y] ?? "";
      for (let x = 0; x < this.spriteWidth; x++) {
        const colorKey = row[x] ?? TRANSPARENT;
        if (colorKey === TRANSPARENT) continue;

        const color = palette[colorKey] ?? 0xff00ff; // magenta = missing key
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

  private texturesFor(
    frames: Record<Direction, SpriteFrame[]>,
    palette: Record<string, number>,
    renderer: Renderer,
  ): CharacterSprites {
    const sprites: Partial<CharacterSprites> = {};
    for (const direction of DIRECTIONS) {
      const directionFrames: Partial<DirectionalFrames> = {};
      for (const frame of frames[direction]) {
        directionFrames[frame.name as keyof DirectionalFrames] =
          this.generateTextureWithRenderer(frame.data, renderer, palette);
      }
      sprites[direction] = directionFrames as DirectionalFrames;
    }
    return sprites as CharacterSprites;
  }

  generateCharacterSpritesWithRenderer(renderer: Renderer): CharacterSprites {
    return this.texturesFor(
      this.characterFrames,
      PLAYER_DESIGN.palette,
      renderer,
    );
  }

  getColorPalette(): Record<string, number> {
    return { ...PLAYER_DESIGN.palette };
  }

  getSpriteFrameData(): Record<Direction, SpriteFrame[]> {
    return { ...this.characterFrames };
  }

  /** Generate the sprite set for an NPC type; unknown types use "basic". */
  generateNPCSpritesWithRenderer(
    renderer: Renderer,
    npcType: string = "basic",
  ): CharacterSprites {
    const design: CharacterDesign =
      CHARACTER_DESIGNS[npcType] ?? CHARACTER_DESIGNS.basic;
    const frames =
      design === PLAYER_DESIGN
        ? this.characterFrames
        : buildCharacterFrames(design);
    return this.texturesFor(frames, design.palette, renderer);
  }

  getAvailableNPCTypes(): string[] {
    return Object.keys(CHARACTER_DESIGNS);
  }
}
