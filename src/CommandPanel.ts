import {
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from "pixi.js";

export type ActionType = "walk" | "use" | "pick up" | "talk" | "look" | "open";

interface ButtonState {
  normal: {
    backgroundColor: number;
    borderColor: number;
    borderStyle: "outset" | "inset";
  };
  hover: {
    backgroundColor: number;
    borderColor: number;
    borderStyle: "outset" | "inset";
  };
  selected: {
    backgroundColor: number;
    borderColor: number;
    borderStyle: "outset" | "inset";
  };
}

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
  private buttonWidth: number = 120;
  private buttonHeight: number = 50;
  private buttonSpacing: number = 10;
  private textStyle: TextStyle;
  private onActionChange?: (action: ActionType) => void;

  private buttonState: ButtonState = {
    normal: {
      backgroundColor: 0x555555, // #555
      borderColor: 0x666666, // #666
      borderStyle: "outset",
    },
    hover: {
      backgroundColor: 0x666666, // #666
      borderColor: 0x666666, // #666
      borderStyle: "outset",
    },
    selected: {
      backgroundColor: 0x777777, // #777
      borderColor: 0x666666, // #666
      borderStyle: "inset",
    },
  };

  private actions: ActionType[] = [
    "walk",
    "use",
    "pick up",
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
      fontSize: 32,
      fill: 0xffffff, // white
      align: "center",
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
    const background = new Graphics();
    const text = new Text({
      text: action.toUpperCase(),
      style: this.textStyle,
    });

    // Position button
    container.x = index * (this.buttonWidth + this.buttonSpacing);
    container.y = 0;

    // Center text in button
    text.anchor.set(0.5, 0.5);
    text.x = this.buttonWidth / 2;
    text.y = this.buttonHeight / 2;

    // Add components to container
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
      if (!button.isSelected) {
        button.isHovered = true;
        this.updateButtonVisuals(button);
      }
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
    const bg = button.background;
    bg.clear();

    let state;
    if (button.isSelected) {
      state = this.buttonState.selected;
    } else if (button.isHovered) {
      state = this.buttonState.hover;
    } else {
      state = this.buttonState.normal;
    }

    // Draw button background
    bg.rect(0, 0, this.buttonWidth, this.buttonHeight).fill(
      state.backgroundColor,
    );

    // Draw border based on style (outset/inset)
    this.drawButtonBorder(bg, state.borderColor, state.borderStyle);
  }

  private drawButtonBorder(
    graphics: Graphics,
    borderColor: number,
    style: "outset" | "inset",
  ): void {
    const w = this.buttonWidth;
    const h = this.buttonHeight;
    const borderWidth = 2;

    if (style === "outset") {
      // Light border on top and left (raised effect)
      graphics.rect(0, 0, w, borderWidth).fill(0x888888); // top
      graphics.rect(0, 0, borderWidth, h).fill(0x888888); // left

      // Dark border on bottom and right (shadow effect)
      graphics.rect(0, h - borderWidth, w, borderWidth).fill(0x333333); // bottom
      graphics.rect(w - borderWidth, 0, borderWidth, h).fill(0x333333); // right
    } else {
      // Inset - reverse the light/dark borders
      graphics.rect(0, 0, w, borderWidth).fill(0x333333); // top
      graphics.rect(0, 0, borderWidth, h).fill(0x333333); // left

      graphics.rect(0, h - borderWidth, w, borderWidth).fill(0x888888); // bottom
      graphics.rect(w - borderWidth, 0, borderWidth, h).fill(0x888888); // right
    }
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
      this.actions.length * this.buttonWidth +
      (this.actions.length - 1) * this.buttonSpacing
    );
  }

  getHeight(): number {
    return this.buttonHeight;
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
