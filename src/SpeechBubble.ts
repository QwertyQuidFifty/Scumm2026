import { Container, Text, TextStyle } from "pixi.js";

export class SpeechBubble extends Container {
  private speechText: Text;
  private textStyle: TextStyle;
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

  showSpeech(text: string, duration: number = 3000): void {
    // Clear any existing timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
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

  positionAboveCharacter(characterX: number, characterY: number): void {
    this.x = characterX;
    this.y = characterY - 100; // Position well above character sprite to not obscure it
  }

  destroy(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.speechText.destroy();
    super.destroy();
  }
}
