import {
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from "pixi.js";

export type ActionType = "walk" | "use" | "get" | "talk" | "look" | "open";

interface CommandButton {
  container: Container;
  background: Graphics;
  text: Text;
  action: ActionType;
  isHovered: boolean;
  isSelected: boolean;
}

export class CommandPanel {
  private container: Container;
  private buttons: Map<ActionType, CommandButton> = new Map();
  private selectedAction: ActionType = "walk";
  private buttonWidth: number = 90; // 50% larger than 60
  private buttonHeight: number = 60; // 50% larger than 40
  private buttonSpacing: number = 8;
  private buttonsPerRow: number = 2;
  private textStyle: TextStyle;
  private onActionChange?: (action: ActionType) => void;

  private textColors = {
    normal: 0xaa00ff, // bright purple
    hover: 0xff69b4, // hot pink
    selected: 0xffffff, // white
  };

  private actions: ActionType[] = [
    "walk",
    "use",
    "get",
    "talk",
    "look",
    "open",
  ];

  constructor() {
    this.container = new Container();
    this.setupTextStyle();
    this.createButtons();
    this.setSelectedAction("walk"); // Default selection
  }

  private setupTextStyle(): void {
    this.textStyle = new TextStyle({
      fontFamily: "Courier New",
      fontSize: 48, // Even larger font size without button boxes
      fill: 0xaa00ff, // bright purple (will be overridden per button)
      align: "center",
      fontWeight: "bold",
    });
  }

  private createButtons(): void {
    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      const button = this.createButton(action, i);
      this.buttons.set(action, button);
      this.container.addChild(button.container);
    }
  }

  private createButton(action: ActionType, index: number): CommandButton {
    const container = new Container();
    const background = new Graphics(); // Invisible background for alignment
    const text = new Text({
      text: action.charAt(0).toUpperCase() + action.slice(1).toLowerCase(),
      style: this.textStyle,
    });

    // Position button in 2x3 grid layout
    const row = Math.floor(index / this.buttonsPerRow);
    const col = index % this.buttonsPerRow;
    container.x = col * (this.buttonWidth + this.buttonSpacing);
    container.y = row * (this.buttonHeight + this.buttonSpacing);

    // Draw invisible background box for alignment (0 alpha = invisible)
    background
      .rect(0, 0, this.buttonWidth, this.buttonHeight)
      .fill({ color: 0x000000, alpha: 0 });

    // Center text within the invisible button box
    text.anchor.set(0.5, 0.5);
    text.x = this.buttonWidth / 2;
    text.y = this.buttonHeight / 2;

    // Add both background and text to container
    container.addChild(background);
    container.addChild(text);

    // Enable interactive events
    container.eventMode = "static";
    container.cursor = "pointer";

    const button: CommandButton = {
      container,
      background,
      text,
      action,
      isHovered: false,
      isSelected: false,
    };

    // Set up event handlers
    container.on("pointerdown", (event: FederatedPointerEvent) => {
      this.handleButtonClick(button, event);
    });

    container.on("pointerup", (event: FederatedPointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
    });

    container.on("click", (event: FederatedPointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
    });

    container.on("pointerenter", (event: FederatedPointerEvent) => {
      event.stopPropagation();
      button.isHovered = true;
      this.updateButtonVisuals(button);
    });

    container.on("pointerleave", (event: FederatedPointerEvent) => {
      event.stopPropagation();
      button.isHovered = false;
      this.updateButtonVisuals(button);
    });

    // Draw initial button state
    this.updateButtonVisuals(button);

    return button;
  }

  private handleButtonClick(
    button: CommandButton,
    event: FederatedPointerEvent,
  ): void {
    event.stopPropagation();
    event.preventDefault();
    this.setSelectedAction(button.action);

    if (this.onActionChange) {
      this.onActionChange(button.action);
    }

    console.log(`Action selected: ${button.action}`);
  }

  private updateButtonVisuals(button: CommandButton): void {
    // Update text color based on button state (selected takes priority)
    let textColor;
    if (button.isSelected) {
      textColor = this.textColors.selected; // White for selected
    } else if (button.isHovered) {
      textColor = this.textColors.hover; // Pink for hover
    } else {
      textColor = this.textColors.normal; // Bright purple for normal
    }

    // Create a new style for this specific button to avoid shared style issues
    button.text.style = new TextStyle({
      fontFamily: "Courier New",
      fontSize: 28,
      fill: textColor,
      align: "center",
    });
  }

  setSelectedAction(action: ActionType): void {
    // Clear previous selection
    for (const button of this.buttons.values()) {
      button.isSelected = false;
      this.updateButtonVisuals(button);
    }

    // Set new selection
    const selectedButton = this.buttons.get(action);
    if (selectedButton) {
      selectedButton.isSelected = true;
      this.updateButtonVisuals(selectedButton);
    }

    this.selectedAction = action;
  }

  getSelectedAction(): ActionType {
    return this.selectedAction;
  }

  setOnActionChange(callback: (action: ActionType) => void): void {
    this.onActionChange = callback;
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  getContainer(): Container {
    return this.container;
  }

  getTotalWidth(): number {
    return (
      this.buttonsPerRow * this.buttonWidth +
      (this.buttonsPerRow - 1) * this.buttonSpacing
    );
  }

  getHeight(): number {
    const rows = Math.ceil(this.actions.length / this.buttonsPerRow);
    return rows * this.buttonHeight + (rows - 1) * this.buttonSpacing;
  }

  destroy(): void {
    // Clean up event listeners
    for (const button of this.buttons.values()) {
      button.container.removeAllListeners();
    }

    this.buttons.clear();
    this.container.destroy();
  }
}
