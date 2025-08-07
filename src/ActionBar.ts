import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class ActionBar {
  private container: Container;
  private background: Graphics;
  private text: Text;
  private textStyle: TextStyle;
  private width: number;
  private height: number = 40; // Reduced height for better space utilization
  private currentAction: string = "Walk";
  private defaultText: string = "Walk to";

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
      fontSize: 20, // Reduced font size to fit smaller bar
      fill: 0xffffff, // white
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
    this.updateText(`${action} to`);
  }

  setActionWithObject(action: string, objectName: string): void {
    this.currentAction = action;
    this.updateText(`${action} ${objectName}`);
  }

  showObjectHover(objectName: string): void {
    this.updateText(`${this.currentAction} to ${objectName.toLowerCase()}`);
  }

  showDefaultText(): void {
    this.updateText(this.defaultText);
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

  destroy(): void {
    this.container.destroy();
  }
}
