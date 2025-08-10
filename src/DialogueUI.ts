import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { DialogueResponse } from "./DialogueTree";

export class DialogueUI {
  private container: Container;
  private background: Graphics;
  private responseTexts: Text[] = [];
  private selectedIndex: number = -1;
  private hoveredIndex: number = -1;
  private responses: DialogueResponse[] = [];
  private onResponseSelected?: (responseId: string) => void;

  private readonly maxResponses = 4;
  private readonly responseHeight = 25;
  private readonly padding = 10;
  private readonly backgroundColor = 0x000000;
  private readonly borderColor = 0x666666;
  private readonly selectedColor = 0x333333;
  private readonly textColor = 0xffffff;
  private readonly selectedTextColor = 0xffff00;

  constructor(_gameWidth: number, gameHeight: number) {
    this.container = new Container();

    // Create background
    this.background = new Graphics();
    this.container.addChild(this.background);

    // Position at bottom of game area (above action bar space)
    const uiHeight = this.maxResponses * this.responseHeight + this.padding * 2;
    this.container.x = 0;
    this.container.y = gameHeight - uiHeight - 40; // 40px above for action bar
    this.container.visible = false;

    console.log(
      `DialogueUI positioned at y=${this.container.y}, height=${uiHeight}`,
    );
  }

  // Show dialogue responses
  showResponses(responses: DialogueResponse[]): void {
    this.responses = responses;
    this.selectedIndex = -1; // No default selection\n    this.hoveredIndex = -1; // No default hover

    this.clearResponseTexts();
    this.createResponseTexts();
    this.updateBackground();
    this.updateSelection();

    this.container.visible = true;
    console.log(`Showing ${responses.length} dialogue responses`);
  }

  // Hide dialogue UI
  hide(): void {
    this.container.visible = false;
    this.clearResponseTexts();
    this.responses = [];
    this.selectedIndex = -1;
    console.log("Dialogue UI hidden");
  }

  // Hide response options but keep the dialogue UI container visible
  hideResponses(): void {
    this.clearResponseTexts();
    this.responses = [];
    this.selectedIndex = -1;
    this.hoveredIndex = -1;
    console.log("Dialogue response options hidden");
  }

  // Set response selection callback
  setOnResponseSelected(callback: (responseId: string) => void): void {
    this.onResponseSelected = callback;
  }

  // Handle keyboard input for selection
  handleKeyInput(key: string): boolean {
    if (!this.container.visible || this.responses.length === 0) {
      return false;
    }

    switch (key) {
      case "ArrowUp":
      case "w":
        this.moveSelection(-1);
        return true;
      case "ArrowDown":
      case "s":
        this.moveSelection(1);
        return true;
      case "Enter":
      case " ": // Space key
        this.selectCurrentResponse();
        return true;
      case "1":
        this.selectResponseByIndex(0);
        return true;
      case "2":
        this.selectResponseByIndex(1);
        return true;
      case "3":
        this.selectResponseByIndex(2);
        return true;
      case "4":
        this.selectResponseByIndex(3);
        return true;
      default:
        return false;
    }
  }

  // Handle mouse click on response
  handleClick(_x: number, y: number): boolean {
    if (!this.container.visible) {
      return false;
    }

    // Convert to local coordinates
    const localY = y - this.container.y;
    const responseIndex = Math.floor(
      (localY - this.padding) / this.responseHeight,
    );

    if (responseIndex >= 0 && responseIndex < this.responses.length) {
      this.selectedIndex = responseIndex;
      this.updateSelection();
      this.selectCurrentResponse();
      return true;
    }

    return false;
  }

  // Get container for adding to stage
  getContainer(): Container {
    return this.container;
  }

  // Check if dialogue UI is visible
  isVisible(): boolean {
    return this.container.visible;
  }

  private clearResponseTexts(): void {
    this.responseTexts.forEach((text) => {
      this.container.removeChild(text);
      text.destroy();
    });
    this.responseTexts = [];
  }

  private createResponseTexts(): void {
    const textStyle: Partial<TextStyle> = {
      fontFamily: "monospace",
      fontSize: 24, // Increased from 14 to 24 (10 sizes larger)
      fill: this.textColor,
    };

    this.responses.forEach((response, index) => {
      const text = new Text(`${index + 1}. ${response.text}`, textStyle);
      text.x = this.padding + 20; // Shifted 20px to the right
      text.y = this.padding + index * this.responseHeight;

      // Enable interactive events for hover
      text.eventMode = "static";
      text.cursor = "pointer";

      // Add hover event listeners
      text.on("pointerenter", () => {
        this.hoveredIndex = index;
        this.updateSelection();
      });

      text.on("pointerleave", () => {
        this.hoveredIndex = -1;
        this.updateSelection();
      });

      // Add click event listener
      text.on("pointerdown", () => {
        this.selectedIndex = index;
        this.updateSelection();
        this.selectCurrentResponse();
      });

      this.container.addChild(text);
      this.responseTexts.push(text);
    });
  }

  private updateBackground(): void {
    const width = 1024; // Full game area width
    const height = Math.max(
      this.responses.length * this.responseHeight + this.padding * 2,
      60,
    );

    this.background.clear();

    // Draw background
    this.background.beginFill(this.backgroundColor, 0.9);
    this.background.drawRect(0, 0, width, height);

    // Draw border
    this.background.lineStyle(1, this.borderColor);
    this.background.drawRect(0, 0, width, height);

    console.log(`Updated dialogue background: ${width}x${height}`);
  }

  private updateSelection(): void {
    // Remove old selection background
    const oldSelection = this.container.getChildByName("selection");
    if (oldSelection) {
      this.container.removeChild(oldSelection);
    }

    this.responseTexts.forEach((text, index) => {
      if (index === this.hoveredIndex) {
        // Yellow highlight on hover
        text.style.fill = this.selectedTextColor;

        // Draw hover background
        const selectionBg = new Graphics();
        selectionBg.beginFill(this.selectedColor, 0.3);
        selectionBg.drawRect(
          this.padding + 15, // Adjusted for right shift
          this.padding + index * this.responseHeight - 2,
          1024 - this.padding * 2 - 10,
          this.responseHeight,
        );

        selectionBg.name = "selection";
        this.container.addChildAt(selectionBg, 1); // Add after background
      } else {
        text.style.fill = this.textColor;
      }
    });
  }

  private moveSelection(direction: number): void {
    const newIndex = this.selectedIndex + direction;

    if (newIndex >= 0 && newIndex < this.responses.length) {
      this.selectedIndex = newIndex;
      this.hoveredIndex = newIndex; // Update hover to match selection
      this.updateSelection();
      console.log(`Selected dialogue option ${this.selectedIndex + 1}`);
    }
  }

  private selectResponseByIndex(index: number): void {
    if (index >= 0 && index < this.responses.length) {
      this.selectedIndex = index;
      this.hoveredIndex = index; // Update hover to match selection
      this.updateSelection();
      this.selectCurrentResponse();
    }
  }

  private selectCurrentResponse(): void {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.responses.length) {
      const selectedResponse = this.responses[this.selectedIndex];
      console.log(`Selected response: "${selectedResponse.text}"`);

      if (this.onResponseSelected) {
        this.onResponseSelected(selectedResponse.id);
      }
    }
  }
}
