import { Sprite, Container } from "pixi.js";
import { Stage, StageTransition } from "./Stage";
import { AssetManager } from "./AssetManager";
import { ObjectManager } from "./ObjectManager";
import { KeySprite } from "./KeySprite";

export class StageManager {
  private stages: Map<string, Stage> = new Map();
  private transitions: StageTransition[] = [];
  private currentStage?: Stage;
  private backgroundSprite?: Sprite;
  private keySprite?: KeySprite;
  private stageContainer: Container;
  private assetManager: AssetManager;
  private objectManager: ObjectManager;
  constructor(
    assetManager: AssetManager,
    objectManager: ObjectManager,
    gameAreaWidth: number = 1024,
  ) {
    this.assetManager = assetManager;
    this.objectManager = objectManager;
    this.stageContainer = new Container();
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
            { x: 58, y: 421 }, // 381 + 40
            { x: 125, y: 433 }, // 393 + 40
            { x: 123, y: 634 }, // 594 + 40
            { x: 62, y: 650 }, // 610 + 40
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
      characterStartPosition: { x: 400, y: 690 },
      keyPosition: { x: 500, y: 640 },
    };

    this.addStage(cyberpunkStage);

    console.log(`Initialized ${this.stages.size} stages`);
  }

  addStage(stage: Stage): void {
    this.stages.set(stage.id, stage);
  }

  addTransition(transition: StageTransition): void {
    this.transitions.push(transition);
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

    this.currentStage = stage;
    console.log(`Stage loaded successfully: ${stage.name}`);
    return true;
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

    // Add background to stage container and stage container to parent
    this.stageContainer.addChild(this.backgroundSprite);
    parentContainer.addChild(this.stageContainer);

    return true;
  }

  private loadObjects(stage: Stage): void {
    // Clear existing objects
    const existingObjects = this.objectManager.getAllObjects();
    for (const obj of existingObjects) {
      this.objectManager.removeObject(obj.id);
    }

    // Add stage objects
    for (const objectData of stage.objects) {
      this.objectManager.addObject(objectData);
    }

    console.log(
      `Loaded ${stage.objects.length} objects for stage: ${stage.name}`,
    );
  }

  private loadKeySprite(stage: Stage, parentContainer: Container): void {
    if (!stage.keyPosition) return;

    this.keySprite = new KeySprite();
    this.keySprite.x = stage.keyPosition.x;
    this.keySprite.y = stage.keyPosition.y;
    parentContainer.addChild(this.keySprite);
  }

  private cleanupCurrentStage(): void {
    // Remove background sprite
    if (this.backgroundSprite) {
      this.stageContainer.removeChild(this.backgroundSprite);
      this.backgroundSprite.destroy();
      this.backgroundSprite = undefined;
    }

    // Remove key sprite
    if (this.keySprite) {
      // Key sprite is added directly to parent container, not stage container
      this.keySprite.destroy();
      this.keySprite = undefined;
    }

    // Clear stage container
    this.stageContainer.removeChildren();
  }

  getStageContainer(): Container {
    return this.stageContainer;
  }

  getBackgroundSprite(): Sprite | undefined {
    return this.backgroundSprite;
  }

  getKeySprite(): KeySprite | undefined {
    return this.keySprite;
  }

  // Method to remove key sprite (for pickup functionality)
  removeKeySprite(parentContainer: Container): void {
    if (this.keySprite) {
      parentContainer.removeChild(this.keySprite);
      this.keySprite.destroy();
      this.keySprite = undefined;
    }
  }

  destroy(): void {
    this.cleanupCurrentStage();
    this.stageContainer.destroy();
    this.stages.clear();
    this.transitions.length = 0;
  }
}
