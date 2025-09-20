import { Application, Sprite, Container } from "pixi.js";
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
import { StageTransition } from "./Stage";
import { PerspectiveScaler } from "./PerspectiveScaler";
import { NPCManager } from "./NPCManager";
import { NPC } from "./NPC";
import { DepthManager } from "./DepthManager";
import { DialogueManager, DialogueTree, DialogueNode } from "./DialogueTree";
import { DialogueUI } from "./DialogueUI";

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
  private perspectiveScaler: PerspectiveScaler;
  private npcManager: NPCManager;
  private depthManager?: DepthManager;
  private gameWorldContainer?: Container;
  private dialogueManager: DialogueManager;
  private dialogueUI?: DialogueUI;

  // UI layout configuration
  private gameAreaWidth: number = 1024; // Original game area (unchanged)

  // Pending action system
  private pendingAction?: { action: ActionType; object: InteractiveObject };
  private pendingItemObjectAction?: {
    item: InventoryItem;
    object: InteractiveObject;
  };
  private pendingNPCAction?: { action: ActionType; npc: NPC };
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
    this.npcManager = new NPCManager();
    this.stageManager = new StageManager(this.assetManager, this.objectManager);
    this.stageManager.setNPCManager(this.npcManager);
    this.perspectiveScaler = new PerspectiveScaler();
    this.dialogueManager = new DialogueManager();
  }

  async initialize(): Promise<void> {
    await this.setupApplication();
    this.setupCanvas();
    this.setupInput();
    await this.loadAssets();
    this.setupCharacterSprites(); // Set up sprite generation BEFORE stages
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

    // Create game world container for depth sorting
    this.gameWorldContainer = new Container();
    this.app.stage.addChild(this.gameWorldContainer);

    // Initialize depth manager
    this.depthManager = new DepthManager(this.gameWorldContainer);
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

    // Set up depth managers BEFORE loading stage
    this.stageManager.setDepthManager(this.depthManager!);
    this.npcManager.setDepthManager(this.depthManager!);

    // Set up renderer for stage overlays
    this.stageManager.setRenderer(this.app.renderer);

    // Load the initial stage (cyberpunk street) into game world container
    const success = await this.stageManager.loadStage(
      "cyberpunk-street",
      this.gameWorldContainer!,
    );
    if (!success) {
      throw new Error("Failed to load initial stage");
    }

    // Add highlight container to game world (above background, below character)
    this.gameWorldContainer!.addChild(
      this.objectManager.getHighlightContainer(),
    );

    console.log("Stage system initialized and initial stage loaded");
    console.log(
      `Stage children after loading: ${this.app.stage.children.length}`,
    );
    this.app.stage.children.forEach((child, index) => {
      console.log(
        `  ${index}: ${child.constructor.name} (visible: ${child.visible}, alpha: ${child.alpha})`,
      );
    });
  }

  private setupCharacterSprites(): void {
    // Generate character sprites using the renderer
    this.characterSprites =
      this.spriteGenerator.generateCharacterSpritesWithRenderer(
        this.app.renderer,
      );

    // Set up NPC sprite generation system
    this.npcManager.setSpriteGenerator(this.spriteGenerator, this.app.renderer);

    // Generate and set basic NPC sprites as fallback
    const npcSprites = this.spriteGenerator.generateNPCSpritesWithRenderer(
      this.app.renderer,
      "basic",
    );
    this.npcManager.setNPCSprites(npcSprites);

    console.log("Character and NPC sprites initialized");
  }

  private setupCharacter(): void {
    // Create character sprite with idle animation initially
    this.characterSprite = new Sprite(this.characterSprites!.down.idle);

    // Set anchor to bottom center (0.5, 1.0) so sprite aligns naturally to ground
    this.characterSprite.anchor.set(0.5, 1.0);

    // Get current stage for character positioning
    const currentStage = this.stageManager.getCurrentStage();
    if (!currentStage) {
      throw new Error("No current stage available for character setup");
    }

    // Position character at stage start position
    // Sprite is now pre-scaled during generation, so no manual scaling needed here
    this.characterSprite.x = currentStage.characterStartPosition.x;
    this.characterSprite.y = currentStage.characterStartPosition.y;

    // Register character sprite with depth manager
    this.depthManager!.registerSprite(
      "character",
      this.characterSprite,
      this.characterSprite.y,
      "character",
    );

    // Initialize character controller
    this.characterController = new CharacterController(
      this.characterSprite,
      this.characterSprites!,
    );

    // Set up depth manager callback for character movement
    this.characterController.setMoveCallback((position: Position) => {
      this.depthManager!.updateSpritePosition("character", position.y);
    });

    // Set up walkable area from current stage
    this.characterController.setWalkableArea(currentStage.walkableArea);

    // Set up interaction points from current stage
    if (currentStage.interactionPoints) {
      this.characterController.setInteractionPoints(
        currentStage.interactionPoints,
      );
    }

    // Set up perspective scaling for current stage
    this.perspectiveScaler.setPerspectiveConfig(currentStage.perspectiveScale);
    this.perspectiveScaler.setBaseScale(1); // Base scale (sprite is already pre-scaled)

    // Connect NPCManager with perspective scaler for automatic NPC scaling
    this.npcManager.setPerspectiveScaler(this.perspectiveScaler);

    // Set up Y-axis movement factor for current stage
    if (currentStage.perspectiveMovement) {
      this.characterController.setYMovementFactor(
        currentStage.perspectiveMovement.yMovementFactor,
      );
    }

    // Create speech bubble (positioned above character)
    this.speechBubble = new SpeechBubble();
    this.app.stage.addChild(this.speechBubble);

    // Create dialogue UI
    this.dialogueUI = new DialogueUI(
      this.config.gameWidth,
      this.config.gameHeight,
    );
    this.dialogueUI.setOnResponseSelected((responseId: string) => {
      this.handleDialogueResponse(responseId);
    });
    this.app.stage.addChild(this.dialogueUI.getContainer());

    console.log(
      "Character sprite, controller, and speech bubble created and added to stage",
    );

    // Initialize dialogue trees
    this.initializeDialogueTrees();
  }

  private initializeDialogueTrees(): void {
    // Jake the Bartender dialogue tree
    const jakeTree: DialogueTree = {
      npcId: "bartender",
      startNodeId: "jake_greeting",
      nodes: {
        jake_greeting: {
          id: "jake_greeting",
          npcText: "What'll it be, stranger? First drink in this joint?",
          responses: [
            {
              id: "ask_about_city",
              text: "Tell me about this city.",
              nextNodeId: "jake_city_info",
            },
            {
              id: "order_drink",
              text: "I'll have whatever's strongest.",
              nextNodeId: "jake_drink_order",
            },
            {
              id: "ask_trouble",
              text: "You look like someone who knows about trouble.",
              nextNodeId: "jake_trouble",
            },
            {
              id: "leave",
              text: "Just looking around, thanks.",
              nextNodeId: "jake_leave_response",
            },
          ],
        },
        jake_city_info: {
          id: "jake_city_info",
          npcText:
            "This city's going to hell, that's for sure. Corpo suits running everything, street gangs fighting for scraps. But the drinks are still cold.",
          responses: [
            {
              id: "ask_corpo",
              text: "What's the deal with these corporate types?",
              nextNodeId: "jake_corpo_info",
            },
            {
              id: "ask_gangs",
              text: "Street gangs sound dangerous.",
              nextNodeId: "jake_gang_info",
            },
            {
              id: "back_to_business",
              text: "Enough small talk. What about that drink?",
              nextNodeId: "jake_drink_order",
            },
          ],
        },
        jake_drink_order: {
          id: "jake_drink_order",
          npcText:
            "Coming right up! That'll be 50 credits. Keep your wits about you out there.",
          responses: [
            {
              id: "pay_drink",
              text: "Here's your credits.",
              nextNodeId: "jake_drink_paid",
              conditions: [{ type: "always" }], // Could check for credits item
            },
            {
              id: "no_money",
              text: "Actually, I'm a bit short on credits.",
              nextNodeId: "jake_no_money",
            },
          ],
        },
        jake_trouble: {
          id: "jake_trouble",
          npcText:
            "Trouble finds everyone in this city eventually. Best to keep your head down and your blaster charged.",
          responses: [
            {
              id: "ask_more_trouble",
              text: "What kind of trouble have you seen?",
              nextNodeId: "jake_city_info",
            },
            {
              id: "thanks_advice",
              text: "Thanks for the advice.",
              nextNodeId: "jake_advice_thanks",
            },
          ],
        },
        jake_corpo_info: {
          id: "jake_corpo_info",
          npcText:
            "Corporate executives think they own the place. Maybe they do. They've got private armies and unlimited credits.",
          responses: [
            {
              id: "ask_resistance",
              text: "Anyone fighting back against them?",
              nextNodeId: "jake_gang_info",
            },
            {
              id: "end_corpo_talk",
              text: "Interesting. I'll keep that in mind.",
              nextNodeId: undefined,
            },
          ],
        },
        jake_gang_info: {
          id: "jake_gang_info",
          npcText:
            "The gangs try to carve out territory, but it's mostly just survival. Real resistance would take more organization than they've got.",
          responses: [
            {
              id: "ask_join",
              text: "Maybe someone could organize them?",
              nextNodeId: "jake_organize_response",
            },
            {
              id: "end_gang_talk",
              text: "Sounds rough out there.",
              nextNodeId: undefined,
            },
          ],
        },
        jake_organize_response: {
          id: "jake_organize_response",
          npcText:
            "Hah! You got that kind of death wish? More power to you, kid. Just remember where to get a good drink when you need one.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
        jake_no_money: {
          id: "jake_no_money",
          npcText:
            "No credits, no service. That's the way it works. Come back when you've got something to trade.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
        jake_leave_response: {
          id: "jake_leave_response",
          npcText: "Suit yourself. Come back when you need a real drink.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
        jake_drink_paid: {
          id: "jake_drink_paid",
          npcText: "Pleasure doing business. Watch your back out there.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
        jake_advice_thanks: {
          id: "jake_advice_thanks",
          npcText: "Don't mention it. Stay safe out there, friend.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
      },
    };

    // Maya (Street Vendor) dialogue tree
    const mayaTree: DialogueTree = {
      npcId: "street-vendor",
      startNodeId: "maya_greeting",
      nodes: {
        maya_greeting: {
          id: "maya_greeting",
          npcText:
            "Got some rare tech here, if you're buying. Don't trust the corpo suits - they'll sell you overpriced junk.",
          responses: [
            {
              id: "browse_tech",
              text: "What kind of tech are you selling?",
              nextNodeId: "maya_tech_catalog",
            },
            {
              id: "ask_corpo",
              text: "Why shouldn't I trust the corporations?",
              nextNodeId: "maya_corpo_warning",
            },
            {
              id: "ask_about_key",
              text: "Is this your key I found on the ground over there?",
              nextNodeId: "maya_key_response",
              conditions: [{ type: "inventory", key: "golden-key" }],
            },
            {
              id: "not_buying",
              text: "Just browsing, thanks.",
              nextNodeId: "maya_browsing_response",
            },
          ],
        },
        maya_tech_catalog: {
          id: "maya_tech_catalog",
          npcText:
            "I've got data chips with real information, not the filtered corpo propaganda. Also some modified comm devices and scanner jammers.",
          responses: [
            {
              id: "buy_data_chip",
              text: "I'll take a data chip.",
              nextNodeId: "maya_sell_chip",
              conditions: [{ type: "always" }], // Could check for credits
            },
            {
              id: "ask_jammers",
              text: "Tell me about those scanner jammers.",
              nextNodeId: "maya_jammer_info",
            },
            {
              id: "just_looking",
              text: "Let me think about it.",
              nextNodeId: undefined,
            },
          ],
        },
        maya_corpo_warning: {
          id: "maya_corpo_warning",
          npcText:
            "Corporations want to control information flow. They sell you 'smart' devices that spy on you, then charge you for the privilege.",
          responses: [
            {
              id: "agree_corpo_bad",
              text: "You're right to be suspicious.",
              nextNodeId: "maya_alliance",
            },
            {
              id: "defend_corpo",
              text: "Some corporate tech is pretty useful though.",
              nextNodeId: "maya_disagreement",
            },
            {
              id: "neutral_response",
              text: "I try to stay out of politics.",
              nextNodeId: "maya_tech_catalog",
            },
          ],
        },
        maya_sell_chip: {
          id: "maya_sell_chip",
          npcText:
            "Smart choice. This chip has real street intel - not the sanitized news feeds. That'll be 100 credits.",
          responses: [
            {
              id: "pay_chip",
              text: "Here's your payment.",
              nextNodeId: undefined,
              addItem: "data_chip_maya",
            },
            {
              id: "too_expensive",
              text: "That's pretty steep.",
              nextNodeId: "maya_negotiate",
            },
          ],
        },
        maya_alliance: {
          id: "maya_alliance",
          npcText:
            "Finally, someone who gets it! Stick around the underground scene and you'll learn the real truth about this city.",
          responses: [
            {
              id: "want_to_help",
              text: "Maybe I can help with something.",
              nextNodeId: "maya_potential_job",
            },
            {
              id: "just_surviving",
              text: "I'm just trying to survive like everyone else.",
              nextNodeId: undefined,
            },
          ],
        },
        maya_potential_job: {
          id: "maya_potential_job",
          npcText:
            "Keep your ears open. Word gets around about people who might be interested in... freelance work. Check back with me later.",
          responses: [
            {
              id: "will_do",
              text: "I'll remember that.",
              nextNodeId: "maya_trust_response",
              setFlag: { key: "maya_trusts_player", value: true },
            },
          ],
        },
        maya_browsing_response: {
          id: "maya_browsing_response",
          npcText:
            "No problem. Come back if you change your mind about that tech.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
        maya_trust_response: {
          id: "maya_trust_response",
          npcText: "Good. I'll be in touch when something comes up.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
        maya_key_response: {
          id: "maya_key_response",
          npcText:
            "Wait... that's mine! I dropped it when I was setting up this morning. Thanks for finding it - you're honest. I could use someone like you for special jobs.",
          responses: [
            {
              id: "accept_trust",
              text: "What kind of special jobs?",
              nextNodeId: "maya_special_work",
            },
            {
              id: "just_returning_key",
              text: "Just glad I could help.",
              nextNodeId: "maya_key_thanks",
            },
          ],
        },
        maya_special_work: {
          id: "maya_special_work",
          npcText:
            "Data retrieval, corporate espionage... nothing too dangerous for someone with the right skills. Keep your ears open.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
        maya_key_thanks: {
          id: "maya_key_thanks",
          npcText: "Honesty's rare in this city. I'll remember this favor.",
          responses: [], // No responses - dialogue ends after NPC speaks
        },
      },
    };

    // Register the dialogue trees
    this.dialogueManager.registerDialogueTree(jakeTree);
    this.dialogueManager.registerDialogueTree(mayaTree);

    console.log("Dialogue trees initialized for Jake and Maya");
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

    // Check if dialogue is active and handle dialogue UI clicks
    if (this.dialogueManager.isDialogueActive()) {
      if (
        this.dialogueUI &&
        this.dialogueUI.handleClick(position.x, position.y)
      ) {
        return; // Dialogue UI handled the click
      }
      // Ignore other clicks during dialogue
      return;
    }

    // Check if click hit an NPC first (NPCs have priority over objects)
    const clickedNPC = this.npcManager.getNPCAtPosition(position.x, position.y);

    // Check if click hit an interactive object
    const clickedObject = this.objectManager.getObjectAtPosition(
      position.x,
      position.y,
    );

    if (clickedNPC && this.characterController) {
      // Handle NPC interaction
      this.handleNPCClick(clickedNPC);
    } else if (clickedObject && this.characterController) {
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

      let actionToExecute = this.gameState.currentAction;

      // SCUMM behavior: left-click on different object while locked defaults to Walk
      if (this.pendingAction && this.actionBar?.isInteractionLocked()) {
        console.log(
          "Left-click on different object while locked: cancelling pending action and defaulting to Walk",
        );
        this.pendingAction = undefined;
        actionToExecute = "walk";

        // Revert action bar and game state to walk
        if (this.actionBar) {
          this.actionBar.unlockFromInteraction();
          this.actionBar.revertColor();
        }
        this.revertToWalkAction();
      }

      console.log(
        `Clicked on object: ${clickedObject.name} with action: ${actionToExecute}`,
      );

      // Move character to interaction point near the object for all actions
      const success = this.characterController.moveToObject(clickedObject);

      if (success) {
        console.log(`Moving to ${actionToExecute} with: ${clickedObject.name}`);

        // Flash action bar pink when object is clicked
        if (this.actionBar) {
          // SCUMM behavior: unlock any previous interaction before starting new one
          this.actionBar.unlockFromInteraction();
          this.actionBar.flashPink();
          // SCUMM behavior: lock action bar during interaction (no hover updates)
          this.actionBar.lockForInteraction();
        }

        // Store the pending action to execute when movement completes
        this.setPendingAction(actionToExecute as ActionType, clickedObject);
      } else {
        console.log(`Cannot reach object: ${clickedObject.name}`);
      }
    } else if (this.characterController) {
      // Left-click on empty area: cancel any pending action and walk there
      if (this.pendingAction) {
        console.log(
          "Cancelling pending action due to left-click on empty area",
        );
        this.pendingAction = undefined;

        // SCUMM behavior: unlock and revert action bar when cancelling
        if (this.actionBar) {
          this.actionBar.unlockFromInteraction();
          this.actionBar.revertColor();
        }

        // Revert to walk action
        this.revertToWalkAction();
      }

      // Now execute the walk action
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
    // Disable right-click default actions during dialogue
    if (this.dialogueManager.isDialogueActive()) {
      return;
    }

    console.log(
      `Canvas right-clicked at game coordinates: (${position.x}, ${position.y})`,
    );

    // Check if right-click hit an NPC first
    const clickedNPC = this.npcManager.getNPCAtPosition(position.x, position.y);

    // Check if right-click hit an interactive object
    const clickedObject = this.objectManager.getObjectAtPosition(
      position.x,
      position.y,
    );

    if (clickedNPC && this.characterController) {
      console.log(
        `Right-clicked on NPC: ${clickedNPC.getName()} with default action: ${clickedNPC.getDefaultAction()}`,
      );

      // Execute the default action on NPC
      this.executeDefaultNPCAction(
        clickedNPC.getDefaultAction() as ActionType,
        clickedNPC,
      );
    } else if (clickedObject && this.characterController) {
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

    // Handle dialogue UI input first
    if (this.dialogueUI && this.dialogueUI.handleKeyInput(key)) {
      return; // Dialogue UI consumed the input
    }

    // NPC movement testing commands
    if (key === "n") {
      // Move random NPC to random position
      const success = this.npcManager.moveRandomNPC();
      if (success) {
        console.log("Random NPC movement started");
      } else {
        console.log("No NPCs available for movement");
      }
      return;
    }

    if (key === "m") {
      // Move Maya (street vendor) to a specific position
      const success = this.npcManager.moveNPCTo("street-vendor", 500, 650);
      if (success) {
        console.log("Maya is moving to (500, 650)");
      } else {
        console.log("Could not move Maya");
      }
      return;
    }

    if (key === "b") {
      // Move Jake the Bartender
      const success = this.npcManager.moveNPCTo("bartender", 600, 680);
      if (success) {
        console.log("Jake is moving to (600, 680)");
      } else {
        console.log("Could not move Jake");
      }
      return;
    }

    // Removed number key shortcuts (1, 2) as they conflict with dialogue response selection

    if (key === "d") {
      // Debug: Show all dialogue flags
      const flags = this.dialogueManager.getAllFlags();
      console.log("Current dialogue flags:", flags);
      return;
    }

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
    // Disable hover actions and action bar changes during dialogue
    if (this.dialogueManager.isDialogueActive()) {
      return;
    }

    // Don't handle canvas hover for UI area (inventory/command panel area)
    // UI area starts at gameAreaWidth + 10
    const uiAreaStartX = this.gameAreaWidth + 10;
    if (position.x >= uiAreaStartX) {
      return; // Let inventory/command panel handle their own hover events
    }

    // Check for NPCs first (they have priority over objects for hover)
    const hoveredNPC = this.npcManager.getNPCAtPosition(position.x, position.y);

    // Update object hover states and highlighting (only if no NPC is hovered)
    const hoveredObject = hoveredNPC
      ? undefined
      : this.objectManager.updateHover(position);

    // Update cursor based on what's under the mouse
    if (this.inputManager) {
      if (hoveredNPC || hoveredObject) {
        this.inputManager.setCursor("pointer");
      } else {
        this.inputManager.setCursor("crosshair");
      }
    }

    // Update action bar text and highlight default actions
    if (this.actionBar && this.commandPanel) {
      if (hoveredNPC) {
        // Handle NPC hover
        this.commandPanel.setDefaultActionHighlight(
          hoveredNPC.getDefaultAction() as ActionType,
        );

        // If we have a selected inventory item, append the NPC name to "Use X with"
        if (this.selectedInventoryItem) {
          this.actionBar.updateText(
            `Use ${this.selectedInventoryItem.name.toLowerCase()} with ${hoveredNPC.getName().toLowerCase()}`,
          );
        } else {
          this.actionBar.showObjectHover(hoveredNPC.getName());
        }
      } else if (hoveredObject) {
        // Handle object hover
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
        // Clear default action highlighting when not hovering any object or NPC
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
    // Disable hover exit actions during dialogue
    if (this.dialogueManager.isDialogueActive()) {
      return;
    }

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

  private handleNPCClick(npc: NPC): void {
    const currentAction = this.gameState.currentAction;
    console.log(
      `Clicked on NPC: ${npc.getName()} with action: ${currentAction}`,
    );

    // Move character to NPC's interaction point
    const interactionPoint = npc.getInteractionPoint();

    const success = this.characterController?.moveTo(
      interactionPoint.x,
      interactionPoint.y,
    );

    if (success) {
      console.log(`Moving to interact with NPC: ${npc.getName()}`);

      // Flash action bar pink when NPC is clicked
      if (this.actionBar) {
        this.actionBar.flashPink();
      }

      // Store the pending NPC interaction to execute when movement completes
      this.setPendingNPCAction(npc, currentAction);
    } else {
      console.log(`Cannot reach NPC: ${npc.getName()}`);
    }
  }

  private async executePendingNPCAction(): Promise<void> {
    if (!this.pendingNPCAction) return;

    const { action, npc } = this.pendingNPCAction;
    console.log(`Executing pending NPC action: ${action} on ${npc.getName()}`);

    // Revert action bar color when we arrive at the NPC
    if (this.actionBar) {
      this.actionBar.revertColor();
    }

    // Execute the NPC interaction
    this.handleNPCInteraction(npc, action);

    // Clear the pending NPC action
    this.pendingNPCAction = undefined;

    // Revert to walk action after executing the action
    this.revertToWalkAction();
  }

  private handleNPCInteraction(npc: NPC, action: string): void {
    switch (action) {
      case "talk": {
        // Try to start dialogue tree first
        if (this.startDialogueTree(npc)) {
          console.log(`Started dialogue tree with ${npc.getName()}`);
          return;
        }

        // Fallback to simple dialogue system if no tree
        const dialogueResult = this.npcManager.getNPCDialogue(npc.getId());
        if (dialogueResult.dialogue) {
          if (this.speechBubble && dialogueResult.position) {
            this.speechBubble.showSpeech(dialogueResult.dialogue);
            this.speechBubble.positionAboveCharacter(
              dialogueResult.position.x,
              dialogueResult.position.y,
              this.config.gameHeight,
            );
          }

          // Start talking animation
          npc.startTalking();
          setTimeout(() => npc.stopTalking(), 3000);

          console.log(
            `NPC ${npc.getName()} says: "${dialogueResult.dialogue}"`,
          );
        } else {
          // Final fallback
          const fallbackText = `Hello there! I'm ${npc.getName()}.`;
          if (this.speechBubble) {
            const position = npc.getSpeechBubblePosition();
            this.speechBubble.showSpeech(fallbackText);
            this.speechBubble.positionAboveCharacter(
              position.x,
              position.y,
              this.config.gameHeight,
            );
          }
          console.log(`NPC ${npc.getName()} says: "${fallbackText}"`);
        }
        break;
      }

      case "look": {
        const description = npc.getDescription();
        const position = npc.getSpeechBubblePosition();

        if (this.speechBubble) {
          this.speechBubble.showSpeech(description);
          this.speechBubble.positionAboveCharacter(
            position.x,
            position.y,
            this.config.gameHeight,
          );
        }
        console.log(`NPC ${npc.getName()}: ${description}`);
        break;
      }

      case "walk": {
        // Walk actions on NPCs should do nothing (no speech, no error)
        break;
      }

      default: {
        const errorText = `I can't ${action} with ${npc.getName()}.`;
        const errorPosition = npc.getSpeechBubblePosition();

        if (this.speechBubble) {
          this.speechBubble.showSpeech(errorText);
          this.speechBubble.positionAboveCharacter(
            errorPosition.x,
            errorPosition.y,
            this.config.gameHeight,
          );
        }
        console.log(errorText);
        break;
      }
    }
  }

  // Handle dialogue response selection
  private handleDialogueResponse(responseId: string): void {
    if (!this.dialogueManager.isDialogueActive()) {
      return;
    }

    // Hide current response options immediately
    if (this.dialogueUI) {
      this.dialogueUI.hideResponses();
    }

    // Get the selected response text before processing
    const currentNode = this.dialogueManager.getCurrentNode();
    const selectedResponse = currentNode?.responses.find(
      (r) => r.id === responseId,
    );

    if (selectedResponse && this.speechBubble && this.characterSprite) {
      // Show player character saying their selected response (white text)
      this.speechBubble.showSpeech(selectedResponse.text, 1500, 0xffffff); // White text, 1.5 seconds
      this.speechBubble.positionAboveCharacter(
        this.characterSprite.x,
        this.characterSprite.y,
        this.config.gameHeight,
      );

      // Wait for player speech to finish, then process the NPC response
      setTimeout(() => {
        this.processDialogueResponse(responseId);
      }, 1500);
    } else {
      // Fallback if no response found - process immediately
      this.processDialogueResponse(responseId);
    }
  }

  // Process the actual dialogue response after player has spoken
  private processDialogueResponse(responseId: string): void {
    // Get current inventory for condition checking
    const inventoryItems = this.inventorySystem?.getAllItems() || [];
    const inventorySet = new Set(inventoryItems.map((item) => item.id));

    // Process the response
    const nextNode = this.dialogueManager.chooseResponse(
      responseId,
      inventorySet,
    );

    if (nextNode) {
      // Continue dialogue with next node (NPC response)
      this.showDialogueNode(nextNode);
    } else {
      // No next node - end dialogue immediately
      this.endDialogue();
    }
  }

  // Start dialogue tree with an NPC
  private startDialogueTree(npc: NPC): boolean {
    const npcPosition = npc.getSpeechBubblePosition();
    const dialogueNode = this.dialogueManager.startDialogue(
      npc.getId(),
      npcPosition,
    );

    if (dialogueNode) {
      this.showDialogueNode(dialogueNode);
      return true;
    }

    return false;
  }

  // Show a dialogue node (NPC text + response options)
  private showDialogueNode(node: DialogueNode): void {
    const state = this.dialogueManager.getCurrentState();

    // Disable UI when dialogue starts
    if (this.commandPanel) {
      this.commandPanel.setDisabled(true);
    }
    if (this.inventorySystem) {
      this.inventorySystem.setDisabled(true);
    }
    if (this.actionBar) {
      this.actionBar.setDisabled(true);
    }

    // Calculate display time based on text length
    const displayTime = this.calculateDialogueDisplayTime(node.npcText);

    // Show NPC text in speech bubble with calculated display time (green text)
    if (this.speechBubble && state.npcPosition) {
      this.speechBubble.showSpeech(node.npcText, displayTime, 0x00ff00); // Green text for NPCs
      this.speechBubble.positionAboveCharacter(
        state.npcPosition.x,
        state.npcPosition.y,
        this.config.gameHeight,
      );
    }

    // Start NPC talking animation
    if (state.npcId) {
      const npc = this.npcManager.getNPCForDialogue(state.npcId);
      if (npc) {
        npc.startTalking();
      }
    }

    console.log(`Showing dialogue: "${node.npcText}" for ${displayTime}ms`);

    // Show response options after delay, or end dialogue if no responses
    setTimeout(() => {
      // Get current inventory for condition checking
      const inventoryItems = this.inventorySystem?.getAllItems() || [];
      const inventorySet = new Set(inventoryItems.map((item) => item.id));
      const availableResponses =
        this.dialogueManager.getAvailableResponses(inventorySet);

      if (availableResponses.length === 0) {
        // No responses available - this is a final dialogue node, end the dialogue
        this.endDialogue();
        return;
      }

      if (this.dialogueUI && this.dialogueManager.isDialogueActive()) {
        // Hide speech bubble and show response options simultaneously
        if (this.speechBubble) {
          this.speechBubble.hideSpeech();
        }
        this.dialogueUI.showResponses(availableResponses);
        console.log(`Showing ${availableResponses.length} response options`);
      }

      // Stop NPC talking animation
      if (state.npcId) {
        const npc = this.npcManager.getNPCForDialogue(state.npcId);
        if (npc) {
          npc.stopTalking();
        }
      }
    }, displayTime);
  }

  // Calculate dialogue display time based on text length
  private calculateDialogueDisplayTime(text: string): number {
    // Base time of 0.8 seconds, plus 40ms per character (20% faster than before)
    const baseTime = 800;
    const timePerChar = 40;
    const calculatedTime = baseTime + text.length * timePerChar;

    // Minimum 1.6 seconds, maximum 6.4 seconds (20% faster than before)
    return Math.max(1600, Math.min(6400, calculatedTime));
  }

  // End dialogue and restore normal game state
  private endDialogue(): void {
    // Re-enable UI when dialogue ends
    if (this.commandPanel) {
      this.commandPanel.setDisabled(false);
    }
    if (this.inventorySystem) {
      this.inventorySystem.setDisabled(false);
    }
    if (this.actionBar) {
      this.actionBar.setDisabled(false);
    }

    // Hide dialogue UI
    if (this.dialogueUI) {
      this.dialogueUI.hide();
    }

    // Hide speech bubble
    if (this.speechBubble) {
      this.speechBubble.hideSpeech();
    }

    // Stop NPC talking animation
    const state = this.dialogueManager.getCurrentState();
    if (state.npcId) {
      const npc = this.npcManager.getNPCForDialogue(state.npcId);
      if (npc) {
        npc.stopTalking();
      }
    }

    // End dialogue in manager
    this.dialogueManager.endDialogue();

    console.log("Dialogue ended, game controls restored");
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
        this.stageManager.removeKeySprite();

        // Remove interactive object from object manager
        this.objectManager.removeObject("golden-key");

        // Mark object as permanently removed from current stage
        const currentStage = this.stageManager.getCurrentStage();
        if (currentStage) {
          this.stageManager.markObjectAsRemoved(currentStage.id, "golden-key");
        }

        console.log("Golden key picked up and added to inventory");
      } else {
        console.log("Cannot pick up key - inventory is full");
      }
    } else {
      console.log(`Cannot get ${object.name} - not a pickupable item`);
    }
  }

  private async handleStageTransition(
    transition: StageTransition,
  ): Promise<void> {
    if (!this.characterController || !this.characterSprite) {
      console.error(
        "Cannot perform stage transition - character not initialized",
      );
      return;
    }

    console.log(`Transitioning to stage: ${transition.toStageId}`);

    // Perform the stage transition
    const result = await this.stageManager.transitionToStage(
      transition.toStageId,
      this.gameWorldContainer!,
      transition.targetPosition,
    );

    if (!result.success || !result.stage || !result.characterPosition) {
      console.error("Stage transition failed");
      return;
    }

    // Update character position and notify depth manager
    this.characterSprite.x = result.characterPosition.x;
    this.characterSprite.y = result.characterPosition.y;

    // Update depth manager with new character position
    if (this.depthManager) {
      this.depthManager.updateSpritePosition(
        "character",
        result.characterPosition.y,
      );
      this.depthManager.forceSortSprites();
      console.log(
        `Updated character position in depth manager: Y=${result.characterPosition.y}`,
      );
    }

    // Update character controller with new stage's walkable area
    this.characterController.setWalkableArea(result.stage.walkableArea);

    // Update interaction points for the new stage
    if (result.stage.interactionPoints) {
      this.characterController.setInteractionPoints(
        result.stage.interactionPoints,
      );
    }

    // Update perspective scaling for the new stage
    this.perspectiveScaler.setPerspectiveConfig(result.stage.perspectiveScale);

    // Update Y-axis movement factor for the new stage
    if (result.stage.perspectiveMovement) {
      this.characterController.setYMovementFactor(
        result.stage.perspectiveMovement.yMovementFactor,
      );
    }

    // Ensure NPC container is still properly attached and visible
    const npcContainer = this.npcManager.getContainer();
    if (!npcContainer.parent) {
      console.log("Re-adding orphaned NPC container to stage");
      this.app.stage.addChild(npcContainer);
    }

    // Force NPC container to render above background and objects after stage transition
    if (npcContainer.parent) {
      const parent = npcContainer.parent;
      const topIndex = parent.children.length - 1;
      parent.setChildIndex(npcContainer, topIndex);
      console.log(
        `Moved NPC container to top of render order (index ${topIndex})`,
      );
    }

    console.log(
      `After stage transition - NPC container: parent=${npcContainer.parent?.constructor.name}, children=${npcContainer.children.length}, visible=${npcContainer.visible}`,
    );

    // Debug stage hierarchy after transition
    console.log(
      `Stage children after transition: ${this.app.stage.children.length}`,
    );
    this.app.stage.children.forEach((child, index) => {
      console.log(
        `  ${index}: ${child.constructor.name} (visible: ${child.visible}, children: ${child.children?.length || 0})`,
      );
    });

    console.log(`Stage transition completed to: ${result.stage.name}`);
    console.log(
      `Character positioned at: (${result.characterPosition.x}, ${result.characterPosition.y})`,
    );
    console.log(
      `Character sprite visible: ${this.characterSprite.visible}, alpha: ${this.characterSprite.alpha}`,
    );

    // Revert to walk action after transition
    this.revertToWalkAction();
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

  private setPendingNPCAction(npc: NPC, action: ActionType): void {
    this.pendingNPCAction = { action, npc };
    console.log(`Set pending NPC action: ${action} on ${npc.getName()}`);
  }

  private async executePendingAction(): Promise<void> {
    if (!this.pendingAction) return;

    const { action, object } = this.pendingAction;
    console.log(`Executing pending action: ${action} on ${object.name}`);

    // Revert action bar color when we arrive at the object (before executing the action)
    if (this.actionBar) {
      this.actionBar.revertColor();
    }

    // Check for stage transitions first (for walk actions only)
    const currentStage = this.stageManager.getCurrentStage();
    if (currentStage && action === "walk") {
      const transition = this.stageManager.findTransition(
        currentStage.id,
        object.id,
      );
      if (transition) {
        // For building-entrance, only allow walk transition if door is open
        if (object.id === "building-entrance") {
          const overlayManager = this.stageManager.getStageOverlayManager();
          const doorOverlay = overlayManager.getOverlayByObjectAndAction(
            object.id,
            "open",
          );
          if (!doorOverlay || !doorOverlay.isVisible()) {
            // Door is closed, show appropriate message
            if (this.speechBubble && this.characterSprite) {
              this.speechBubble.showSpeech(
                "The door is closed. I need to open it first.",
              );
              this.speechBubble.positionAboveCharacter(
                this.characterSprite.x,
                this.characterSprite.y,
                this.config.gameHeight,
              );
            }
            this.pendingAction = undefined;
            // SCUMM behavior: unlock action bar when interaction completes
            if (this.actionBar) {
              this.actionBar.unlockFromInteraction();
            }
            this.revertToWalkAction();
            return;
          }
        }

        console.log(
          `Found stage transition from ${currentStage.id} to ${transition.toStageId}`,
        );
        await this.handleStageTransition(transition);
        // Clear the pending action and return - no need for other responses
        this.pendingAction = undefined;
        // SCUMM behavior: unlock action bar when interaction completes
        if (this.actionBar) {
          this.actionBar.unlockFromInteraction();
        }
        return;
      }
    }

    // Get the appropriate response for this object-action combination
    const response = this.actionResponseSystem.getResponse(object.id, action);

    if (response) {
      // Show response text in speech bubble above character (only if text is not empty)
      if (this.speechBubble && this.characterSprite && response.text.trim()) {
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

      // Handle stage overlay triggers
      if (action === "open" && object.id === "building-entrance") {
        // Trigger the building entrance door overlay
        this.stageManager.triggerOverlay(object.id, action);
      }

      console.log(`${action.toUpperCase()}: ${response.text}`);
    } else {
      // Special case: walk actions with no response should do nothing
      if (action === "walk") {
        // Do nothing for walk actions without specific responses
        console.log(`Walk action on ${object.name} - no response needed`);
      } else {
        // Fallback for other unknown object-action combinations
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
    }

    // Clear the pending action
    this.pendingAction = undefined;

    // SCUMM behavior: unlock action bar when interaction completes
    if (this.actionBar) {
      this.actionBar.unlockFromInteraction();
    }

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

    // Update NPCs
    this.npcManager.update(currentTime);

    // SCUMM-style depth sorting: only when needed, not every frame
    if (this.depthManager) {
      this.depthManager.sortSpritesIfNeeded();
    }

    // Update character perspective scaling based on Y position
    if (this.characterSprite) {
      this.perspectiveScaler.updateSpriteScale(this.characterSprite);
    }

    // Update depth sorting if needed
    if (this.depthManager) {
      this.depthManager.sortSprites();
    }

    // Check if movement just completed and we have a pending action
    if (this.wasCharacterMoving && !isCurrentlyMoving && this.pendingAction) {
      // Execute pending action asynchronously but don't await to avoid blocking game loop
      this.executePendingAction().catch(console.error);
    }

    // Check if movement just completed and we have a pending item-object action
    if (
      this.wasCharacterMoving &&
      !isCurrentlyMoving &&
      this.pendingItemObjectAction
    ) {
      this.executePendingItemObjectAction();
    }

    // Check if movement just completed and we have a pending NPC action
    if (
      this.wasCharacterMoving &&
      !isCurrentlyMoving &&
      this.pendingNPCAction
    ) {
      this.executePendingNPCAction().catch(console.error);
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

    // SCUMM behavior: right-click interruption cancels pending action
    if (this.pendingAction) {
      console.log("Right-click interruption: cancelling pending action");
      this.pendingAction = undefined;
    }

    // Update action bar to show the default action with object name
    // Force update even if locked (right-click interruption)
    if (this.actionBar) {
      this.actionBar.unlockFromInteraction(); // Temporarily unlock
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
        // SCUMM behavior: unlock any previous interaction before starting new one
        this.actionBar.unlockFromInteraction();
        this.actionBar.flashPink();
        // SCUMM behavior: lock action bar during interaction (no hover updates)
        this.actionBar.lockForInteraction();
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

  private executeDefaultNPCAction(action: ActionType, npc: NPC): void {
    // Temporarily set the game state to the default action
    const previousAction = this.gameState.currentAction;
    this.gameState.currentAction = action;

    // SCUMM behavior: right-click interruption cancels pending action
    if (this.pendingAction) {
      console.log("Right-click NPC interruption: cancelling pending action");
      this.pendingAction = undefined;
    }

    // Update action bar to show the default action with NPC name
    // Force update even if locked (right-click interruption)
    if (this.actionBar) {
      this.actionBar.unlockFromInteraction(); // Temporarily unlock
      this.actionBar.showObjectHoverWithAction(npc.getName(), action);
    }

    // Move character to NPC interaction point and execute the default action
    const interactionPoint = npc.getInteractionPoint();
    const success = this.characterController?.moveTo(
      interactionPoint.x,
      interactionPoint.y,
    );

    if (success) {
      console.log(
        `Moving to execute default action: ${action} on ${npc.getName()}`,
      );

      // Flash action bar pink when NPC is clicked
      if (this.actionBar) {
        this.actionBar.flashPink();
      }

      // Store the pending action to execute when movement completes
      this.setPendingNPCAction(npc, action);
    } else {
      console.log(`Cannot reach NPC: ${npc.getName()}`);
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

  getPerspectiveScaler(): PerspectiveScaler {
    return this.perspectiveScaler;
  }

  getNPCManager(): NPCManager {
    return this.npcManager;
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
