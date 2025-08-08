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
import { ActionResponseSystem } from "./ActionResponseSystem";
import { SpeechBubble } from "./SpeechBubble";
import { StageManager } from "./StageManager";

export class Game {
  private app!: Application;
  private gameContainer!: HTMLElement;
  private scale: number = 1;
  private assetManager: AssetManager;
  private spriteGenerator: SpriteGenerator;
  private characterSprites?: CharacterSprites;
  private characterSprite?: Sprite;
  private inputManager?: InputManager;
  private objectManager: ObjectManager;
  private characterController?: CharacterController;
  private actionBar?: ActionBar;
  private commandPanel?: CommandPanel;
  private inventorySystem?: InventorySystem;
  private actionResponseSystem: ActionResponseSystem;
  private speechBubble?: SpeechBubble;
  private stageManager: StageManager;

  // UI layout configuration
  private gameAreaWidth: number = 1024; // Original game area (unchanged)

  // Pending action system
  private pendingAction?: { action: ActionType; object: InteractiveObject };
  private pendingItemObjectAction?: {
    item: InventoryItem;
    object: InteractiveObject;
  };
  private wasCharacterMoving: boolean = false;
  private isPendingWalkActionColor: boolean = false;

  // Inventory item selection system
  private selectedInventoryItem?: InventoryItem;

  private readonly config: GameConfig = {
    gameWidth: 1230, // Original 1024 + 196px UI column + 10px right padding
    gameHeight: 808, // 768 + 40px for action bar above background
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
    this.actionResponseSystem = new ActionResponseSystem();
    this.stageManager = new StageManager(
      this.assetManager,
      this.objectManager,
      this.gameAreaWidth,
    );
  }

  async initialize(): Promise<void> {
    await this.setupApplication();
    this.setupCanvas();
    this.setupInput();
    await this.loadAssets();
    await this.initializeStages();
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
    canvas.style.height = "808px"; // Extended to accommodate action bar above background
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

    // Set up right-click handler
    this.inputManager.setRightClickCallback((position: Position) => {
      this.handleCanvasRightClick(position);
    });

    // Set up keyboard handler
    this.inputManager.setKeyPressCallback((key: string) => {
      this.handleKeyPress(key);
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

  private async initializeStages(): Promise<void> {
    // Initialize the stage system with predefined stages
    this.stageManager.initializeStages();

    // Load the initial stage (cyberpunk street)
    const success = await this.stageManager.loadStage(
      "cyberpunk-street",
      this.app.stage,
    );
    if (!success) {
      throw new Error("Failed to load initial stage");
    }

    // Add highlight container to stage (above background, below character)
    this.app.stage.addChild(this.objectManager.getHighlightContainer());

    console.log("Stage system initialized and initial stage loaded");
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

    // Get current stage for character positioning
    const currentStage = this.stageManager.getCurrentStage();
    if (!currentStage) {
      throw new Error("No current stage available for character setup");
    }

    // Position character at stage start position
    // Scale up the 16x24 sprite for visibility (scale by 3)
    this.characterSprite.scale.set(3, 3);
    this.characterSprite.x = currentStage.characterStartPosition.x;
    this.characterSprite.y = currentStage.characterStartPosition.y;

    this.app.stage.addChild(this.characterSprite);

    // Initialize character controller
    this.characterController = new CharacterController(
      this.characterSprite,
      this.characterSprites,
    );

    // Set up walkable area from current stage
    this.characterController.setWalkableArea(currentStage.walkableArea);

    // Create speech bubble (positioned above character)
    this.speechBubble = new SpeechBubble();
    this.app.stage.addChild(this.speechBubble);

    console.log(
      "Character sprite, controller, and speech bubble created and added to stage",
    );
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
      // Check if we have a selected inventory item for "use with" functionality
      if (this.selectedInventoryItem) {
        console.log(
          `Using ${this.selectedInventoryItem.name} with ${clickedObject.name}`,
        );

        // Move character to object and then use the item with it
        const success = this.characterController.moveToObject(clickedObject);

        if (success) {
          // Flash action bar pink when object is clicked
          if (this.actionBar) {
            this.actionBar.flashPink();
          }

          // Store the pending item-object combination action
          this.setPendingItemObjectAction(
            this.selectedInventoryItem,
            clickedObject,
          );
        } else {
          console.log(`Cannot reach object: ${clickedObject.name}`);
        }
        return;
      }

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
        } else {
          // For walk action on interactive areas, just set flag to revert color when arrived
          this.isPendingWalkActionColor = true;
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
          this.isPendingWalkActionColor = true;
        }
      } else {
        console.log("Cannot move to that position - outside walkable area");
      }
    }
  }

  private handleCanvasRightClick(position: Position): void {
    console.log(
      `Canvas right-clicked at game coordinates: (${position.x}, ${position.y})`,
    );

    // Check if right-click hit an interactive object
    const clickedObject = this.objectManager.getObjectAtPosition(
      position.x,
      position.y,
    );

    if (clickedObject && this.characterController) {
      console.log(
        `Right-clicked on object: ${clickedObject.name} with default action: ${clickedObject.defaultAction}`,
      );

      // Execute the default action
      this.executeDefaultAction(clickedObject.defaultAction, clickedObject);
    } else {
      // Check if right-click hit the UI area (inventory)
      const uiAreaStartX = this.gameAreaWidth + 10;
      if (position.x >= uiAreaStartX && this.inventorySystem) {
        // Check if we hit an inventory item (this is a simplified check)
        // For now, right-click on inventory is disabled - can be implemented later
        const hoveredSlot = this.getInventorySlotAtPosition();
        if (hoveredSlot !== undefined) {
          const item = this.inventorySystem.getItem(hoveredSlot);
          if (item) {
            console.log(
              `Right-clicked on inventory item: ${item.name} with default action: ${item.defaultAction}`,
            );
            this.executeDefaultInventoryAction(item.defaultAction, item);
          }
        }
      }
    }
  }

  private handleKeyPress(key: string): void {
    console.log(`Key pressed: ${key}`);

    // Map keyboard shortcuts to actions
    const keyToActionMap: { [key: string]: ActionType } = {
      w: "walk",
      t: "talk",
      u: "use",
      g: "get",
      l: "look",
      o: "open",
    };

    const action = keyToActionMap[key];
    if (action && this.commandPanel) {
      // Update the command panel selection and trigger action change
      this.commandPanel.setSelectedAction(action);
      this.handleActionChange(action);

      console.log(`Keyboard shortcut: ${key.toUpperCase()} -> ${action}`);
    }
  }

  private handleCanvasHover(position: Position): void {
    // Don't handle canvas hover for UI area (inventory/command panel area)
    // UI area starts at gameAreaWidth + 10
    const uiAreaStartX = this.gameAreaWidth + 10;
    if (position.x >= uiAreaStartX) {
      return; // Let inventory/command panel handle their own hover events
    }

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

    // Update action bar text and highlight default actions
    if (this.actionBar && this.commandPanel) {
      if (hoveredObject) {
        // Highlight the default action for this object
        this.commandPanel.setDefaultActionHighlight(
          hoveredObject.defaultAction,
        );

        // If we have a selected inventory item, append the object name to "Use X with"
        if (this.selectedInventoryItem) {
          this.actionBar.updateText(
            `Use ${this.selectedInventoryItem.name.toLowerCase()} with ${hoveredObject.name.toLowerCase()}`,
          );
        } else {
          this.actionBar.showObjectHover(hoveredObject.name);
        }
      } else {
        // Clear default action highlighting when not hovering any object
        this.commandPanel.clearDefaultActionHighlight();

        // If we have a selected inventory item, show "Use X with" when not hovering anything
        if (this.selectedInventoryItem) {
          this.actionBar.updateText(
            `Use ${this.selectedInventoryItem.name.toLowerCase()} with`,
          );
        } else {
          this.actionBar.showDefaultText();
        }
      }
    }
  }

  private handleCanvasHoverExit(): void {
    // Clear object hover states
    this.objectManager.clearHover();

    // Clear default action highlighting
    if (this.commandPanel) {
      this.commandPanel.clearDefaultActionHighlight();
    }

    // Reset cursor when mouse leaves canvas
    if (this.inputManager) {
      this.inputManager.setCursor("default");
    }

    // Reset action bar to default text, but preserve "Use X with" if item is selected
    if (this.actionBar) {
      if (this.selectedInventoryItem) {
        // Keep showing "Use X with" text (without object name when cursor leaves canvas)
        this.actionBar.updateText(
          `Use ${this.selectedInventoryItem.name.toLowerCase()} with`,
        );
      } else {
        this.actionBar.showDefaultText();
      }
    }
  }

  private handleActionChange(action: ActionType): void {
    // Update game state
    this.gameState.currentAction = action;

    // Clear any selected inventory item when action changes
    if (this.selectedInventoryItem) {
      this.selectedInventoryItem = undefined;
      console.log("Cleared selected inventory item due to action change");
    }

    // Update action bar to reflect new action
    if (this.actionBar) {
      this.actionBar.setAction(action);
    }

    console.log(`Current action changed to: ${action}`);
  }

  private handleGetAction(object: InteractiveObject): void {
    // Handle pickup action for specific objects
    if (
      object.id === "golden-key" &&
      this.stageManager.getKeySprite() &&
      this.inventorySystem
    ) {
      // Create inventory item for the key
      const keyItem: InventoryItem = {
        id: "golden-key",
        name: "Golden Key",
        description: "A shiny golden key that might unlock something important",
        color: 0xffd700, // Gold color
        icon: "KEY",
        defaultAction: "look", // All inventory items default to Look
      };

      // Try to add to inventory
      const success = this.inventorySystem.addItem(keyItem);

      if (success) {
        // Remove visual sprite from scene using stage manager
        this.stageManager.removeKeySprite(this.app.stage);

        // Remove interactive object from object manager
        this.objectManager.removeObject("golden-key");

        console.log("Golden key picked up and added to inventory");
      } else {
        console.log("Cannot pick up key - inventory is full");
      }
    } else {
      console.log(`Cannot get ${object.name} - not a pickupable item`);
    }
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

  private setPendingItemObjectAction(
    item: InventoryItem,
    object: InteractiveObject,
  ): void {
    this.pendingItemObjectAction = { item, object };
    console.log(
      `Set pending item-object action: Use ${item.name} with ${object.name}`,
    );
  }

  private executePendingAction(): void {
    if (!this.pendingAction) return;

    const { action, object } = this.pendingAction;
    console.log(`Executing pending action: ${action} on ${object.name}`);

    // Revert action bar color when we arrive at the object (before executing the action)
    if (this.actionBar) {
      this.actionBar.revertColor();
    }

    // Get the appropriate response for this object-action combination
    const response = this.actionResponseSystem.getResponse(object.id, action);

    if (response) {
      // Show response text in speech bubble above character
      if (this.speechBubble && this.characterSprite) {
        this.speechBubble.showSpeech(response.text);
        this.speechBubble.positionAboveCharacter(
          this.characterSprite.x,
          this.characterSprite.y,
          this.config.gameHeight,
        );
      }

      // Handle special cases that need additional logic
      if (action === "get" && object.id === "golden-key") {
        // Special handling for pickupable items
        this.handleGetAction(object);
      }

      console.log(`${action.toUpperCase()}: ${response.text}`);
    } else {
      // Fallback for unknown object-action combinations
      const fallbackText = `I can't ${action} the ${object.name}.`;
      if (this.speechBubble && this.characterSprite) {
        this.speechBubble.showSpeech(fallbackText);
        this.speechBubble.positionAboveCharacter(
          this.characterSprite.x,
          this.characterSprite.y,
          this.config.gameHeight,
        );
      }
      console.log(`Unknown action: ${action} on ${object.name}`);
    }

    // Clear the pending action
    this.pendingAction = undefined;

    // Revert to walk action after executing the action
    this.revertToWalkAction();
  }

  private executePendingItemObjectAction(): void {
    if (!this.pendingItemObjectAction) return;

    const { item, object } = this.pendingItemObjectAction;
    console.log(
      `Executing item-object action: Use ${item.name} with ${object.name}`,
    );

    // Revert action bar color when we arrive at the object
    if (this.actionBar) {
      this.actionBar.revertColor();
    }

    // Handle item-object combinations with speech responses
    this.handleItemObjectCombination(item, object);

    // Clear the pending action and selected item
    this.pendingItemObjectAction = undefined;
    this.selectedInventoryItem = undefined;

    // Revert to walk action after executing the action
    this.revertToWalkAction();
  }

  private handleItemObjectCombination(
    item: InventoryItem,
    object: InteractiveObject,
  ): void {
    // For now, provide generic responses for item-object combinations
    // In a full game, this would have specific logic for each combination

    let responseText;
    const combinationKey = `${item.id}-${object.id}`;

    // Handle some specific known combinations
    switch (combinationKey) {
      case "keycard-building-entrance":
        responseText =
          "I swipe the keycard, but nothing happens. Maybe it's not for this door.";
        break;
      case "keycard-cryptic-door":
        responseText =
          "The keycard doesn't fit. This door doesn't have a card reader.";
        break;
      default:
        responseText = `Using the ${item.name.toLowerCase()} with the ${object.name.toLowerCase()} doesn't seem to work.`;
    }

    // Show response in speech bubble
    if (this.speechBubble && this.characterSprite) {
      this.speechBubble.showSpeech(responseText);
      this.speechBubble.positionAboveCharacter(
        this.characterSprite.x,
        this.characterSprite.y,
        this.config.gameHeight,
      );
    }

    console.log(`Item-Object combination: ${responseText}`);
  }

  private handleInventoryClick(slotIndex: number, item?: InventoryItem): void {
    if (item) {
      console.log(`Clicked inventory item: ${item.name} in slot ${slotIndex}`);

      // Check if we have a selected item for "use with" functionality
      if (
        this.selectedInventoryItem &&
        this.selectedInventoryItem.id !== item.id
      ) {
        console.log(
          `Using ${this.selectedInventoryItem.name} with ${item.name}`,
        );
        this.handleItemItemCombination(this.selectedInventoryItem, item);
        return;
      }

      // Default action for inventory items is "look" unless another action is selected
      const currentAction = this.gameState.currentAction;
      const actionToUse = currentAction === "walk" ? "look" : currentAction;

      // Handle "Use" action specially - select the item for "use with" functionality
      if (actionToUse === "use") {
        this.selectInventoryItemForUse(item);
      } else {
        this.handleInventoryItemAction(item, actionToUse);
      }
    } else {
      console.log(`Clicked empty inventory slot ${slotIndex}`);
    }
  }

  private handleItemItemCombination(
    item1: InventoryItem,
    item2: InventoryItem,
  ): void {
    // Handle item-to-item combinations
    let responseText;
    const combinationKey = `${item1.id}-${item2.id}`;

    // Handle specific known item combinations
    switch (combinationKey) {
      case "keycard-datapad":
        responseText =
          "I try to use the keycard on the data pad, but nothing happens.";
        break;
      case "credits-datapad":
        responseText = "The data pad doesn't have a payment slot for credits.";
        break;
      default:
        responseText = `I can't use the ${item1.name.toLowerCase()} with the ${item2.name.toLowerCase()}.`;
    }

    // Show response in speech bubble
    if (this.speechBubble && this.characterSprite) {
      this.speechBubble.showSpeech(responseText);
      this.speechBubble.positionAboveCharacter(
        this.characterSprite.x,
        this.characterSprite.y,
        this.config.gameHeight,
      );
    }

    // Clear selected item and revert action
    this.selectedInventoryItem = undefined;
    this.revertToWalkAction();

    console.log(`Item-Item combination: ${responseText}`);
  }

  private selectInventoryItemForUse(item: InventoryItem): void {
    this.selectedInventoryItem = item;

    // Update action bar to show "Use X with"
    if (this.actionBar) {
      this.actionBar.updateText(`Use ${item.name.toLowerCase()} with`);
    }

    console.log(`Selected ${item.name} for use - waiting for target`);
  }

  private handleInventoryItemAction(
    item: InventoryItem,
    action: ActionType,
  ): void {
    // Get the appropriate response for this inventory item-action combination
    const response = this.actionResponseSystem.getResponse(item.id, action);

    if (response) {
      // Show response text in speech bubble above character
      if (this.speechBubble && this.characterSprite) {
        this.speechBubble.showSpeech(response.text);
        this.speechBubble.positionAboveCharacter(
          this.characterSprite.x,
          this.characterSprite.y,
          this.config.gameHeight,
        );
      }

      console.log(`${action.toUpperCase()} ${item.name}: ${response.text}`);
    } else {
      // Fallback for unknown item-action combinations
      const fallbackText = `I can't ${action} the ${item.name}.`;
      if (this.speechBubble && this.characterSprite) {
        this.speechBubble.showSpeech(fallbackText);
        this.speechBubble.positionAboveCharacter(
          this.characterSprite.x,
          this.characterSprite.y,
          this.config.gameHeight,
        );
      }
      console.log(`Unknown action: ${action} on ${item.name}`);
    }
  }

  private handleInventoryHover(_slotIndex: number, item?: InventoryItem): void {
    if (item && this.actionBar && this.commandPanel) {
      // If we have a selected inventory item, don't show normal hover text or highlighting
      if (this.selectedInventoryItem) {
        return;
      }

      // Highlight the default action for this inventory item
      this.commandPanel.setDefaultActionHighlight(item.defaultAction);

      // Show the appropriate action with item name based on current action
      const currentAction = this.gameState.currentAction;
      const actionToUse = currentAction === "walk" ? "look" : currentAction;

      let actionText;
      switch (actionToUse.toLowerCase()) {
        case "look":
          actionText = `Look at ${item.name.toLowerCase()}`;
          break;
        case "use":
          actionText = `Use ${item.name.toLowerCase()}`;
          break;
        case "get":
          actionText = `Get ${item.name.toLowerCase()}`;
          break;
        case "talk":
          actionText = `Talk to ${item.name.toLowerCase()}`;
          break;
        case "open":
          actionText = `Open ${item.name.toLowerCase()}`;
          break;
        default:
          actionText = `${actionToUse} ${item.name.toLowerCase()}`;
      }

      this.actionBar.updateText(actionText);
    }
  }

  private handleInventoryHoverExit(): void {
    if (this.actionBar && this.commandPanel) {
      // Clear default action highlighting when leaving inventory
      if (!this.selectedInventoryItem) {
        this.commandPanel.clearDefaultActionHighlight();
      }

      // Only revert to default text if we don't have a selected inventory item
      if (this.selectedInventoryItem) {
        // Keep showing "Use X with" text when leaving inventory area
        this.actionBar.updateText(
          `Use ${this.selectedInventoryItem.name.toLowerCase()} with`,
        );
      } else {
        // Return action bar to showing current action (not default text which shows object names)
        this.actionBar.setAction(this.gameState.currentAction);
      }
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

    // Check if movement just completed and we have a pending item-object action
    if (
      this.wasCharacterMoving &&
      !isCurrentlyMoving &&
      this.pendingItemObjectAction
    ) {
      this.executePendingItemObjectAction();
    }

    // Check if walk action just completed and we need to revert action bar color
    if (
      this.wasCharacterMoving &&
      !isCurrentlyMoving &&
      this.isPendingWalkActionColor
    ) {
      if (this.actionBar) {
        this.actionBar.revertColor();
      }
      this.isPendingWalkActionColor = false;
    }

    // Update movement tracking for next frame
    this.wasCharacterMoving = isCurrentlyMoving;
  }

  private render(): void {
    // Additional rendering logic will be added in future tasks
    // PixiJS handles the main rendering automatically
  }

  private executeDefaultAction(
    action: ActionType,
    object: InteractiveObject,
  ): void {
    // Temporarily set the game state to the default action
    const previousAction = this.gameState.currentAction;
    this.gameState.currentAction = action;

    // Update action bar to show the default action with object name
    if (this.actionBar) {
      this.actionBar.showObjectHoverWithAction(object.name, action);
    }

    // Move character to object and execute the default action
    const success = this.characterController?.moveToObject(object);

    if (success) {
      console.log(
        `Moving to execute default action: ${action} on ${object.name}`,
      );

      // Flash action bar pink when object is clicked
      if (this.actionBar) {
        this.actionBar.flashPink();
      }

      // Store the pending action to execute when movement completes
      this.setPendingAction(action, object);
    } else {
      console.log(`Cannot reach object: ${object.name}`);
      // Restore previous action if movement failed
      this.gameState.currentAction = previousAction;

      // Restore previous action bar state if movement failed
      if (this.actionBar) {
        this.actionBar.setAction(previousAction);
      }
    }
  }

  private executeDefaultInventoryAction(
    action: ActionType,
    item: InventoryItem,
  ): void {
    // For inventory items, execute the action immediately (no movement required)
    console.log(`Executing default action: ${action} on ${item.name}`);
    this.handleInventoryItemAction(item, action);
  }

  private getInventorySlotAtPosition(): number | undefined {
    // This is a simplified calculation - in reality you'd need to account for
    // inventory positioning, slot size, spacing, etc.
    // For now, returning undefined to disable right-click on inventory
    // This can be implemented properly later if needed
    return undefined;
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

  getStageManager(): StageManager {
    return this.stageManager;
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
        icon: "💳",
        defaultAction: "look", // All inventory items default to Look
      },
      {
        id: "credits",
        name: "Credits",
        description: "Digita💴currency chips worth 100 credits.",
        color: 0xf5a623, // orange
        icon: "💴",
        defaultAction: "look", // All inventory items default to Look
      },
      {
        id: "datapad",
        name: "Data Pad",
        description: "A small handheld device containing encrypted files.",
        color: 0x7ed321, // green
        icon: "📔",
        defaultAction: "look", // All inventory items default to Look
      },
    ];

    for (const item of testItems) {
      this.inventorySystem.addItem(item);
    }

    console.log("Added test inventory items");
  }
}
