import { Container, Renderer } from "pixi.js";
import { NPC, NPCData } from "./NPC";
import { CharacterSprites, SpriteGenerator } from "./SpriteGenerator";
import { Position } from "./types";
import { DepthManager } from "./DepthManager";
import { PerspectiveScaler } from "./PerspectiveScaler";

export class NPCManager {
  private npcs: Map<string, NPC> = new Map();
  private npcContainer: Container;
  private spriteCache: Map<string, CharacterSprites> = new Map();
  private spriteGenerator?: SpriteGenerator;
  private renderer?: Renderer;
  private depthManager?: DepthManager;
  private perspectiveScaler?: PerspectiveScaler;

  constructor() {
    this.npcContainer = new Container();
  }

  setSpriteGenerator(
    spriteGenerator: SpriteGenerator,
    renderer: Renderer,
  ): void {
    this.spriteGenerator = spriteGenerator;
    this.renderer = renderer;
  }

  setDepthManager(depthManager: DepthManager): void {
    this.depthManager = depthManager;
  }

  setPerspectiveScaler(perspectiveScaler: PerspectiveScaler): void {
    this.perspectiveScaler = perspectiveScaler;
  }

  setNPCSprites(sprites: CharacterSprites): void {
    // Store basic sprites as fallback
    this.spriteCache.set("basic", sprites);
  }

  private getSpritesForType(
    spriteType: string = "basic",
  ): CharacterSprites | undefined {
    console.log(`Getting sprites for type: ${spriteType}`);

    // Check if we already have these sprites cached
    if (this.spriteCache.has(spriteType)) {
      console.log(`Found cached sprites for type: ${spriteType}`);
      return this.spriteCache.get(spriteType);
    }

    console.log(
      `No cached sprites for ${spriteType}, attempting to generate...`,
    );
    console.log(
      `Have spriteGenerator: ${!!this.spriteGenerator}, have renderer: ${!!this.renderer}`,
    );

    // Generate new sprites if we have a sprite generator
    if (this.spriteGenerator && this.renderer) {
      console.log(`Generating sprites for NPC type: ${spriteType}`);
      try {
        const sprites = this.spriteGenerator.generateNPCSpritesWithRenderer(
          this.renderer,
          spriteType,
        );
        console.log(`Successfully generated sprites for ${spriteType}:`, {
          idle: !!sprites.down.idle,
          walk1: !!sprites.down.walk1,
          walk2: !!sprites.down.walk2,
        });
        this.spriteCache.set(spriteType, sprites);
        return sprites;
      } catch (error) {
        console.error(
          `Failed to generate sprites for type ${spriteType}:`,
          error,
        );
      }
    }

    // Fallback to basic sprites
    console.warn(`No sprites found for type ${spriteType}, using basic`);
    const basicSprites = this.spriteCache.get("basic");
    console.log(`Basic sprites available: ${!!basicSprites}`);
    return basicSprites;
  }

  addNPC(npcData: NPCData): boolean {
    if (this.npcs.has(npcData.id)) {
      console.warn(`NPC with id ${npcData.id} already exists`);
      return false;
    }

    // Get sprites for this NPC's type
    const sprites = this.getSpritesForType(npcData.spriteType);
    if (!sprites) {
      console.error(
        `Could not get sprites for NPC ${npcData.id} with type ${npcData.spriteType}`,
      );
      return false;
    }

    // Create new NPC
    const npc = new NPC(npcData, sprites);

    // Add to container
    this.npcContainer.addChild(npc.getSprite());

    // Set up position change callback for depth manager integration
    npc.setPositionChangeCallback((npcId: string, position: Position) => {
      if (this.depthManager) {
        this.depthManager.updateSpritePosition(`npc-${npcId}`, position.y);
      }
    });

    // Store in map
    this.npcs.set(npcData.id, npc);

    console.log(
      `Added NPC: ${npcData.name} at (${npcData.position.x}, ${npcData.position.y}) with sprite type: ${npcData.spriteType}`,
    );
    console.log(
      `NPC container now has ${this.npcContainer.children.length} children`,
    );
    console.log(
      `NPC sprite visible: ${npc.getSprite().visible}, alpha: ${npc.getSprite().alpha}`,
    );
    return true;
  }

  removeNPC(npcId: string): boolean {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      console.warn(`NPC with id ${npcId} not found`);
      return false;
    }

    // Remove from container and destroy
    npc.destroy();

    // Remove from map
    this.npcs.delete(npcId);

    console.log(`Removed NPC: ${npcId}`);
    return true;
  }

  getNPC(npcId: string): NPC | undefined {
    return this.npcs.get(npcId);
  }

  getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  // Get NPC at a specific position (for click detection)
  getNPCAtPosition(x: number, y: number): NPC | undefined {
    // Check NPCs in reverse order (top to bottom in rendering)
    const npcArray = Array.from(this.npcs.values());
    for (let i = npcArray.length - 1; i >= 0; i--) {
      const npc = npcArray[i];
      if (npc.containsPoint(x, y)) {
        return npc;
      }
    }
    return undefined;
  }

  // Clear all NPCs (useful for stage transitions)
  clearAllNPCs(): void {
    for (const npc of this.npcs.values()) {
      npc.destroy();
    }
    this.npcs.clear();
    console.log("Cleared all NPCs");
  }

  // Get the container for adding to stage
  getContainer(): Container {
    return this.npcContainer;
  }

  // Update NPC positions or animations if needed
  update(currentTime: number): void {
    // Update all NPCs - movement, animations, and perspective scaling
    for (const npc of this.npcs.values()) {
      npc.update(currentTime);

      // Apply perspective scaling based on NPC position
      if (this.perspectiveScaler) {
        this.perspectiveScaler.updateSpriteScale(npc.getSprite());
      }
    }
  }

  // Get count of NPCs
  getCount(): number {
    return this.npcs.size;
  }

  // Check if an NPC exists
  hasNPC(npcId: string): boolean {
    return this.npcs.has(npcId);
  }

  // Move an NPC to a new position
  moveNPC(npcId: string, position: Position): boolean {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      console.warn(`NPC with id ${npcId} not found`);
      return false;
    }

    npc.setPosition(position);

    // Update depth manager with new Y position
    if (this.depthManager) {
      this.depthManager.updateSpritePosition(`npc-${npcId}`, position.y);
    }

    return true;
  }

  // Make an NPC start talking (visual feedback)
  startNPCTalking(npcId: string): boolean {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      return false;
    }

    npc.startTalking();
    return true;
  }

  // Make an NPC stop talking
  stopNPCTalking(npcId: string): boolean {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      return false;
    }

    npc.stopTalking();
    return true;
  }

  // Stop all NPCs from talking
  stopAllNPCsTalking(): void {
    for (const npc of this.npcs.values()) {
      npc.stopTalking();
    }
  }

  // Get dialogue from a specific NPC
  getNPCDialogue(
    npcId: string,
    useRandom: boolean = false,
  ): { dialogue: string | null; position: Position | null } {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      console.warn(`NPC with id ${npcId} not found for dialogue`);
      return { dialogue: null, position: null };
    }

    const dialogue = useRandom
      ? npc.getRandomDialogue()
      : npc.getNextDialogue();
    const position = npc.getSpeechBubblePosition();

    return { dialogue, position };
  }

  // Check if an NPC has dialogue available
  npcHasDialogue(npcId: string): boolean {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      return false;
    }

    return npc.hasDialogues();
  }

  // Reset dialogue index for a specific NPC
  resetNPCDialogue(npcId: string): void {
    const npc = this.npcs.get(npcId);
    if (npc) {
      npc.resetDialogueIndex();
    }
  }

  // Get NPC by position (for click detection) - enhanced for dialogue
  getNPCForDialogue(npcId: string): NPC | undefined {
    return this.npcs.get(npcId);
  }

  // Set walkable area for all NPCs
  setWalkableArea(walkableArea: Position[]): void {
    for (const npc of this.npcs.values()) {
      npc.setWalkableArea(walkableArea);
    }
  }

  // Move a specific NPC to a target position
  moveNPCTo(npcId: string, targetX: number, targetY: number): boolean {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      console.warn(`NPC with id ${npcId} not found for movement`);
      return false;
    }

    return npc.moveTo(targetX, targetY);
  }

  // Check if any NPC is currently moving
  hasMovingNPCs(): boolean {
    for (const npc of this.npcs.values()) {
      if (npc.isMoving()) {
        return true;
      }
    }
    return false;
  }

  // Get all moving NPCs
  getMovingNPCs(): NPC[] {
    return Array.from(this.npcs.values()).filter((npc) => npc.isMoving());
  }

  // Stop all NPC movement
  stopAllMovement(): void {
    // NPCs will naturally stop at their current position on next update
    // We could add a forceStop method to NPC if needed
    // Currently no action needed as NPCs stop automatically
  }

  // Move random NPC to a random valid position (for testing/demo purposes)
  moveRandomNPC(): boolean {
    const npcArray = Array.from(this.npcs.values());
    if (npcArray.length === 0) return false;

    const randomNPC = npcArray[Math.floor(Math.random() * npcArray.length)];

    // Generate a random position within reasonable bounds
    // This is a simple implementation - could be improved with proper walkable area sampling
    const currentPos = randomNPC.getPosition();
    const randomOffset = 100; // Move within 100 pixels
    const targetX = currentPos.x + (Math.random() - 0.5) * randomOffset * 2;
    const targetY = currentPos.y + (Math.random() - 0.5) * randomOffset * 2;

    console.log(
      `Moving random NPC ${randomNPC.getName()} to random position (${targetX.toFixed(1)}, ${targetY.toFixed(1)})`,
    );
    return randomNPC.moveTo(targetX, targetY);
  }
}
