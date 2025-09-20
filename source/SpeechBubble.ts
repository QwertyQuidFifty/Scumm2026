import { Container, Text, TextStyle } from "pixi.js";

export class SpeechBubble extends Container {
  private speechText!: Text;
  private textStyle!: TextStyle;
  private isVisible: boolean = false;
  private hideTimer?: number;

  private readonly textColor: number = 0xffffff; // White text
  private readonly shadowColor: number = 0x000000; // Black shadow
  private readonly maxWidth: number = 400;
  private readonly fontSize: number = 28; // Double the original size

  constructor() {
    super();
    this.setupTextStyle();
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
      wordWrapWidth: this.maxWidth,
      breakWords: true,
      // Add black shadow/stroke for contrast
      stroke: { color: this.shadowColor, width: 2 },
    });
  }

  private setupText(): void {
    this.speechText = new Text({
      text: "",
      style: this.textStyle,
    });

    this.speechText.anchor.set(0.5, 1.0); // Anchor to bottom center
    this.addChild(this.speechText);
  }

  showSpeech(
    text: string,
    duration: number = 3000,
    textColor: number = 0xffffff,
  ): void {
    // Clear any existing timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    // Update text color if different from current
    if (this.textStyle.fill !== textColor) {
      this.textStyle.fill = textColor;
    }

    // Set the text
    this.speechText.text = text;

    // Position text above character (no bubble tail needed)
    this.speechText.y = 0;

    // Show the text
    this.visible = true;
    this.isVisible = true;

    // Auto-hide after duration
    this.hideTimer = setTimeout(() => {
      this.hideSpeech();
    }, duration);

    console.log(`Speech text: "${text}"`);
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

  positionAboveCharacter(
    characterX: number,
    characterY: number,
    stageHeight: number = 768,
  ): void {
    // Ensure text bounds are available
    if (!this.speechText.text) {
      this.x = characterX;
      this.y = characterY - 100;
      return;
    }

    // Default position above character
    let targetX = characterX;
    let targetY = characterY - 100;

    // Get text bounds for boundary calculations (after text is set)
    const textBounds = this.speechText.getBounds();
    const textWidth = textBounds.width;
    const textHeight = textBounds.height;

    // Boundary margins
    const margin = 10;
    const gameAreaWidth = 1024; // Keep text within game area, not in UI space (hardcoded to exclude UI)

    // Check horizontal boundaries
    if (targetX - textWidth / 2 < margin) {
      // Too close to left edge, shift right
      targetX = margin + textWidth / 2;
    } else if (targetX + textWidth / 2 > gameAreaWidth - margin) {
      // Too close to right edge (or UI area), shift left
      targetX = gameAreaWidth - margin - textWidth / 2;
    }

    // Check vertical boundaries
    if (targetY - textHeight < margin) {
      // Too close to top edge, position below character instead
      targetY = characterY + 50; // Position below character

      // Make sure it doesn't go off bottom either
      if (targetY + textHeight > stageHeight - margin) {
        targetY = stageHeight - margin - textHeight;
      }
    }

    this.x = targetX;
    this.y = targetY;
  }

  destroy(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.speechText.destroy();
    super.destroy();
  }
}
