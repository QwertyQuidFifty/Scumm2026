import { ActionType } from "./CommandPanel";

export interface ActionResponse {
  text: string;
  shouldMoveCharacter?: boolean; // For actions that don't require movement
}

export class ActionResponseSystem {
  private responses: Map<string, Map<ActionType, ActionResponse>> = new Map();

  constructor() {
    this.initializeResponses();
  }

  private initializeResponses(): void {
    // Hotel Sign responses
    this.responses.set(
      "hotel-sign",
      new Map([
        [
          "look",
          {
            text: "It's a glowing neon hotel sign advertising cheap rooms.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          { text: "I can't use the hotel sign.", shouldMoveCharacter: false },
        ],
        [
          "get",
          {
            text: "The hotel sign is firmly attached to the wall.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "talk",
          {
            text: "The hotel sign doesn't respond.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "open",
          {
            text: "The hotel sign cannot be opened.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Bar Sign responses
    this.responses.set(
      "bar-sign",
      new Map([
        [
          "look",
          {
            text: "It's a red neon bar sign flickering in the night.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          { text: "I can't use the bar sign.", shouldMoveCharacter: false },
        ],
        [
          "get",
          {
            text: "The bar sign is too high up for me to reach.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "talk",
          {
            text: "The bar sign buzzes but says nothing.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "open",
          {
            text: "The bar sign cannot be opened.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Bar entrance responses
    this.responses.set(
      "bar-door",
      new Map([
        [
          "look",
          {
            text: "It's a dark bar entrance with a neon sign above.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          { text: "I can't use the bar door.", shouldMoveCharacter: false },
        ],
        [
          "get",
          {
            text: "I can't pick that up.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "talk",
          {
            text: "No one to talk to here",
            shouldMoveCharacter: false,
          },
        ],
        [
          "open",
          {
            text: "Its already open",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Street responses
    this.responses.set(
      "city-in-distance",
      new Map([
        [
          "look",
          {
            text: "The street leads into the depth of the city.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          {
            text: "I can't use the street itself.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "get",
          { text: "I can't pick up the street.", shouldMoveCharacter: false },
        ],
        ["talk", { text: "The street is silent.", shouldMoveCharacter: false }],
        [
          "open",
          { text: "There's nothing to open here.", shouldMoveCharacter: false },
        ],
        [
          "walk",
          {
            text: "I'm not going out in the open like that.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Building Entrance responses
    this.responses.set(
      "building-entrance",
      new Map([
        [
          "look",
          {
            text: "It's a dark building entrance shrouded in shadows.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          {
            text: "I try the entrance but it seems locked.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "get",
          {
            text: "I can't take the entire building.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "talk",
          {
            text: "No one answers from the dark entrance.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "open",
          {
            text: "",
            shouldMoveCharacter: false,
          },
        ],
        [
          "walk",
          {
            text: "I step through the entrance into the building.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Cryptic Door responses
    this.responses.set(
      "cryptic-door",
      new Map([
        [
          "look",
          {
            text: "It's an ornate door without a handle, covered in strange symbols.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          {
            text: "The door has no handle for me to use.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "get",
          { text: "The door is part of the wall.", shouldMoveCharacter: false },
        ],
        [
          "talk",
          {
            text: "The door remains mysteriously silent.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "open",
          {
            text: "Without a handle, I cannot open the door.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Golden Key responses (if still in scene)
    this.responses.set(
      "golden-key",
      new Map([
        [
          "look",
          {
            text: "It's a shiny golden key that might unlock something important.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          { text: "I need to pick it up first.", shouldMoveCharacter: false },
        ],
        [
          "get",
          { text: "I pick up the golden key.", shouldMoveCharacter: false },
        ], // Special handling in Game.ts
        [
          "talk",
          { text: "The key doesn't respond.", shouldMoveCharacter: false },
        ],
        [
          "open",
          {
            text: "I need to pick up the key first.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Exit Door responses (for test indoor stage)
    this.responses.set(
      "exit-door",
      new Map([
        [
          "look",
          {
            text: "It's the exit door leading back to the street.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "open",
          {
            text: "I open the door and step back onto the street.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          { text: "I can use the door to leave.", shouldMoveCharacter: false },
        ],
        [
          "get",
          {
            text: "I can't take the door with me.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "talk",
          {
            text: "The door doesn't respond.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Small Stool responses (mechstore stage)
    this.responses.set(
      "stool-small",
      new Map([
        [
          "look",
          {
            text: "It's a small wooden stool. Simple but sturdy.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          {
            text: "I could sit on it, but I don't need to rest right now.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "get",
          {
            text: "The stool is too heavy and I don't need it.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "talk",
          {
            text: "The stool doesn't respond.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "open",
          {
            text: "There's nothing to open on the stool.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Add inventory item responses
    this.initializeInventoryItemResponses();

    console.log(`Initialized responses for ${this.responses.size} objects`);
  }

  private initializeInventoryItemResponses(): void {
    // Key Card responses
    this.responses.set(
      "keycard",
      new Map([
        [
          "look",
          {
            text: "It's a plastic access card with a magnetic strip.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          {
            text: "I need to use this on something that accepts keycards.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Credits responses
    this.responses.set(
      "credits",
      new Map([
        [
          "look",
          {
            text: "Digital currency chips worth 100 credits.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          {
            text: "I need to find something to spend these credits on.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );

    // Data Pad responses
    this.responses.set(
      "datapad",
      new Map([
        [
          "look",
          {
            text: "It's a small handheld device containing encrypted files.",
            shouldMoveCharacter: false,
          },
        ],
        [
          "use",
          {
            text: "The files are encrypted. I need to find a way to decrypt them.",
            shouldMoveCharacter: false,
          },
        ],
      ]),
    );
  }

  getResponse(
    objectId: string,
    action: ActionType,
  ): ActionResponse | undefined {
    const objectResponses = this.responses.get(objectId);
    if (!objectResponses) {
      console.warn(`No responses found for object: ${objectId}`);
      return undefined;
    }

    const response = objectResponses.get(action);
    if (!response) {
      console.warn(`No response found for ${action} on ${objectId}`);
      return undefined;
    }

    return response;
  }

  getAllObjectIds(): string[] {
    return Array.from(this.responses.keys());
  }

  getAllActionsForObject(objectId: string): ActionType[] {
    const objectResponses = this.responses.get(objectId);
    return objectResponses ? Array.from(objectResponses.keys()) : [];
  }
}
