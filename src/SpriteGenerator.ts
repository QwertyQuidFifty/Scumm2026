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

  private readonly spriteWidth = 16; // Original dimensions
  private readonly spriteHeight = 24; // Original dimensions
  private readonly pixelScale = 3; // Scale factor for each pixel (3x3 blocks)

  // Character sprite frames as 16-character strings representing pixel rows
  private readonly characterFrames: SpriteFrame[] = [
    {
      name: "idle",
      data: [
        "0000000000000000", // Row 1
        "0000000000000000", // Row 2
        "0000077777700000", // Row 3 - hair top
        "0000777777770000", // Row 4 - hair with outline
        "0000786886870000", // Row 5 - face top
        "0000788888870000", // Row 6 - face
        "0000788338870000", // Row 7 - face
        "0000706666070000", // Row 8 - face bottom
        "0000044444400000", // Row 9 - shirt top
        "0000444444440000", // Row 10 - shirt
        "0004444444444000", // Row 11 - shirt
        "0005454444545000", // Row 12 - shirt with belt
        "0003534444353000", // Row 13 - belt
        "0003335555333000", // Row 14 - pants top
        "0000334444330000", // Row 15 - pants
        "0000444444440000", // Row 16 - pants
        "0000044444400000", // Row 17 - pants
        "0000044444400000", // Row 18 - pants
        "0000044334400000", // Row 19 - pants bottom
        "0000033333300000", // Row 20 - shoes top
        "0000333333330000", // Row 21 - shoes
        "0000333003330000", // Row 22 - shoes bottom
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
        "0000777777770000", // Row 4 - hair with outline
        "0000786886870000", // Row 5 - face top
        "0000788888870000", // Row 6 - face
        "0000788338870000", // Row 7 - face
        "0000706666070000", // Row 8 - face bottom
        "0000044444400000", // Row 9 - shirt top
        "0000444444440000", // Row 10 - shirt
        "0004444444444000", // Row 11 - shirt
        "0005454444545000", // Row 12 - shirt with belt
        "0003534444353000", // Row 13 - belt
        "0003335555333000", // Row 14 - pants top
        "0000334444330000", // Row 15 - pants
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
        "0000777777770000", // Row 4 - hair with outline
        "0000786886870000", // Row 5 - face top
        "0000788888870000", // Row 6 - face
        "0000788338870000", // Row 7 - face
        "0000706666070000", // Row 8 - face bottom
        "0000044444400000", // Row 9 - shirt top
        "0000444444440000", // Row 10 - shirt
        "0004444444444000", // Row 11 - shirt
        "0005454444545000", // Row 12 - shirt with belt
        "0003534444353000", // Row 13 - belt
        "0003335555333000", // Row 14 - pants top
        "0000334444330000", // Row 15 - pants
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

    // Draw each pixel as a scaled block for higher resolution
    for (let y = 0; y < this.spriteHeight; y++) {
      const row = pixelData[y] || "0000000000000000";
      for (let x = 0; x < this.spriteWidth; x++) {
        const colorKey = row[x] || "0";

        // Skip transparent pixels
        if (colorKey === "0") continue;

        const color = this.colorPalette[colorKey] || 0x000000;
        // Render each pixel as a pixelScale x pixelScale block
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

    // Create texture from graphics using the renderer with scaled dimensions
    const renderTexture = RenderTexture.create({
      width: this.spriteWidth * this.pixelScale,
      height: this.spriteHeight * this.pixelScale,
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

  // Generate NPC sprites with different color palettes for variety
  generateNPCSpritesWithRenderer(
    renderer: Renderer,
    npcType: string = "basic",
  ): CharacterSprites {
    const originalPalette = { ...this.colorPalette };

    // Set NPC-specific color palette
    this.setNPCColorPalette(npcType);

    // Generate sprites with NPC palette
    const sprites: Partial<CharacterSprites> = {};
    for (const frame of this.characterFrames) {
      const texture = this.generateTextureWithRenderer(frame.data, renderer);
      sprites[frame.name as keyof CharacterSprites] = texture;
    }

    // Restore original palette
    this.colorPalette = originalPalette;

    return sprites as CharacterSprites;
  }

  private setNPCColorPalette(npcType: string): void {
    switch (npcType) {
      case "bartender":
        // Dark clothing, different hair
        this.colorPalette = {
          "0": 0x000000, // transparent
          "3": 0x1a1a1a, // darker shoes
          "4": 0x2d2d2d, // dark grey pants
          "5": 0x4a4a4a, // belt/details
          "6": 0x654321, // brown hair outline
          "7": 0x8b4513, // dark brown hair
          "8": 0xfdbcb4, // slightly different skin tone
        };
        break;
      case "customer":
        // Blue clothing, blonde hair
        this.colorPalette = {
          "0": 0x000000, // transparent
          "3": 0x2a2a2a, // shoes
          "4": 0x1e3a8a, // blue pants
          "5": 0x3b82f6, // blue belt/details
          "6": 0x92400e, // hair outline
          "7": 0xfbbf24, // blonde hair
          "8": 0xfed7aa, // different skin tone
        };
        break;
      case "mechanic":
        // Green overalls, red hair
        this.colorPalette = {
          "0": 0x000000, // transparent
          "3": 0x4a4a4a, // work boots
          "4": 0x16a34a, // green overalls
          "5": 0x22c55e, // green details
          "6": 0x7f1d1d, // red hair outline
          "7": 0xdc2626, // red hair
          "8": 0xf3e8ff, // pale skin
        };
        break;
      default:
        // Keep original palette for "basic" NPCs
        break;
    }
  }

  // Get available NPC types
  getAvailableNPCTypes(): string[] {
    return ["basic", "bartender", "customer", "mechanic"];
  }
}
