import { Application, Sprite } from "pixi.js";
import { GameConfig, GameState, Position } from "./types";
import { AssetManager } from "./AssetManager";
import { SpriteGenerator, CharacterSprites } from "./SpriteGenerator";
import { InputManager } from "./InputManager";
import { ObjectManager } from "./ObjectManager";
import { CharacterController } from "./CharacterController";
import { ActionBar } from "./ActionBar";
import { CommandPanel, ActionType } from "./CommandPanel";
import { InteractiveObject } from "./InteractiveObject";
import { InventorySystem, InventoryItem } from "./InventorySystem";

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
  private actionBar?: ActionBar;
  private commandPanel?: CommandPanel;
  private inventorySystem?: InventorySystem;

  // UI layout configuration
  private gameAreaWidth: number = 1024; // Original game area (unchanged)
  private uiAreaWidth: number = 196; // Wider UI column for larger elements

  // Pending action system
  private pendingAction?: { action: ActionType; object: InteractiveObject };
  private wasCharacterMoving: boolean = false;

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
    gameWidth: 1230, // Original 1024 + 196px UI column + 10px right padding
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
    this.setupUI();
    this.addTestInventoryItems(); // Add test items after UI is set up
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
    canvas.style.width = "1230px"; // Updated to match new canvas width with right padding
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

      // Scale background to fill original game area (1024x768) - unchanged
      this.backgroundSprite.width = this.gameAreaWidth;
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

  private setupUI(): void {
    // Create action bar (spans full width at top)
    this.actionBar = new ActionBar(this.config.gameWidth);
    this.actionBar.setPosition(0, 0);
    this.app.stage.addChild(this.actionBar.getContainer());

    // Calculate right-side UI positioning (in the black space to the right)
    const rightColumnX = this.gameAreaWidth + 10; // Original game area + padding
    const actionBarSpacing = 15; // Space between action bar and action buttons
    const sectionSpacing = 25; // Larger spacing between action buttons and inventory

    // Create command panel (positioned in right column, 2x3 grid)
    // Add space between action bar and buttons, align columns properly
    this.commandPanel = new CommandPanel();
    const commandPanelY = this.actionBar!.getHeight() + actionBarSpacing;
    this.commandPanel.setPosition(rightColumnX, commandPanelY);
    this.app.stage.addChild(this.commandPanel.getContainer());

    // Create inventory system (positioned below command panel, aligned columns)
    // Ensure left/right columns align between action buttons and inventory
    this.inventorySystem = new InventorySystem();
    const inventoryY =
      commandPanelY + this.commandPanel.getHeight() + sectionSpacing;
    this.inventorySystem.setPosition(rightColumnX, inventoryY);
    this.app.stage.addChild(this.inventorySystem.getContainer());

    // Set up event handlers
    this.commandPanel.setOnActionChange((action: ActionType) => {
      this.handleActionChange(action);
    });

    this.inventorySystem.setOnSlotClick(
      (slotIndex: number, item?: InventoryItem) => {
        this.handleInventoryClick(slotIndex, item);
      },
    );

    this.inventorySystem.setOnSlotHover(
      (slotIndex: number, item?: InventoryItem) => {
        this.handleInventoryHover(slotIndex, item);
      },
    );

    this.inventorySystem.setOnSlotHoverExit(() => {
      this.handleInventoryHoverExit();
    });

    console.log(
      "UI components positioned in right column with larger buttons/slots and better separation",
    );
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
      const currentAction = this.gameState.currentAction;
      console.log(
        `Clicked on object: ${clickedObject.name} with action: ${currentAction}`,
      );

      // Move character to interaction point near the object for all actions
      const success = this.characterController.moveToObject(clickedObject);

      if (success) {
        console.log(`Moving to ${currentAction} with: ${clickedObject.name}`);

        // Flash action bar pink when object is clicked
        if (this.actionBar) {
          this.actionBar.flashPink();
        }

        // Store the pending action to execute when movement completes
        if (currentAction !== "walk") {
          this.setPendingAction(currentAction, clickedObject);
        }
      } else {
        console.log(`Cannot reach object: ${clickedObject.name}`);
      }
    } else if (
      this.characterController &&
      this.gameState.currentAction === "walk"
    ) {
      // Only move character if current action is walk
      const success = this.characterController.moveTo(position.x, position.y);

      if (success) {
        console.log("Moving character to clicked position");

        // Flash action bar pink when walking to empty area
        if (this.actionBar) {
          this.actionBar.flashPink();
          // For walk actions, revert color immediately since movement is the action
          setTimeout(() => {
            if (this.actionBar) {
              this.actionBar.revertColor();
            }
          }, 150);
        }
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

    // Update action bar text based on hovered object
    if (this.actionBar) {
      if (hoveredObject) {
        this.actionBar.showObjectHover(hoveredObject.name);
      } else {
        this.actionBar.showDefaultText();
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

    // Reset action bar to default text
    if (this.actionBar) {
      this.actionBar.showDefaultText();
    }
  }

  private handleActionChange(action: ActionType): void {
    // Update game state
    this.gameState.currentAction = action;

    // Update action bar to reflect new action
    if (this.actionBar) {
      this.actionBar.setAction(action);
    }

    console.log(`Current action changed to: ${action}`);
  }

  private revertToWalkAction(): void {
    // Revert to walk action after executing another action
    if (this.commandPanel) {
      this.commandPanel.setSelectedAction("walk");
    }

    this.handleActionChange("walk");
    console.log("Reverted to walk action");
  }

  private setPendingAction(
    action: ActionType,
    object: InteractiveObject,
  ): void {
    this.pendingAction = { action, object };
    console.log(`Set pending action: ${action} on ${object.name}`);
  }

  private executePendingAction(): void {
    if (!this.pendingAction) return;

    const { action, object } = this.pendingAction;
    console.log(`Executing pending action: ${action} on ${object.name}`);

    // TODO: Implement specific action logic here
    // For now, just log what would happen
    switch (action) {
      case "look":
        console.log(`Looking at ${object.name}: ${object.description}`);
        break;
      case "use":
        console.log(`Using ${object.name}`);
        break;
      case "get":
        console.log(`Trying to get ${object.name}`);
        break;
      case "talk":
        console.log(`Talking to ${object.name}`);
        break;
      case "open":
        console.log(`Trying to open ${object.name}`);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }

    // Clear the pending action
    this.pendingAction = undefined;

    // Revert action bar color when action is complete
    if (this.actionBar) {
      this.actionBar.revertColor();
    }

    // Revert to walk action after executing the action
    this.revertToWalkAction();
  }

  private handleInventoryClick(slotIndex: number, item?: InventoryItem): void {
    if (item) {
      console.log(`Clicked inventory item: ${item.name} in slot ${slotIndex}`);
      // TODO: Handle item selection/usage
    } else {
      console.log(`Clicked empty inventory slot ${slotIndex}`);
    }
  }

  private handleInventoryHover(slotIndex: number, item?: InventoryItem): void {
    if (item && this.actionBar) {
      // Update action bar to show item name when hovering
      this.actionBar.updateText(item.name);
    }
  }

  private handleInventoryHoverExit(): void {
    if (this.actionBar) {
      // Return action bar to showing current action when not hovering inventory
      this.actionBar.showDefaultText();
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

    // Check current movement state
    const isCurrentlyMoving = this.characterController?.isMoving() || false;

    // Update character movement and animation
    if (this.characterController) {
      this.characterController.update(currentTime);
    }

    // Check if movement just completed and we have a pending action
    if (this.wasCharacterMoving && !isCurrentlyMoving && this.pendingAction) {
      this.executePendingAction();
    }

    // Update movement tracking for next frame
    this.wasCharacterMoving = isCurrentlyMoving;
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

  getActionBar(): ActionBar | undefined {
    return this.actionBar;
  }

  getCommandPanel(): CommandPanel | undefined {
    return this.commandPanel;
  }

  getInventorySystem(): InventorySystem | undefined {
    return this.inventorySystem;
  }

  // Test method to add some sample inventory items
  addTestInventoryItems(): void {
    if (!this.inventorySystem) return;

    // Add test items as specified in the documentation
    const testItems: InventoryItem[] = [
      {
        id: "keycard",
        name: "Key Card",
        description: "A plastic access card with a magnetic strip.",
        color: 0x4a90e2, // blue
        icon: "KEY",
      },
      {
        id: "credits",
        name: "Credits",
        description: "Digital currency chips worth 100 credits.",
        color: 0xf5a623, // orange
        icon: "¢100",
      },
      {
        id: "datapad",
        name: "Data Pad",
        description: "A small handheld device containing encrypted files.",
        color: 0x7ed321, // green
        icon: "PAD",
      },
    ];

    for (const item of testItems) {
      this.inventorySystem.addItem(item);
    }

    console.log("Added test inventory items");
  }
}
