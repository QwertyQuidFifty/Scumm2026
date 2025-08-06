import { Application, Sprite } from "pixi.js";
import { GameConfig, GameState, Position } from "./types";
import { AssetManager } from "./AssetManager";
import { SpriteGenerator, CharacterSprites } from "./SpriteGenerator";
import { InputManager } from "./InputManager";

export class Game {
  private app!: Application;
  private gameContainer!: HTMLElement;
  private scale: number = 1;
  private assetManager: AssetManager;
  private backgroundSprite?: Sprite;
  private spriteGenerator: SpriteGenerator;
  private characterSprites?: CharacterSprites;
  private characterSprite?: Sprite;
  private inputManager?: InputManager;

  private readonly config: GameConfig = {
    gameWidth: 1024,
    gameHeight: 768,
    backgroundColor: 0x000022,
    targetFPS: 60,
  };

  private gameState: GameState = {
    currentAction: "walk",
    isRunning: false,
    lastUpdateTime: 0,
  };

  constructor() {
    this.assetManager = new AssetManager();
    this.spriteGenerator = new SpriteGenerator();
  }

  async initialize(): Promise<void> {
    await this.setupApplication();
    this.setupCanvas();
    this.setupInput();
    await this.loadAssets();
    this.setupBackground();
    this.setupCharacter();
    this.startGameLoop();
  }

  private async setupApplication(): Promise<void> {
    this.app = new Application();

    await this.app.init({
      width: this.config.gameWidth,
      height: this.config.gameHeight,
      backgroundColor: this.config.backgroundColor,
      antialias: false,
      resolution: 1,
      autoDensity: false,
    });

    this.gameContainer = document.getElementById("pixi-container")!;
    this.gameContainer.appendChild(this.app.canvas);
  }

  private setupCanvas(): void {
    const canvas = this.app.canvas;

    canvas.style.imageRendering = "pixelated";
    canvas.style.imageRendering = "crisp-edges";
    canvas.style.display = "block";
    canvas.style.width = "1024px";
    canvas.style.height = "768px";
  }

  private setupInput(): void {
    this.inputManager = new InputManager(
      this.app.canvas,
      this.config.gameWidth,
      this.config.gameHeight,
    );

    // Set up click handler
    this.inputManager.setClickCallback((position: Position) => {
      this.handleCanvasClick(position);
    });

    // Set up hover handler
    this.inputManager.setHoverCallback(() => {
      this.handleCanvasHover();
    });

    // Set up hover exit handler
    this.inputManager.setHoverExitCallback(() => {
      this.handleCanvasHoverExit();
    });

    console.log("Input system initialized");
  }

  private async loadAssets(): Promise<void> {
    try {
      console.log("Loading assets...");
      await this.assetManager.loadAllAssets();
      console.log("Assets loaded successfully");
    } catch (error) {
      console.error("Failed to load assets:", error);
      throw error;
    }
  }

  private setupBackground(): void {
    const backgroundTexture = this.assetManager.getAsset("cyberpunk");
    if (backgroundTexture) {
      this.backgroundSprite = new Sprite(backgroundTexture);

      // Scale background to fill entire canvas (1024x768)
      this.backgroundSprite.width = this.config.gameWidth;
      this.backgroundSprite.height = this.config.gameHeight;

      // Position at top-left (0,0)
      this.backgroundSprite.x = 0;
      this.backgroundSprite.y = 0;

      this.app.stage.addChild(this.backgroundSprite);
    } else {
      console.warn("Background texture not found");
    }
  }

  private setupCharacter(): void {
    // Generate character sprites using the renderer
    this.characterSprites =
      this.spriteGenerator.generateCharacterSpritesWithRenderer(
        this.app.renderer,
      );

    // Create character sprite with idle animation initially
    this.characterSprite = new Sprite(this.characterSprites.idle);

    // Position character at starting position (100, 150) from feature spec
    // Scale up the 16x24 sprite for visibility (scale by 3)
    this.characterSprite.scale.set(3, 3);
    this.characterSprite.x = 100;
    this.characterSprite.y = 150;

    this.app.stage.addChild(this.characterSprite);
    console.log("Character sprite created and added to stage");
  }

  private handleCanvasClick(position: Position): void {
    console.log(
      `Canvas clicked at game coordinates: (${position.x}, ${position.y})`,
    );

    // For now, just log the click - this will be expanded in future tasks
    // to handle object interactions and character movement
  }

  private handleCanvasHover(): void {
    // Update cursor based on what's under the mouse
    // For now, just show pointer cursor to demonstrate it's working
    // Position parameter will be used in future tasks for object detection
    if (this.inputManager) {
      this.inputManager.setCursor("crosshair");
    }
  }

  private handleCanvasHoverExit(): void {
    // Reset cursor when mouse leaves canvas
    if (this.inputManager) {
      this.inputManager.setCursor("default");
    }
  }

  private startGameLoop(): void {
    this.gameState.isRunning = true;
    this.gameState.lastUpdateTime = performance.now();

    const gameLoop = (currentTime: number) => {
      if (!this.gameState.isRunning) return;

      // const deltaTime = (currentTime - this.gameState.lastUpdateTime) / 1000;
      this.gameState.lastUpdateTime = currentTime;

      this.update();
      this.render();

      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
  }

  private update(): void {
    // Game update logic will be added in future tasks
    // deltaTime parameter will be added when movement system is implemented
  }

  private render(): void {
    // Additional rendering logic will be added in future tasks
    // PixiJS handles the main rendering automatically
  }

  getScale(): number {
    return this.scale;
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  getAssetManager(): AssetManager {
    return this.assetManager;
  }

  getSpriteGenerator(): SpriteGenerator {
    return this.spriteGenerator;
  }

  getCharacterSprites(): CharacterSprites | undefined {
    return this.characterSprites;
  }

  getCharacterSprite(): Sprite | undefined {
    return this.characterSprite;
  }

  getInputManager(): InputManager | undefined {
    return this.inputManager;
  }
}
