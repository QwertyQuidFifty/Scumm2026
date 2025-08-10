import { Position } from "./types";

// Condition for showing dialogue options or branches
export interface DialogueCondition {
  type: "inventory" | "flag" | "always";
  key?: string; // inventory item id or flag name
  value?: boolean | string | number; // expected value for the condition
}

// A single dialogue response option that the player can choose
export interface DialogueResponse {
  id: string;
  text: string;
  nextNodeId?: string; // null means end dialogue
  conditions?: DialogueCondition[]; // conditions for this response to be available
  setFlag?: { key: string; value: boolean | string | number }; // flag to set when chosen
  removeItem?: string; // inventory item to remove when chosen
  addItem?: string; // inventory item to add when chosen
}

// A dialogue node - what the NPC says and player response options
export interface DialogueNode {
  id: string;
  npcText: string;
  responses: DialogueResponse[];
  conditions?: DialogueCondition[]; // conditions for this node to be available
}

// Complete dialogue tree for an NPC
export interface DialogueTree {
  npcId: string;
  startNodeId: string;
  nodes: { [nodeId: string]: DialogueNode };
}

// Current dialogue state
export interface DialogueState {
  isActive: boolean;
  currentTree?: DialogueTree;
  currentNodeId?: string;
  npcId?: string;
  npcPosition?: Position;
}

export class DialogueManager {
  private dialogueTrees: Map<string, DialogueTree> = new Map();
  private currentState: DialogueState = { isActive: false };
  private gameFlags: Map<string, boolean | string | number> = new Map();

  // Register a dialogue tree for an NPC
  registerDialogueTree(tree: DialogueTree): void {
    this.dialogueTrees.set(tree.npcId, tree);
    console.log(`Registered dialogue tree for NPC: ${tree.npcId}`);
  }

  // Start dialogue with an NPC
  startDialogue(npcId: string, npcPosition: Position): DialogueNode | null {
    const tree = this.dialogueTrees.get(npcId);
    if (!tree) {
      console.warn(`No dialogue tree found for NPC: ${npcId}`);
      return null;
    }

    const startNode = tree.nodes[tree.startNodeId];
    if (!startNode) {
      console.error(
        `Start node ${tree.startNodeId} not found in dialogue tree for NPC: ${npcId}`,
      );
      return null;
    }

    // Check if start node conditions are met
    if (!this.checkConditions(startNode.conditions)) {
      console.log(`Start node conditions not met for NPC: ${npcId}`);
      return null;
    }

    this.currentState = {
      isActive: true,
      currentTree: tree,
      currentNodeId: tree.startNodeId,
      npcId: npcId,
      npcPosition: npcPosition,
    };

    console.log(`Started dialogue with ${npcId} at node ${tree.startNodeId}`);
    return startNode;
  }

  // Get current dialogue node
  getCurrentNode(): DialogueNode | null {
    if (
      !this.currentState.isActive ||
      !this.currentState.currentTree ||
      !this.currentState.currentNodeId
    ) {
      return null;
    }

    return (
      this.currentState.currentTree.nodes[this.currentState.currentNodeId] ||
      null
    );
  }

  // Get available response options (filtered by conditions)
  getAvailableResponses(inventory?: Set<string>): DialogueResponse[] {
    const currentNode = this.getCurrentNode();
    if (!currentNode) {
      return [];
    }

    return currentNode.responses.filter((response) =>
      this.checkConditions(response.conditions, inventory),
    );
  }

  // Choose a response and move to next node
  chooseResponse(
    responseId: string,
    inventory: Set<string>,
  ): DialogueNode | null {
    const currentNode = this.getCurrentNode();
    if (!currentNode || !this.currentState.currentTree) {
      return null;
    }

    const response = currentNode.responses.find((r) => r.id === responseId);
    if (!response) {
      console.error(`Response ${responseId} not found in current node`);
      return null;
    }

    // Check response conditions
    if (!this.checkConditions(response.conditions, inventory)) {
      console.error(`Response ${responseId} conditions not met`);
      return null;
    }

    // Execute response effects
    if (response.setFlag) {
      this.setFlag(response.setFlag.key, response.setFlag.value);
    }

    if (response.removeItem) {
      inventory.delete(response.removeItem);
      console.log(`Removed item from inventory: ${response.removeItem}`);
    }

    if (response.addItem) {
      inventory.add(response.addItem);
      console.log(`Added item to inventory: ${response.addItem}`);
    }

    // Move to next node or end dialogue
    if (response.nextNodeId) {
      const nextNode = this.currentState.currentTree.nodes[response.nextNodeId];
      if (nextNode && this.checkConditions(nextNode.conditions, inventory)) {
        this.currentState.currentNodeId = response.nextNodeId;
        console.log(`Moved to dialogue node: ${response.nextNodeId}`);
        return nextNode;
      } else {
        console.log(
          `Next node ${response.nextNodeId} not available, ending dialogue`,
        );
        this.endDialogue();
        return null;
      }
    } else {
      // End dialogue
      this.endDialogue();
      return null;
    }
  }

  // End current dialogue
  endDialogue(): void {
    console.log(`Ending dialogue with ${this.currentState.npcId}`);
    this.currentState = { isActive: false };
  }

  // Check if dialogue is currently active
  isDialogueActive(): boolean {
    return this.currentState.isActive;
  }

  // Get current dialogue state
  getCurrentState(): DialogueState {
    return { ...this.currentState };
  }

  // Flag management
  setFlag(key: string, value: boolean | string | number): void {
    this.gameFlags.set(key, value);
    console.log(`Set flag ${key} = ${value}`);
  }

  getFlag(key: string): boolean | string | number | undefined {
    return this.gameFlags.get(key);
  }

  // Check if conditions are met
  private checkConditions(
    conditions?: DialogueCondition[],
    inventory?: Set<string>,
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions = always available
    }

    return conditions.every((condition) => {
      switch (condition.type) {
        case "always":
          return true;
        case "flag": {
          if (!condition.key) return false;
          const flagValue = this.getFlag(condition.key);
          return flagValue === condition.value;
        }
        case "inventory": {
          if (!condition.key || !inventory) return false;
          return inventory.has(condition.key);
        }
        default:
          return false;
      }
    });
  }

  // Debug: Get all flags
  getAllFlags(): { [key: string]: boolean | string | number } {
    return Object.fromEntries(this.gameFlags.entries());
  }
}
