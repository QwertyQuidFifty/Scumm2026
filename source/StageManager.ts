import { Sprite, Container, Renderer } from "pixi.js";
import { Stage, StageTransition } from "./Stage";
import { AssetManager } from "./AssetManager";
import { ObjectManager } from "./ObjectManager";
import { KeySprite } from "./KeySprite";
import { NPCManager } from "./NPCManager";
import { DepthManager } from "./DepthManager";
import { StageOverlayManager } from "./StageOverlay";
import { StageOverlayAssets } from "./StageOverlayAssets";

export class StageManager {
  private stages: Map<string, Stage> = new Map();
  private transitions: StageTransition[] = [];
  private currentStage?: Stage;
  private backgroundSprite?: Sprite;
  private keySprite?: KeySprite;
  private stageContainer: Container;
  private assetManager: AssetManager;
  private objectManager: ObjectManager;
  private npcManager?: NPCManager;
  private depthManager?: DepthManager;
  private stageOverlayManager: StageOverlayManager;
  private renderer?: Renderer;
  // Track objects that have been permanently removed from stages
  private removedObjects: Map<string, Set<string>> = new Map(); // stageId -> Set<objectId>
  constructor(assetManager: AssetManager, objectManager: ObjectManager) {
    this.assetManager = assetManager;
    this.objectManager = objectManager;
    this.stageContainer = new Container();
    this.stageOverlayManager = new StageOverlayManager();
  }

  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
    this.stageOverlayManager.setRenderer(renderer);
  }

  // Initialize the stage system with predefined stages
  initializeStages(): void {
    // Define the current cyberpunk stage
    const cyberpunkStage: Stage = {
      id: "cyberpunk-street",
      name: "Cyberpunk Street",
      backgroundAssetKey: "cyberpunk",
      backgroundWidth: 1024,
      backgroundHeight: 768,
      walkableArea: [
        { x: 0, y: 803 }, // 763 + 40
        { x: 3, y: 692 }, // 652 + 40
        { x: 387, y: 610 }, // 570 + 40
        { x: 568, y: 610 }, // 570 + 40
        { x: 976, y: 707 }, // 667 + 40
        { x: 1024, y: 803 }, // 763 + 40
      ],
      objects: [
        {
          id: "hotel-sign",
          name: "hotel sign",
          position: { x: 20 * (1024 / 320), y: 30 * (768 / 200) },
          width: 60 * (1024 / 320),
          height: 40 * (768 / 200),
          description: "A glowing neon hotel sign",
          defaultAction: "look",
          polygon: [
            { x: 164, y: 57 }, // 17 + 40 (background offset)
            { x: 222, y: 69 }, // 29 + 40
            { x: 226, y: 404 }, // 364 + 40
            { x: 166, y: 394 }, // 354 + 40
          ],
        },
        {
          id: "bar-sign",
          name: "bar sign",
          position: { x: 240 * (1024 / 320), y: 45 * (768 / 200) },
          width: 40 * (1024 / 320),
          height: 25 * (768 / 200),
          description: "A red neon bar sign",
          defaultAction: "look",
          polygon: [
            { x: 655, y: 404 }, // 364 + 40
            { x: 755, y: 356 }, // 316 + 40
            { x: 750, y: 454 }, // 414 + 40
            { x: 658, y: 483 }, // 443 + 40
          ],
        },
        {
          id: "building-entrance",
          name: "building entrance",
          position: { x: 80 * (1024 / 320), y: 80 * (768 / 200) },
          width: 30 * (1024 / 320),
          height: 60 * (768 / 200),
          description: "A dark building entrance",
          defaultAction: "open",
          polygon: [
            { x: 58, y: 450 }, // 381 + 40
            { x: 124, y: 470 }, // 393 + 40
            { x: 124, y: 634 }, // 594 + 40
            { x: 58, y: 650 }, // 610 + 40
          ],
        },
        {
          id: "cryptic-door",
          name: "cryptic door",
          position: { x: 20 * (1024 / 320), y: 30 * (768 / 200) },
          width: 60 * (1024 / 320),
          height: 40 * (768 / 200),
          description: "An ornate door without a handle",
          defaultAction: "open",
          polygon: [
            { x: 870, y: 431 }, // 391 + 40
            { x: 947, y: 415 }, // 375 + 40
            { x: 947, y: 670 }, // 630 + 40
            { x: 870, y: 655 }, // 615 + 40
          ],
        },
        {
          id: "city-in-distance",
          name: "city in distance",
          position: { x: 20 * (1024 / 320), y: 30 * (768 / 200) },
          width: 60 * (1024 / 320),
          height: 40 * (768 / 200),
          description: "The street leads into the depth of the city",
          defaultAction: "walk",
          polygon: [
            { x: 419, y: 464 }, // 424 + 40
            { x: 552, y: 464 }, // 424 + 40
            { x: 552, y: 582 }, // 542 + 40
            { x: 419, y: 582 }, // 542 + 40
          ],
        },
        {
          id: "bar-door",
          name: "bar",
          position: { x: 20 * (1024 / 320), y: 30 * (768 / 200) },
          width: 60 * (1024 / 320),
          height: 40 * (768 / 200),
          description: "The dimly lit entrance to the bar",
          defaultAction: "walk",
          polygon: [
            { x: 720, y: 534 }, // 494 + 40
            { x: 746, y: 536 }, // 496 + 40
            { x: 746, y: 637 }, // 597 + 40
            { x: 720, y: 633 }, // 593 + 40
          ],
        },
        {
          id: "golden-key",
          name: "golden key",
          position: { x: 500, y: 640 },
          width: 48,
          height: 24,
          description:
            "A shiny golden key that might unlock something important",
          defaultAction: "get",
        },
      ],
      npcs: [
        {
          id: "bartender",
          name: "Jake the Bartender",
          position: { x: 756, y: 659 }, // Near the bar area
          description:
            "A gruff bartender with cybernetic implants. He's seen it all.",
          dialogues: [
            "What'll it be?",
            "This city's going to hell.",
            "Keep your credits ready.",
          ],
          defaultAction: "talk",
          spriteType: "bartender",
          facingDirection: "left", // Jake faces left
          interactionPoint: { x: 681, y: 667 }, // Stand in front of bar counter
        },
        {
          id: "street-vendor",
          name: "Maya",
          position: { x: 36, y: 712 }, // On the street
          description:
            "A street vendor selling data chips and tech components.",
          dialogues: [
            "Got some rare tech here.",
            "Don't trust the corpo suits.",
            "Credits first, questions later.",
          ],
          defaultAction: "talk",
          spriteType: "customer",
          facingDirection: "right", // Maya faces right
          interactionPoint: { x: 145, y: 703 }, // Stand in front of vendor on street
        },
      ],
      characterStartPosition: { x: 400, y: 690 },
      keyPosition: { x: 500, y: 640 },
      interactionPoints: new Map([
        ["hotel-sign", { x: 202, y: 657 }], // Near hotel sign, on street (617 + 40)
        ["bar-sign", { x: 689, y: 656 }], // Near bar sign, on street (616 + 40)
        ["building-entrance", { x: 108, y: 686 }], // Near building entrance, on street (646 + 40)
        ["cryptic-door", { x: 896, y: 713 }], // Right side of the street below bar entrance (673 + 40)
        ["city-in-distance", { x: 470, y: 616 }], // City in distance, on street (576 + 40)
      ]),
      perspectiveScale: {
        minY: 600, // At bar door position (background)
        maxY: 713, // At cryptic door position (foreground)
        minScale: 100 / 144, // Scale factor for 100px height at bar door (100 / sprite height 144)
        maxScale: 200 / 144, // Scale factor for 200px height at cryptic door (200 / sprite height 144)
      },
      perspectiveMovement: {
        yMovementFactor: 0.2, // Reduce Y-axis movement by 50% for isometric feel
      },
    };

    this.addStage(cyberpunkStage);

    // Define a test indoor stage (using mechstore background)
    const testIndoorStage: Stage = {
      id: "test-indoor",
      name: "Mech Store",
      backgroundAssetKey: "mechstore",
      backgroundWidth: 1024,
      backgroundHeight: 768,
      walkableArea: [
        // Floor area of the mechstore
        { x: 336, y: 613 },
        { x: 899, y: 613 },
        { x: 899, y: 772 },
        { x: 227, y: 772 },
        { x: 336, y: 613 },
      ],
      objects: [
        {
          id: "exit-door",
          name: "exit door",
          position: { x: 50, y: 400 },
          width: 100,
          height: 150,
          description: "The exit door leading back to the street",
          defaultAction: "open",
          polygon: [
            { x: 856, y: 258 },
            { x: 923, y: 258 },
            { x: 923, y: 638 },
            { x: 856, y: 599 },
          ],
        },
        {
          id: "stool-small",
          name: "small stool",
          position: { x: 500, y: 650 }, // Match overlay position
          width: 64,
          height: 64,
          description: "A small wooden stool",
          defaultAction: "look",
          polygon: [
            { x: 554, y: 595 }, // 500-32, 650-32 (32px margin around center)
            { x: 655, y: 595 }, // 500+32, 650-32
            { x: 652, y: 678 }, // 500+32, 650+32
            { x: 554, y: 678 }, // 500-32, 650+32
          ],
        },
      ],
      characterStartPosition: { x: 863, y: 628 },
      interactionPoints: new Map([
        ["exit-door", { x: 850, y: 620 }], // Near the exit door, within walkable area
        ["stool-small", { x: 500, y: 680 }], // In front of the stool, within walkable area
      ]),
      perspectiveScale: {
        minY: 613, // At back of room
        maxY: 772, // At front of room
        minScale: 140 / 144, // Fixed scale for 140px height (140 / sprite height 144)
        maxScale: 140 / 144, // Same scale throughout - no variation in small room
      },
      perspectiveMovement: {
        yMovementFactor: 1.0, // Normal movement for indoor stage
      },
    };

    this.addStage(testIndoorStage);

    // Add transitions between stages
    this.addTransition({
      fromStageId: "cyberpunk-street",
      toStageId: "test-indoor",
      triggerObjectId: "building-entrance",
      targetPosition: { x: 863, y: 628 }, // Center of indoor room
    });

    this.addTransition({
      fromStageId: "test-indoor",
      toStageId: "cyberpunk-street",
      triggerObjectId: "exit-door",
      targetPosition: { x: 104, y: 675 }, // Near building entrance on street
    });

    console.log(
      `Initialized ${this.stages.size} stages and ${this.transitions.length} transitions`,
    );
  }

  setNPCManager(npcManager: NPCManager): void {
    this.npcManager = npcManager;
  }

  setDepthManager(depthManager: DepthManager): void {
    this.depthManager = depthManager;
  }

  addStage(stage: Stage): void {
    this.stages.set(stage.id, stage);
  }

  addTransition(transition: StageTransition): void {
    this.transitions.push(transition);
  }

  findTransition(
    fromStageId: string,
    triggerObjectId: string,
  ): StageTransition | undefined {
    return this.transitions.find(
      (t) =>
        t.fromStageId === fromStageId && t.triggerObjectId === triggerObjectId,
    );
  }

  async transitionToStage(
    toStageId: string,
    parentContainer: Container,
    targetPosition?: { x: number; y: number },
  ): Promise<{
    success: boolean;
    stage?: Stage;
    characterPosition?: { x: number; y: number };
  }> {
    const targetStage = this.stages.get(toStageId);
    if (!targetStage) {
      console.error(`Target stage not found: ${toStageId}`);
      return { success: false };
    }

    console.log(
      `Transitioning from ${this.currentStage?.name || "unknown"} to ${targetStage.name}`,
    );
    console.log(
      `Target stage has ${targetStage.npcs?.length || 0} NPCs defined`,
    );

    // Load the new stage
    const success = await this.loadStage(toStageId, parentContainer);
    if (!success) {
      return { success: false };
    }

    console.log(`Stage transition completed, checking NPC container...`);
    if (this.npcManager) {
      const container = this.npcManager.getContainer();
      console.log(
        `NPC container after transition: ${container.children.length} children, visible: ${container.visible}`,
      );
    }

    // Determine character position in new stage
    const characterPosition =
      targetPosition || targetStage.characterStartPosition;

    return {
      success: true,
      stage: targetStage,
      characterPosition,
    };
  }

  getCurrentStage(): Stage | undefined {
    return this.currentStage;
  }

  getStage(stageId: string): Stage | undefined {
    return this.stages.get(stageId);
  }

  async loadStage(
    stageId: string,
    parentContainer: Container,
  ): Promise<boolean> {
    const stage = this.stages.get(stageId);
    if (!stage) {
      console.error(`Stage not found: ${stageId}`);
      return false;
    }

    // Clean up current stage if exists
    this.cleanupCurrentStage();

    console.log(`Loading stage: ${stage.name}`);

    // Load background
    const success = await this.loadBackground(stage, parentContainer);
    if (!success) {
      return false;
    }

    // Load objects
    this.loadObjects(stage);

    // Load key sprite if defined
    if (stage.keyPosition) {
      this.loadKeySprite(stage, parentContainer);
    }

    // Load NPCs if defined
    console.log(`About to load NPCs for stage: ${stage.name}`);
    if (stage.npcs && this.npcManager) {
      this.loadNPCs(stage);

      // Debug NPC container after loading
      const npcContainer = this.npcManager.getContainer();
      console.log(
        `After loading NPCs: container has ${npcContainer.children.length} children`,
      );
      console.log(
        `NPC container parent: ${npcContainer.parent?.constructor.name || "none"}`,
      );
    } else {
      console.log(
        `Skipping NPC loading: stage.npcs=${!!stage.npcs}, this.npcManager=${!!this.npcManager}`,
      );
    }

    // Load stage overlays
    if (this.renderer) {
      await this.loadStageOverlays(stage, parentContainer);
    }

    this.currentStage = stage;
    console.log(`Stage loaded successfully: ${stage.name}`);
    return true;
  }

  private async loadStageOverlays(
    stage: Stage,
    parentContainer: Container,
  ): Promise<void> {
    // Get all overlay assets for this stage
    const overlayAssets = StageOverlayAssets.getStageOverlayAssets(stage.id);

    if (overlayAssets.length > 0) {
      for (const assetDef of overlayAssets) {
        let texture;

        if (assetDef.assetType === "polygon" && assetDef.polygon) {
          // Create texture from polygon data
          texture = StageOverlayAssets.createPolygonTexture(
            this.renderer!,
            assetDef.polygon,
            assetDef.fillColor,
            assetDef.innerFillColor,
          );
        } else if (assetDef.assetType === "png" && assetDef.pngPath) {
          // Load PNG asset
          try {
            texture = await this.assetManager.loadAsset(
              assetDef.assetKey,
              assetDef.pngPath,
            );
          } catch (error) {
            console.error(
              `Failed to load PNG overlay asset ${assetDef.id}: ${error}`,
            );
            continue;
          }
        } else {
          console.warn(`Invalid asset definition for overlay: ${assetDef.id}`);
          continue;
        }

        // Add overlay using the asset definition
        const success = this.stageOverlayManager.addOverlay(assetDef, texture);
        if (!success) {
          console.error(`Failed to add overlay: ${assetDef.id}`);
        }
      }

      // Register overlays individually with depth manager based on their z-index type
      if (this.depthManager) {
        // Register each overlay separately with appropriate depth
        const overlayManager = this.stageOverlayManager;
        let backgroundCount = 0;
        let foregroundCount = 0;

        for (const assetDef of overlayAssets) {
          const overlay = overlayManager.getOverlay(assetDef.id);
          if (overlay) {
            let yPosition: number;
            const spriteType: "character" | "npc" | "object" = "object";

            switch (assetDef.zIndexType) {
              case "background":
                yPosition = -500 - backgroundCount; // Behind characters/NPCs
                backgroundCount++;
                break;
              case "inline":
                yPosition = assetDef.position.y; // Same as object position for depth sorting
                break;
              case "foreground":
                yPosition = 10000 + foregroundCount; // In front of everything
                foregroundCount++;
                break;
            }

            this.depthManager.registerSprite(
              `overlay-${assetDef.id}`,
              overlay.getContainer(),
              yPosition,
              spriteType,
            );

            console.log(
              `Registered ${assetDef.zIndexType} overlay ${assetDef.id} at Y position ${yPosition}`,
            );
          }
        }

        console.log(
          `Registered ${overlayAssets.length} overlays with depth manager`,
        );
      } else {
        // Fallback: add overlay container to stage (only once)
        parentContainer.addChild(this.stageOverlayManager.getContainer());
        console.log(
          "No depth manager available, using fallback overlay rendering",
        );
      }

      console.log(
        `Loaded ${overlayAssets.length} overlays for stage: ${stage.name}`,
      );
    }
  }

  private async loadBackground(
    stage: Stage,
    parentContainer: Container,
  ): Promise<boolean> {
    const backgroundTexture = this.assetManager.getAsset(
      stage.backgroundAssetKey,
    );
    if (!backgroundTexture) {
      console.error(
        `Background texture not found: ${stage.backgroundAssetKey}`,
      );
      return false;
    }

    this.backgroundSprite = new Sprite(backgroundTexture);

    // Scale background to fill game area
    this.backgroundSprite.width = stage.backgroundWidth;
    this.backgroundSprite.height = stage.backgroundHeight;

    // Position below action bar (40px down from top)
    this.backgroundSprite.x = 0;
    this.backgroundSprite.y = 40;

    // Register background with depth manager instead of adding directly to stage container
    console.log(`loadBackground: depthManager exists: ${!!this.depthManager}`);
    if (this.depthManager) {
      this.depthManager.registerSprite(
        "background",
        this.backgroundSprite,
        -1000, // Very low Y position to ensure it's always behind everything
        "object",
      );
      console.log(
        "Registered background sprite with depth manager at Y position -1000",
      );
    } else {
      console.log("No depth manager available, using fallback rendering");
      // Fallback: add background to stage container if no depth manager
      this.stageContainer.addChild(this.backgroundSprite);

      // Only add stage container to parent if it's not already added
      if (!this.stageContainer.parent) {
        parentContainer.addChild(this.stageContainer);
      }
    }

    return true;
  }

  private loadObjects(stage: Stage): void {
    // Clear existing objects
    const existingObjects = this.objectManager.getAllObjects();
    for (const obj of existingObjects) {
      this.objectManager.removeObject(obj.id);
    }

    // Add stage objects, but exclude ones that have been permanently removed
    let loadedCount = 0;
    for (const objectData of stage.objects) {
      if (!this.isObjectRemoved(stage.id, objectData.id)) {
        this.objectManager.addObject(objectData);
        loadedCount++;
      } else {
        console.log(
          `Skipping removed object: ${objectData.id} from stage: ${stage.name}`,
        );
      }
    }

    console.log(
      `Loaded ${loadedCount}/${stage.objects.length} objects for stage: ${stage.name}`,
    );
  }

  private loadKeySprite(stage: Stage, parentContainer: Container): void {
    if (!stage.keyPosition) return;

    // Don't load key sprite if the golden-key object has been removed from this stage
    if (this.isObjectRemoved(stage.id, "golden-key")) {
      console.log(
        `Key sprite not loaded - golden-key has been removed from stage: ${stage.name}`,
      );
      return;
    }

    this.keySprite = new KeySprite();
    this.keySprite.x = stage.keyPosition.x;
    this.keySprite.y = stage.keyPosition.y;

    // Register key sprite with depth manager
    if (this.depthManager) {
      this.depthManager.registerSprite(
        "key-sprite",
        this.keySprite,
        stage.keyPosition.y,
        "object",
      );
      console.log(
        `Registered key sprite with depth manager at Y position ${stage.keyPosition.y}`,
      );
    } else {
      parentContainer.addChild(this.keySprite);
    }
  }

  private loadNPCs(stage: Stage): void {
    console.log(`loadNPCs called for stage: ${stage.name}`);
    console.log(`stage.npcs exists: ${!!stage.npcs}`);
    console.log(`stage.npcs length: ${stage.npcs?.length || 0}`);
    console.log(`this.npcManager exists: ${!!this.npcManager}`);

    if (stage.npcs) {
      console.log(
        "NPCs in stage:",
        stage.npcs.map((npc) => ({
          id: npc.id,
          name: npc.name,
          spriteType: npc.spriteType,
        })),
      );
    }

    if (!stage.npcs || !this.npcManager) {
      console.log(
        `No NPCs to load for stage: ${stage.name} (npcs: ${!!stage.npcs}, npcManager: ${!!this.npcManager})`,
      );
      return;
    }

    console.log(`Loading ${stage.npcs.length} NPCs for stage: ${stage.name}`);

    // Clear existing NPCs from depth manager first
    if (this.depthManager) {
      // Remove all NPC sprites from depth manager
      const existingNPCs = this.npcManager.getAllNPCs();
      for (const npc of existingNPCs) {
        this.depthManager.unregisterSprite(`npc-${npc.getId()}`);
      }
    }

    // Clear existing NPCs
    this.npcManager.clearAllNPCs();

    // Add stage NPCs
    let loadedCount = 0;
    for (const npcData of stage.npcs) {
      console.log(
        `Attempting to add NPC: ${npcData.name} (${npcData.id}) with sprite type: ${npcData.spriteType}`,
      );
      const success = this.npcManager.addNPC(npcData);
      if (success) {
        loadedCount++;
        console.log(`Successfully added NPC: ${npcData.name}`);

        // Register NPC with depth manager
        console.log(
          `loadNPCs: depthManager exists: ${!!this.depthManager} for NPC ${npcData.name}`,
        );
        if (this.depthManager) {
          const npc = this.npcManager.getNPC(npcData.id);
          if (npc) {
            this.depthManager.registerSprite(
              `npc-${npcData.id}`,
              npc.getSprite(),
              npcData.position.y,
              "npc",
            );
            console.log(
              `Registered NPC ${npcData.name} with depth manager at Y position ${npcData.position.y}`,
            );
          } else {
            console.log(
              `Could not get NPC ${npcData.name} from NPCManager for depth registration`,
            );
          }
        } else {
          console.log(`No depth manager available for NPC ${npcData.name}`);
        }
      } else {
        console.error(`Failed to add NPC: ${npcData.name}`);
      }
    }

    console.log(
      `Loaded ${loadedCount}/${stage.npcs.length} NPCs for stage: ${stage.name}`,
    );

    // Set walkable area for all NPCs
    this.npcManager.setWalkableArea(stage.walkableArea);

    // Force depth sort after loading all NPCs
    if (this.depthManager) {
      this.depthManager.forceSortSprites();
    }
  }

  private cleanupCurrentStage(): void {
    // Remove stage container from parent
    if (this.stageContainer.parent) {
      this.stageContainer.parent.removeChild(this.stageContainer);
    }

    // Unregister background from depth manager
    if (this.depthManager && this.backgroundSprite) {
      this.depthManager.unregisterSprite("background");
    }

    // Remove background sprite
    if (this.backgroundSprite) {
      this.backgroundSprite.destroy();
      this.backgroundSprite = undefined;
    }

    // Unregister key sprite from depth manager
    if (this.depthManager && this.keySprite) {
      this.depthManager.unregisterSprite("key-sprite");
    }

    // Remove key sprite from parent container
    if (this.keySprite && this.keySprite.parent) {
      this.keySprite.parent.removeChild(this.keySprite);
      this.keySprite.destroy();
      this.keySprite = undefined;
    }

    // Clear NPCs
    if (this.npcManager) {
      this.npcManager.clearAllNPCs();
    }

    // Unregister individual stage overlays from depth manager
    if (this.depthManager) {
      // Get all current overlays and unregister them
      const currentStage = this.getCurrentStage();
      if (currentStage) {
        const overlayAssets = StageOverlayAssets.getStageOverlayAssets(
          currentStage.id,
        );
        for (const assetDef of overlayAssets) {
          this.depthManager.unregisterSprite(`overlay-${assetDef.id}`);
        }
      }
    }

    // Clear stage overlays
    this.stageOverlayManager.clearAll();

    // Clear stage container
    this.stageContainer.removeChildren();
  }

  getStageContainer(): Container {
    return this.stageContainer;
  }

  // Methods for triggering overlays
  triggerOverlay(objectId: string, action: string): boolean {
    return this.stageOverlayManager.toggleOverlayByAction(objectId, action);
  }

  getStageOverlayManager(): StageOverlayManager {
    return this.stageOverlayManager;
  }

  getBackgroundSprite(): Sprite | undefined {
    return this.backgroundSprite;
  }

  getKeySprite(): KeySprite | undefined {
    return this.keySprite;
  }

  // Method to remove key sprite (for pickup functionality)\n  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeKeySprite(): void {
    if (this.keySprite) {
      // Unregister from depth manager first
      if (this.depthManager) {
        this.depthManager.unregisterSprite("key-sprite");
      }

      // Remove from container if it has a parent
      if (this.keySprite.parent) {
        this.keySprite.parent.removeChild(this.keySprite);
      }

      this.keySprite.destroy();
      this.keySprite = undefined;
    }
  }

  // Track an object as permanently removed from a stage
  markObjectAsRemoved(stageId: string, objectId: string): void {
    if (!this.removedObjects.has(stageId)) {
      this.removedObjects.set(stageId, new Set());
    }
    this.removedObjects.get(stageId)!.add(objectId);
    console.log(`Marked object ${objectId} as removed from stage ${stageId}`);
  }

  // Check if an object has been removed from a stage
  isObjectRemoved(stageId: string, objectId: string): boolean {
    const removedSet = this.removedObjects.get(stageId);
    return removedSet ? removedSet.has(objectId) : false;
  }

  // Get all removed objects for a stage
  getRemovedObjects(stageId: string): string[] {
    const removedSet = this.removedObjects.get(stageId);
    return removedSet ? Array.from(removedSet) : [];
  }

  destroy(): void {
    this.cleanupCurrentStage();
    this.stageContainer.destroy();
    this.stages.clear();
    this.transitions.length = 0;
  }
}
