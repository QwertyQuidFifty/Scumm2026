import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class SpeechBubble extends Container {
  private bubble: Graphics;
  private speechText: Text;
  private textStyle: TextStyle;
  private isVisible: boolean = false;
  private hideTimer?: number;

  private readonly bubbleColor: number = 0x000000; // Black background
  private readonly textColor: number = 0xffffff; // White text
  private readonly borderColor: number = 0xffffff; // White border
  private readonly padding: number = 8;
  private readonly maxWidth: number = 200;
  private readonly fontSize: number = 14;

  constructor() {
    super();
    this.setupTextStyle();
    this.setupBubble();
    this.setupText();
    this.visible = false;
  }

  private setupTextStyle(): void {
    this.textStyle = new TextStyle({
      fontFamily: "Courier New",
      fontSize: this.fontSize,
      fill: this.textColor,
      align: "center",
      wordWrap: true,
      wordWrapWidth: this.maxWidth - this.padding * 2,
      breakWords: true,
    });
  }

  private setupBubble(): void {
    this.bubble = new Graphics();
    this.addChild(this.bubble);
  }

  private setupText(): void {
    this.speechText = new Text({
      text: "",
      style: this.textStyle,
    });

    this.speechText.anchor.set(0.5, 0.5);
    this.addChild(this.speechText);
  }

  private drawBubble(textWidth: number, textHeight: number): void {
    this.bubble.clear();

    const bubbleWidth = textWidth + this.padding * 2;
    const bubbleHeight = textHeight + this.padding * 2;

    // Draw rounded rectangle background
    this.bubble
      .roundRect(
        -bubbleWidth / 2,
        -bubbleHeight / 2 - 10, // Offset up to appear above character
        bubbleWidth,
        bubbleHeight,
        8,
      )
      .fill(this.bubbleColor);

    // Draw white border
    this.bubble
      .roundRect(
        -bubbleWidth / 2,
        -bubbleHeight / 2 - 10,
        bubbleWidth,
        bubbleHeight,
        8,
      )
      .stroke({ color: this.borderColor, width: 2 });

    // Draw speech bubble tail pointing down to character
    this.bubble
      .moveTo(0, -10)
      .lineTo(-8, -20)
      .lineTo(8, -20)
      .closePath()
      .fill(this.bubbleColor);

    // Border for tail
    this.bubble
      .moveTo(0, -10)
      .lineTo(-8, -20)
      .lineTo(8, -20)
      .closePath()
      .stroke({ color: this.borderColor, width: 2 });
  }

  showSpeech(text: string, duration: number = 3000): void {
    // Clear any existing timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    // Set the text
    this.speechText.text = text;

    // Position text
    this.speechText.y = -10; // Above character, accounting for tail

    // Draw bubble based on text dimensions
    const textBounds = this.speechText.getBounds();
    this.drawBubble(textBounds.width, textBounds.height);

    // Show the bubble
    this.visible = true;
    this.isVisible = true;

    // Auto-hide after duration
    this.hideTimer = setTimeout(() => {
      this.hideSpeech();
    }, duration);

    console.log(`Speech bubble: "${text}"`);
  }

  hideSpeech(): void {
    this.visible = false;
    this.isVisible = false;

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }

  isShowing(): boolean {
    return this.isVisible;
  }

  positionAboveCharacter(characterX: number, characterY: number): void {
    this.x = characterX;
    this.y = characterY - 60; // Position above character sprite
  }

  destroy(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.bubble.destroy();
    this.speechText.destroy();
    super.destroy();
  }
}
