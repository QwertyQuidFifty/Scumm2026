import { Graphics, Texture, RenderTexture, Renderer } from "pixi.js";

export interface SpriteFrame {
  name: string;
  data: string[];
}

export interface CharacterSprites {
  idle: Texture;
  walk1: Texture;
  walk2: Texture;
}

export class SpriteGenerator {
  private readonly colorPalette: Record<string, number> = {
    "0": 0x000000, // transparent (actually we'll skip these pixels)
    "3": 0x2a2a2a, // dark grey - shoes
    "4": 0x4a4a4a, // medium grey - pants
    "5": 0x6a6a6a, // light grey - belt/details
    "6": 0x8b4513, // brown - hair outline
    "7": 0xdaa520, // golden - hair
    "8": 0xffb6c1, // light pink - face
  };

  private readonly spriteWidth = 16;
  private readonly spriteHeight = 24;

  // Character sprite frames as 16-character strings representing pixel rows
  private readonly characterFrames: SpriteFrame[] = [
    {
      name: "idle",
      data: [
        "0000000000000000", // Row 1
        "0000000000000000", // Row 2
        "0000077777700000", // Row 3 - hair top
        "0000767777670000", // Row 4 - hair with outline
        "0000788888870000", // Row 5 - face top
        "0000788888870000", // Row 6 - face
        "0000788888870000", // Row 7 - face
        "0000766666670000", // Row 8 - face bottom
        "0000444444440000", // Row 9 - shirt top
        "0000444444440000", // Row 10 - shirt
        "0000444444440000", // Row 11 - shirt
        "0000454444540000", // Row 12 - shirt with belt
        "0000555555550000", // Row 13 - belt
        "0000444444440000", // Row 14 - pants top
        "0000444444440000", // Row 15 - pants
        "0000444444440000", // Row 16 - pants
        "0000444444440000", // Row 17 - pants
        "0000444444440000", // Row 18 - pants
        "0000444444440000", // Row 19 - pants bottom
        "0000033333300000", // Row 20 - shoes top
        "0000333333330000", // Row 21 - shoes
        "0000333333330000", // Row 22 - shoes bottom
        "0000000000000000", // Row 23
        "0000000000000000", // Row 24
      ],
    },
    {
      name: "walk1",
      data: [
        "0000000000000000", // Row 1
        "0000000000000000", // Row 2
        "0000077777700000", // Row 3 - hair top
        "0000767777670000", // Row 4 - hair with outline
        "0000788888870000", // Row 5 - face top
        "0000788888870000", // Row 6 - face
        "0000788888870000", // Row 7 - face
        "0000766666670000", // Row 8 - face bottom
        "0000444444440000", // Row 9 - shirt top
        "0000444444440000", // Row 10 - shirt
        "0000444444440000", // Row 11 - shirt
        "0000454444540000", // Row 12 - shirt with belt
        "0000555555550000", // Row 13 - belt
        "0000044444440000", // Row 14 - pants (left leg forward)
        "0000044444400000", // Row 15 - pants
        "0000044444000000", // Row 16 - pants
        "0000044440000000", // Row 17 - pants
        "0000044400000000", // Row 18 - pants
        "0000044000000000", // Row 19 - pants bottom
        "0000033000000000", // Row 20 - shoes (left foot forward)
        "0000330000000000", // Row 21 - shoes
        "0000300000000000", // Row 22 - shoes bottom
        "0000000000000000", // Row 23
        "0000000000000000", // Row 24
      ],
    },
    {
      name: "walk2",
      data: [
        "0000000000000000", // Row 1
        "0000000000000000", // Row 2
        "0000077777700000", // Row 3 - hair top
        "0000767777670000", // Row 4 - hair with outline
        "0000788888870000", // Row 5 - face top
        "0000788888870000", // Row 6 - face
        "0000788888870000", // Row 7 - face
        "0000766666670000", // Row 8 - face bottom
        "0000444444440000", // Row 9 - shirt top
        "0000444444440000", // Row 10 - shirt
        "0000444444440000", // Row 11 - shirt
        "0000454444540000", // Row 12 - shirt with belt
        "0000555555550000", // Row 13 - belt
        "0000444444400000", // Row 14 - pants (right leg forward)
        "0000444444000000", // Row 15 - pants
        "0000444440000000", // Row 16 - pants
        "0000444400000000", // Row 17 - pants
        "0000444000000000", // Row 18 - pants
        "0000440000000000", // Row 19 - pants bottom
        "0000330000000000", // Row 20 - shoes (right foot forward)
        "0000300000000000", // Row 21 - shoes
        "0000000000000000", // Row 22 - shoes bottom
        "0000000000000000", // Row 23
        "0000000000000000", // Row 24
      ],
    },
  ];

  generateCharacterSprites(): CharacterSprites {
    const sprites: Partial<CharacterSprites> = {};

    for (const frame of this.characterFrames) {
      const texture = this.createTextureFromPixelData(frame.data);
      sprites[frame.name as keyof CharacterSprites] = texture;
    }

    return sprites as CharacterSprites;
  }

  private createTextureFromPixelData(pixelData: string[]): Texture {
    const graphics = new Graphics();

    // Draw each pixel
    for (let y = 0; y < this.spriteHeight; y++) {
      const row = pixelData[y] || "0000000000000000";
      for (let x = 0; x < this.spriteWidth; x++) {
        const colorKey = row[x] || "0";

        // Skip transparent pixels
        if (colorKey === "0") continue;

        const color = this.colorPalette[colorKey] || 0x000000;
        graphics.rect(x, y, 1, 1).fill(color);
      }
    }

    // Create texture from graphics
    const renderTexture = RenderTexture.create({
      width: this.spriteWidth,
      height: this.spriteHeight,
    });

    // We'll need the app renderer to generate the texture
    // For now, return a placeholder - we'll update this when integrating
    return renderTexture;
  }

  generateTextureWithRenderer(
    pixelData: string[],
    renderer: Renderer,
  ): Texture {
    const graphics = new Graphics();

    // Draw each pixel
    for (let y = 0; y < this.spriteHeight; y++) {
      const row = pixelData[y] || "0000000000000000";
      for (let x = 0; x < this.spriteWidth; x++) {
        const colorKey = row[x] || "0";

        // Skip transparent pixels
        if (colorKey === "0") continue;

        const color = this.colorPalette[colorKey] || 0x000000;
        graphics.rect(x, y, 1, 1).fill(color);
      }
    }

    // Create texture from graphics using the renderer
    const renderTexture = RenderTexture.create({
      width: this.spriteWidth,
      height: this.spriteHeight,
    });

    renderer.render(graphics, { renderTexture });
    return renderTexture;
  }

  generateCharacterSpritesWithRenderer(renderer: Renderer): CharacterSprites {
    const sprites: Partial<CharacterSprites> = {};

    for (const frame of this.characterFrames) {
      const texture = this.generateTextureWithRenderer(frame.data, renderer);
      sprites[frame.name as keyof CharacterSprites] = texture;
    }

    return sprites as CharacterSprites;
  }

  getColorPalette(): Record<string, number> {
    return { ...this.colorPalette };
  }

  getSpriteFrameData(): SpriteFrame[] {
    return [...this.characterFrames];
  }
}
