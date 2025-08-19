import { Graphics, Texture, RenderTexture, Renderer } from "pixi.js";

export interface SpriteFrame {
  name: string;
  data: string[];
}

export type Direction = "up" | "down" | "left" | "right";

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

export class SpriteGenerator {
  private colorPalette: Record<string, number> = {
    "0": 0x000000, // transparent (actually we'll skip these pixels)
    "3": 0x2a2a2a, // dark grey - shoes
    "4": 0x4a4a4a, // medium grey - pants
    "5": 0x6a6a6a, // light grey - belt/details
    "6": 0x8b4513, // brown - hair outline
    "7": 0xdaa520, // golden - hair
    "8": 0xffb6c1, // light pink - face
  };

  private readonly spriteWidth = 32; // Double resolution for Monkey Island quality
  private readonly spriteHeight = 48; // Double resolution for Monkey Island quality
  private readonly pixelScale = 3; // Scale factor for each pixel (3x3 blocks)

  // Character sprite frames as 32-character strings representing pixel rows
  // Four directions with 5 frames each (idle + 4 walk frames)
  private readonly characterFrames: Record<Direction, SpriteFrame[]> = {
    down: [
      {
        name: "idle",
        data: this.createBasicDownIdleFrame(),
      },
      {
        name: "walk1",
        data: this.createBasicDownWalkFrame(),
      },
      {
        name: "walk2",
        data: this.createBasicDownWalkFrame(),
      },
      {
        name: "walk3",
        data: this.createBasicDownWalkFrame(),
      },
      {
        name: "walk4",
        data: this.createBasicDownWalkFrame(),
      },
    ],
    left: [
      {
        name: "idle",
        data: this.createBasicLeftIdleFrame(),
      },
      {
        name: "walk1",
        data: this.createBasicLeftWalkFrame(),
      },
      {
        name: "walk2",
        data: this.createBasicLeftWalkFrame(),
      },
      {
        name: "walk3",
        data: this.createBasicLeftWalkFrame(),
      },
      {
        name: "walk4",
        data: this.createBasicLeftWalkFrame(),
      },
    ],
    right: [
      {
        name: "idle",
        data: this.createBasicRightIdleFrame(),
      },
      {
        name: "walk1",
        data: this.createBasicRightWalkFrame(),
      },
      {
        name: "walk2",
        data: this.createBasicRightWalkFrame(),
      },
      {
        name: "walk3",
        data: this.createBasicRightWalkFrame(),
      },
      {
        name: "walk4",
        data: this.createBasicRightWalkFrame(),
      },
    ],
    up: [
      {
        name: "idle",
        data: this.createBasicUpIdleFrame(),
      },
      {
        name: "walk1",
        data: this.createBasicUpWalkFrame(),
      },
      {
        name: "walk2",
        data: this.createBasicUpWalkFrame(),
      },
      {
        name: "walk3",
        data: this.createBasicUpWalkFrame(),
      },
      {
        name: "walk4",
        data: this.createBasicUpWalkFrame(),
      },
    ],
  };

  // Placeholder frame generation methods (to be refined with proper pixel art)
  private createBasicDownIdleFrame(): string[] {
    // Original 16x24 sprite data (each character represents 1 pixel)
    const originalSprite = [
      "0000000000000000", // Row 1
      "0000000000000000", // Row 2
      "0003777777700000", // Row 3 - hair top
      "0377777777770000", // Row 4 - hair with outline
      "0786666666870000", // Row 5 - face top
      "0788888888870000", // Row 6 - face
      "0788338833870000", // Row 7 - face with eyes
      "0788888888870000", // Row 8 - face
      "0706666666070000", // Row 9 - face bottom
      "0004444444400000", // Row 10 - shirt top
      "0044444444440000", // Row 11 - shirt
      "0444444444444000", // Row 12 - shirt
      "0545444444545500", // Row 13 - shirt with belt details
      "0353444444353000", // Row 14 - belt
      "0333555555333000", // Row 15 - pants top
      "0003344444330000", // Row 16 - pants
      "0004444444400000", // Row 17 - pants
      "0004444444400000", // Row 18 - pants
      "0004444444400000", // Row 19 - pants
      "0004333334400000", // Row 20 - pants bottom
      "0003333333300000", // Row 21 - shoes top
      "0033333333330000", // Row 22 - shoes
      "0033000000330000", // Row 23 - shoes bottom
      "0000000000000000", // Row 24
    ];

    // Double the resolution: each pixel becomes a 2x2 block
    const scaledSprite: string[] = [];
    for (const row of originalSprite) {
      // Double horizontally: each character becomes two characters
      const doubledRow = row
        .split("")
        .map((char) => char + char)
        .join("");
      // Double vertically: add the same row twice
      scaledSprite.push(doubledRow);
      scaledSprite.push(doubledRow);
    }

    return scaledSprite;
  }

  private createBasicDownWalkFrame(): string[] {
    // Walking animation for down-facing - slight leg position changes
    const originalSprite = [
      "0000000000000000", // Row 1
      "0000000000000000", // Row 2
      "0003777777700000", // Row 3 - hair top
      "0377777777770000", // Row 4 - hair with outline
      "0786666666870000", // Row 5 - face top
      "0788888888870000", // Row 6 - face
      "0788338833870000", // Row 7 - face with eyes
      "0788888888870000", // Row 8 - face
      "0706666666070000", // Row 9 - face bottom
      "0004444444400000", // Row 10 - shirt top
      "0044444444440000", // Row 11 - shirt
      "0444444444444000", // Row 12 - shirt
      "0545444444545500", // Row 13 - shirt with belt details
      "0353444444353000", // Row 14 - belt
      "0333555555333000", // Row 15 - pants top
      "0003344444330000", // Row 16 - pants
      "0004444444400000", // Row 17 - pants
      "0004444444400000", // Row 18 - pants
      "0003444444300000", // Row 19 - pants (walking - leg shift)
      "0003333334400000", // Row 20 - pants bottom (walking - one leg forward)
      "0003333333300000", // Row 21 - shoes top (walking)
      "0333333333330000", // Row 22 - shoes (walking - wider stance)
      "0330000000330000", // Row 23 - shoes bottom (walking - both feet planted)
      "0000000000000000", // Row 24
    ];

    // Double the resolution: each pixel becomes a 2x2 block
    const scaledSprite: string[] = [];
    for (const row of originalSprite) {
      const doubledRow = row
        .split("")
        .map((char) => char + char)
        .join("");
      scaledSprite.push(doubledRow);
      scaledSprite.push(doubledRow);
    }

    return scaledSprite;
  }

  private createBasicLeftIdleFrame(): string[] {
    // Left-facing profile sprite - should face LEFT (16x24 original, scaled to 32x48)
    const originalSprite = [
      "0000000000000000", // Row 1
      "0000000000000000", // Row 2
      "0000007777300000", // Row 3 - hair left profile (fixed direction)
      "0000077777730000", // Row 4 - hair with outline
      "0000766666870000", // Row 5 - face profile top
      "0000888888870000", // Row 6 - face profile
      "0000883888870000", // Row 7 - face with eye (single eye in profile)
      "0000888888870000", // Row 8 - face profile
      "0000666666070000", // Row 9 - face bottom profile
      "0000044444400000", // Row 10 - shirt profile
      "0000444444440000", // Row 11 - shirt
      "0004444444440000", // Row 12 - shirt extended
      "0000444444545000", // Row 13 - shirt with belt (left side)
      "0000444444353000", // Row 14 - belt profile
      "0000555555333000", // Row 15 - pants profile
      "0000444444330000", // Row 16 - pants
      "0000444444400000", // Row 17 - pants
      "0000444444400000", // Row 18 - pants
      "0000444444400000", // Row 19 - pants
      "0000433333400000", // Row 20 - pants bottom
      "0000333333300000", // Row 21 - shoes profile
      "0003333333300000", // Row 22 - shoes
      "0000000033300000", // Row 23 - shoes bottom (left foot forward)
      "0000000000000000", // Row 24
    ];

    // Double the resolution: each pixel becomes a 2x2 block
    const scaledSprite: string[] = [];
    for (const row of originalSprite) {
      const doubledRow = row
        .split("")
        .map((char) => char + char)
        .join("");
      scaledSprite.push(doubledRow);
      scaledSprite.push(doubledRow);
    }

    return scaledSprite;
  }

  private createBasicLeftWalkFrame(): string[] {
    // Left walking animation - leg position changes for walking motion
    const originalSprite = [
      "0000000000000000", // Row 1
      "0000000000000000", // Row 2
      "0000007777300000", // Row 3 - hair left profile
      "0000077777730000", // Row 4 - hair with outline
      "0000766666870000", // Row 5 - face profile top
      "0000888888870000", // Row 6 - face profile
      "0000883888870000", // Row 7 - face with eye (single eye in profile)
      "0000888888870000", // Row 8 - face profile
      "0000666666070000", // Row 9 - face bottom profile
      "0000044444400000", // Row 10 - shirt profile
      "0000444444440000", // Row 11 - shirt
      "0004444444440000", // Row 12 - shirt extended
      "0000444444545000", // Row 13 - shirt with belt
      "0000444444353000", // Row 14 - belt profile
      "0000555555333000", // Row 15 - pants profile
      "0000444444330000", // Row 16 - pants
      "0000444444400000", // Row 17 - pants
      "0000444444000000", // Row 18 - pants (walking - leg forward)
      "0000444333000000", // Row 19 - pants (walking - stride)
      "0000333333000000", // Row 20 - pants bottom (walking)
      "0000333333000000", // Row 21 - shoes profile (walking)
      "0003333333000000", // Row 22 - shoes (walking - one foot forward)
      "0000000033000000", // Row 23 - shoes bottom (walking stride)
      "0000000000000000", // Row 24
    ];

    // Double the resolution: each pixel becomes a 2x2 block
    const scaledSprite: string[] = [];
    for (const row of originalSprite) {
      const doubledRow = row
        .split("")
        .map((char) => char + char)
        .join("");
      scaledSprite.push(doubledRow);
      scaledSprite.push(doubledRow);
    }

    return scaledSprite;
  }

  private createBasicRightIdleFrame(): string[] {
    // Right-facing profile sprite - should face RIGHT (16x24 original, scaled to 32x48)
    const originalSprite = [
      "0000000000000000", // Row 1
      "0000000000000000", // Row 2
      "0000037777000000", // Row 3 - hair right profile (fixed direction)
      "0000377777700000", // Row 4 - hair with outline
      "0000786666670000", // Row 5 - face profile top
      "0000788888880000", // Row 6 - face profile
      "0000788388800000", // Row 7 - face with eye (single eye in profile)
      "0000788888800000", // Row 8 - face profile
      "0000706666600000", // Row 9 - face bottom profile
      "0000044444400000", // Row 10 - shirt profile
      "0000444444440000", // Row 11 - shirt
      "0000444444444000", // Row 12 - shirt extended
      "0005454444400000", // Row 13 - shirt with belt (right side)
      "0003534444400000", // Row 14 - belt profile
      "0003335555500000", // Row 15 - pants profile
      "0000334444400000", // Row 16 - pants
      "0000444444400000", // Row 17 - pants
      "0000444444400000", // Row 18 - pants
      "0000444444400000", // Row 19 - pants
      "0000433333400000", // Row 20 - pants bottom
      "0000333333300000", // Row 21 - shoes profile
      "0000333333330000", // Row 22 - shoes
      "0000330000000000", // Row 23 - shoes bottom (right foot forward)
      "0000000000000000", // Row 24
    ];

    // Double the resolution: each pixel becomes a 2x2 block
    const scaledSprite: string[] = [];
    for (const row of originalSprite) {
      const doubledRow = row
        .split("")
        .map((char) => char + char)
        .join("");
      scaledSprite.push(doubledRow);
      scaledSprite.push(doubledRow);
    }

    return scaledSprite;
  }

  private createBasicRightWalkFrame(): string[] {
    // Right walking animation - leg position changes for walking motion
    const originalSprite = [
      "0000000000000000", // Row 1
      "0000000000000000", // Row 2
      "0000037777000000", // Row 3 - hair right profile
      "0000377777700000", // Row 4 - hair with outline
      "0000786666670000", // Row 5 - face profile top
      "0000788888880000", // Row 6 - face profile
      "0000788388800000", // Row 7 - face with eye (single eye in profile)
      "0000788888800000", // Row 8 - face profile
      "0000706666600000", // Row 9 - face bottom profile
      "0000044444400000", // Row 10 - shirt profile
      "0000444444440000", // Row 11 - shirt
      "0000444444444000", // Row 12 - shirt extended
      "0005454444400000", // Row 13 - shirt with belt
      "0003534444400000", // Row 14 - belt profile
      "0003335555500000", // Row 15 - pants profile
      "0000334444400000", // Row 16 - pants
      "0000444444400000", // Row 17 - pants
      "0000044444400000", // Row 18 - pants (walking - leg forward)
      "0000033344400000", // Row 19 - pants (walking - stride)
      "0000033333400000", // Row 20 - pants bottom (walking)
      "0000033333300000", // Row 21 - shoes profile (walking)
      "0000033333300000", // Row 22 - shoes (walking - one foot forward)
      "0000033000000000", // Row 23 - shoes bottom (walking stride)
      "0000000000000000", // Row 24
    ];

    // Double the resolution: each pixel becomes a 2x2 block
    const scaledSprite: string[] = [];
    for (const row of originalSprite) {
      const doubledRow = row
        .split("")
        .map((char) => char + char)
        .join("");
      scaledSprite.push(doubledRow);
      scaledSprite.push(doubledRow);
    }

    return scaledSprite;
  }

  private createBasicUpIdleFrame(): string[] {
    // Back-facing sprite (16x24 original, scaled to 32x48)
    const originalSprite = [
      "0000000000000000", // Row 1
      "0000000000000000", // Row 2
      "0003777777700000", // Row 3 - hair back view
      "0377777777770000", // Row 4 - hair with outline (fuller back view)
      "0766666666667000", // Row 5 - back of head
      "0788888888887000", // Row 6 - neck/back of head
      "0788888888887000", // Row 7 - neck (no eyes visible from back)
      "0788888888887000", // Row 8 - neck
      "0706666666607000", // Row 9 - neck bottom
      "0004444444400000", // Row 10 - shirt back
      "0044444444440000", // Row 11 - shirt
      "0444444444444000", // Row 12 - shirt (wider back view)
      "0545444444545500", // Row 13 - shirt back with belt details
      "0353444444353000", // Row 14 - belt back
      "0333555555333000", // Row 15 - pants back
      "0003344444330000", // Row 16 - pants
      "0004444444400000", // Row 17 - pants
      "0004444444400000", // Row 18 - pants
      "0004444444400000", // Row 19 - pants
      "0004333334400000", // Row 20 - pants bottom
      "0003333333300000", // Row 21 - shoes back
      "0033333333330000", // Row 22 - shoes (both feet visible)
      "0033000000330000", // Row 23 - shoes bottom (both heels)
      "0000000000000000", // Row 24
    ];

    // Double the resolution: each pixel becomes a 2x2 block
    const scaledSprite: string[] = [];
    for (const row of originalSprite) {
      const doubledRow = row
        .split("")
        .map((char) => char + char)
        .join("");
      scaledSprite.push(doubledRow);
      scaledSprite.push(doubledRow);
    }

    return scaledSprite;
  }

  private createBasicUpWalkFrame(): string[] {
    // Up walking animation - leg position changes for walking motion
    const originalSprite = [
      "0000000000000000", // Row 1
      "0000000000000000", // Row 2
      "0003777777700000", // Row 3 - hair back view
      "0377777777770000", // Row 4 - hair with outline (fuller back view)
      "0766666666667000", // Row 5 - back of head
      "0788888888887000", // Row 6 - neck/back of head
      "0788888888887000", // Row 7 - neck (no eyes visible from back)
      "0788888888887000", // Row 8 - neck
      "0706666666607000", // Row 9 - neck bottom
      "0004444444400000", // Row 10 - shirt back
      "0044444444440000", // Row 11 - shirt
      "0444444444444000", // Row 12 - shirt (wider back view)
      "0545444444545500", // Row 13 - shirt back with belt details
      "0353444444353000", // Row 14 - belt back
      "0333555555333000", // Row 15 - pants back
      "0003344444330000", // Row 16 - pants
      "0004444444400000", // Row 17 - pants
      "0003444444300000", // Row 18 - pants (walking)
      "0003444444300000", // Row 19 - pants (walking - back stride)
      "0003333334300000", // Row 20 - pants bottom (walking - back view)
      "0003333333300000", // Row 21 - shoes back (walking)
      "0333333333330000", // Row 22 - shoes (walking - back stride)
      "0330000000330000", // Row 23 - shoes bottom (walking - both heels)
      "0000000000000000", // Row 24
    ];

    // Double the resolution: each pixel becomes a 2x2 block
    const scaledSprite: string[] = [];
    for (const row of originalSprite) {
      const doubledRow = row
        .split("")
        .map((char) => char + char)
        .join("");
      scaledSprite.push(doubledRow);
      scaledSprite.push(doubledRow);
    }

    return scaledSprite;
  }

  generateCharacterSprites(): CharacterSprites {
    const sprites: Partial<CharacterSprites> = {};

    // Generate sprites for each direction
    for (const direction of ["up", "down", "left", "right"] as Direction[]) {
      const directionFrames: Partial<DirectionalFrames> = {};

      for (const frame of this.characterFrames[direction]) {
        const texture = this.createTextureFromPixelData(frame.data);
        directionFrames[frame.name as keyof DirectionalFrames] = texture;
      }

      sprites[direction] = directionFrames as DirectionalFrames;
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

    // Generate sprites for each direction
    for (const direction of ["up", "down", "left", "right"] as Direction[]) {
      const directionFrames: Partial<DirectionalFrames> = {};

      for (const frame of this.characterFrames[direction]) {
        const texture = this.generateTextureWithRenderer(frame.data, renderer);
        directionFrames[frame.name as keyof DirectionalFrames] = texture;
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

  // Generate NPC sprites with different color palettes for variety
  generateNPCSpritesWithRenderer(
    renderer: Renderer,
    npcType: string = "basic",
  ): CharacterSprites {
    const originalPalette = { ...this.colorPalette };

    // Set NPC-specific color palette
    this.setNPCColorPalette(npcType);

    // Generate sprites with NPC palette (NPCs use down direction only)
    const sprites: Partial<CharacterSprites> = {};

    // Generate sprites for each direction (NPCs get full directional support)
    for (const direction of ["up", "down", "left", "right"] as Direction[]) {
      const directionFrames: Partial<DirectionalFrames> = {};

      for (const frame of this.characterFrames[direction]) {
        const texture = this.generateTextureWithRenderer(frame.data, renderer);
        directionFrames[frame.name as keyof DirectionalFrames] = texture;
      }

      sprites[direction] = directionFrames as DirectionalFrames;
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
