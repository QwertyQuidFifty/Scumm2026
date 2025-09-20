import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class ActionBar {
  private container: Container;
  private background!: Graphics;
  private text!: Text;
  private textStyle!: TextStyle;
  private width: number;
  private height: number = 40; // Reduced height for better space utilization
  private currentAction: string = "Walk";
  private defaultText: string = "Walk to";
  private normalColor: number = 0xaa00ff; // bright purple
  private flashColor: number = 0xff69b4; // hot pink
  private isDisabled: boolean = false;
  private isLocked: boolean = false; // SCUMM-style: lock during interactions

  constructor(width: number) {
    this.width = width;
    this.container = new Container();

    this.setupTextStyle();
    this.setupBackground();
    this.setupText();
  }

  private setupTextStyle(): void {
    this.textStyle = new TextStyle({
      fontFamily: "Courier New",
      fontSize: 28, // Reduced font size to fit smaller bar
      fill: this.normalColor, // bright purple to match action buttons
      align: "left",
    });
  }

  private setupBackground(): void {
    this.background = new Graphics();
    this.background.rect(0, 0, this.width, this.height).fill(0x1a1a1a); // dark background #1a1a1a

    this.container.addChild(this.background);
  }

  private setupText(): void {
    this.text = new Text({
      text: this.defaultText,
      style: this.textStyle,
    });

    // Position text with some padding from left and center vertically
    this.text.x = 20;
    this.text.y = (this.height - this.text.height) / 2;

    this.container.addChild(this.text);
  }

  updateText(newText: string): void {
    this.text.text = newText;
    // Re-center vertically in case text height changed
    this.text.y = (this.height - this.text.height) / 2;
  }

  setAction(action: string): void {
    this.currentAction = action;

    // Format action text with appropriate preposition
    let actionText;
    switch (action.toLowerCase()) {
      case "walk":
        actionText = "Walk to";
        break;
      case "look":
        actionText = "Look at";
        break;
      case "talk":
        actionText = "Talk to";
        break;
      case "use":
        actionText = "Use";
        break;
      case "get":
        actionText = "Get";
        break;
      case "open":
        actionText = "Open";
        break;
      default:
        actionText = `${action} to`;
    }

    this.updateText(actionText);
  }

  setActionWithObject(action: string, objectName: string): void {
    this.currentAction = action;
    this.updateText(`${action} ${objectName}`);
  }

  showObjectHover(objectName: string): void {
    // SCUMM behavior: ignore hover updates when locked during interaction
    if (this.isLocked) return;
    this.showObjectHoverWithAction(objectName, this.currentAction);
  }

  showObjectHoverWithAction(objectName: string, action: string): void {
    // SCUMM behavior: ignore hover updates when locked during interaction
    if (this.isLocked) return;
    // Format action text with appropriate preposition for the object
    let actionText;
    switch (action.toLowerCase()) {
      case "walk":
        actionText = `Walk to ${objectName.toLowerCase()}`;
        break;
      case "look":
        actionText = `Look at ${objectName.toLowerCase()}`;
        break;
      case "talk":
        actionText = `Talk to ${objectName.toLowerCase()}`;
        break;
      case "use":
        actionText = `Use ${objectName.toLowerCase()}`;
        break;
      case "get":
        actionText = `Get ${objectName.toLowerCase()}`;
        break;
      case "open":
        actionText = `Open ${objectName.toLowerCase()}`;
        break;
      default:
        actionText = `${action} ${objectName.toLowerCase()}`;
    }

    this.updateText(actionText);
  }

  showDefaultText(): void {
    // SCUMM behavior: ignore default text updates when locked during interaction
    if (this.isLocked) return;
    // Show the current action instead of always defaulting to "Walk to"
    this.setAction(this.currentAction);
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  resize(newWidth: number): void {
    this.width = newWidth;
    this.background.clear();
    this.background.rect(0, 0, this.width, this.height).fill(0x1a1a1a);
  }

  getContainer(): Container {
    return this.container;
  }

  getHeight(): number {
    return this.height;
  }

  getCurrentAction(): string {
    return this.currentAction;
  }

  flashPink(): void {
    // Stay pink until action is complete
    this.text.style.fill = this.flashColor;
  }

  revertColor(): void {
    // Revert to normal color when action is complete
    this.text.style.fill = this.normalColor;
  }

  setDisabled(disabled: boolean): void {
    this.isDisabled = disabled;
    this.updateDisabledState();
  }

  // SCUMM-style interaction locking
  lockForInteraction(): void {
    this.isLocked = true;
  }

  unlockFromInteraction(): void {
    this.isLocked = false;
  }

  isInteractionLocked(): boolean {
    return this.isLocked;
  }

  private updateDisabledState(): void {
    if (this.isDisabled) {
      // Grey out text and background when disabled
      this.text.style.fill = 0x666666; // Grey text
      this.background.clear();
      this.background.rect(0, 0, this.width, this.height).fill(0x2a2a2a); // Darker grey background
    } else {
      // Restore normal appearance when enabled
      this.text.style.fill = this.normalColor;
      this.background.clear();
      this.background.rect(0, 0, this.width, this.height).fill(0x1a1a1a); // Original dark background
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
