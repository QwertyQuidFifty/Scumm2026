import { Application, Sprite } from "pixi.js";
import { GameConfig, GameState, Position } from "./types";
import { AssetManager } from "./AssetManager";
import { SpriteGenerator, CharacterSprites } from "./SpriteGenerator";
import { InputManager } from "./InputManager";
import { ObjectManager } from "./ObjectManager";
import { CharacterController } from "./CharacterController";

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
  private objectManager: ObjectManager;
  private characterController?: CharacterController;

  // Walkable area polygon (street area)
  private readonly walkableArea: Position[] = [
    { x: 0, y: 763 },
    { x: 3, y: 652 },
    { x: 387, y: 570 },
    { x: 568, y: 570 },
    { x: 976, y: 667 },
    { x: 1024, y: 763 },
  ];

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
    this.objectManager = new ObjectManager();
  }

  async initialize(): Promise<void> {
    await this.setupApplication();
    this.setupCanvas();
    this.setupInput();
    await this.loadAssets();
    this.setupBackground();
    this.setupObjects();
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
    this.inputManager.setHoverCallback((position: Position) => {
      this.handleCanvasHover(position);
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

  private setupObjects(): void {
    // Initialize interactive objects
    this.objectManager.initializeGameObjects();

    // Add highlight container to stage (above background, below character)
    this.app.stage.addChild(this.objectManager.getHighlightContainer());

    console.log("Interactive objects initialized");
  }

  private setupCharacter(): void {
    // Generate character sprites using the renderer
    this.characterSprites =
      this.spriteGenerator.generateCharacterSpritesWithRenderer(
        this.app.renderer,
      );

    // Create character sprite with idle animation initially
    this.characterSprite = new Sprite(this.characterSprites.idle);

    // Set anchor to bottom center (0.5, 1.0) so sprite aligns naturally to ground
    this.characterSprite.anchor.set(0.5, 1.0);

    // Position character within the walkable area (street)
    // Scale up the 16x24 sprite for visibility (scale by 3)
    this.characterSprite.scale.set(3, 3);
    this.characterSprite.x = 400; // Center of street area
    this.characterSprite.y = 650; // Within street polygon

    this.app.stage.addChild(this.characterSprite);

    // Initialize character controller
    this.characterController = new CharacterController(
      this.characterSprite,
      this.characterSprites,
    );

    // Set up walkable area using the dedicated walkable area polygon
    this.characterController.setWalkableArea(this.walkableArea);

    console.log("Character sprite and controller created and added to stage");
  }

  private handleCanvasClick(position: Position): void {
    console.log(
      `Canvas clicked at game coordinates: (${position.x}, ${position.y})`,
    );

    // Check if click hit an interactive object
    const clickedObject = this.objectManager.getObjectAtPosition(
      position.x,
      position.y,
    );

    if (clickedObject && this.characterController) {
      console.log(`Clicked on object: ${clickedObject.name}`);

      // Move character to interaction point near the object
      const success = this.characterController.moveToObject(clickedObject);

      if (success) {
        console.log(`Moving to interact with: ${clickedObject.name}`);
        // TODO: Add interaction logic after movement completes
      } else {
        console.log(`Cannot reach object: ${clickedObject.name}`);
      }
    } else if (this.characterController) {
      // Try to move character to clicked position
      const success = this.characterController.moveTo(position.x, position.y);

      if (success) {
        console.log("Moving character to clicked position");
      } else {
        console.log("Cannot move to that position - outside walkable area");
      }
    }
  }

  private handleCanvasHover(position: Position): void {
    // Update object hover states and highlighting
    const hoveredObject = this.objectManager.updateHover(position);

    // Update cursor based on what's under the mouse
    if (this.inputManager) {
      if (hoveredObject) {
        this.inputManager.setCursor("pointer");
      } else {
        this.inputManager.setCursor("crosshair");
      }
    }
  }

  private handleCanvasHoverExit(): void {
    // Clear object hover states
    this.objectManager.clearHover();

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
    const currentTime = performance.now();

    // Update character movement and animation
    if (this.characterController) {
      this.characterController.update(currentTime);
    }
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

  getObjectManager(): ObjectManager {
    return this.objectManager;
  }

  getCharacterController(): CharacterController | undefined {
    return this.characterController;
  }
}
