import {
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from "pixi.js";
import { ActionType } from "./CommandPanel";

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  color: number;
  icon: string;
  defaultAction: ActionType; // Default action for right-click and highlighting
}

interface InventorySlot {
  container: Container;
  background: Graphics;
  text: Text;
  item?: InventoryItem;
  isHovered: boolean;
  slotIndex: number;
}

export class InventorySystem {
  private container: Container;
  private slots: InventorySlot[] = [];
  private maxSlots: number = 10;
  private slotWidth: number = 90; // 50% larger than 60
  private slotHeight: number = 90; // 50% larger than 60
  private slotSpacing: number = 8;
  private slotsPerRow: number = 2;
  private textStyle!: TextStyle;
  private onSlotClick?: (slotIndex: number, item?: InventoryItem) => void;
  private onSlotHover?: (slotIndex: number, item?: InventoryItem) => void;
  private onSlotHoverExit?: () => void;
  private isDisabled: boolean = false;

  private slotColors = {
    empty: {
      normal: 0x222222, // Darker consistent color for all slots (#222)
      hover: 0x333333, // Slightly lighter on hover (#333)
      disabled: 0x111111, // Even darker when disabled
      border: 0x666666, // Not used anymore
    },
  };

  constructor() {
    this.container = new Container();
    this.setupTextStyle();
    this.createSlots();
  }

  private setupTextStyle(): void {
    this.textStyle = new TextStyle({
      fontFamily: "Courier New",
      fontSize: 44, // Increased font size for larger slots
      fill: 0xffffff, // white
      align: "center",
      fontWeight: "bold",
    });
  }

  private createSlots(): void {
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = this.createSlot(i);
      this.slots.push(slot);
      this.container.addChild(slot.container);
    }
  }

  private createSlot(index: number): InventorySlot {
    const container = new Container();
    const background = new Graphics();
    const text = new Text({
      text: "",
      style: this.textStyle,
    });

    // Position slot in 2x5 grid layout
    const row = Math.floor(index / this.slotsPerRow);
    const col = index % this.slotsPerRow;
    container.x = col * (this.slotWidth + this.slotSpacing);
    container.y = row * (this.slotHeight + this.slotSpacing);

    // Center text in slot
    text.anchor.set(0.5, 0.5);
    text.x = this.slotWidth / 2;
    text.y = this.slotHeight / 2;

    // Add components to container
    container.addChild(background);
    container.addChild(text);

    // Enable interactive events
    container.eventMode = "static";
    container.cursor = "pointer";

    const slot: InventorySlot = {
      container,
      background,
      text,
      item: undefined,
      isHovered: false,
      slotIndex: index,
    };

    // Set up event handlers
    container.on("pointerdown", (event: FederatedPointerEvent) => {
      this.handleSlotClick(slot, event);
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
      slot.isHovered = true;
      this.updateSlotVisuals(slot);

      if (this.onSlotHover) {
        this.onSlotHover(slot.slotIndex, slot.item);
      }
    });

    container.on("pointerleave", (event: FederatedPointerEvent) => {
      event.stopPropagation();
      slot.isHovered = false;
      this.updateSlotVisuals(slot);

      if (this.onSlotHoverExit) {
        this.onSlotHoverExit();
      }
    });

    // Draw initial slot state
    this.updateSlotVisuals(slot);

    return slot;
  }

  private handleSlotClick(
    slot: InventorySlot,
    event: FederatedPointerEvent,
  ): void {
    event.stopPropagation();
    event.preventDefault();

    // Ignore clicks when disabled
    if (this.isDisabled) {
      return;
    }

    if (this.onSlotClick) {
      this.onSlotClick(slot.slotIndex, slot.item);
    }

    console.log(
      `Inventory slot ${slot.slotIndex} clicked`,
      slot.item ? `with item: ${slot.item.name}` : "(empty)",
    );
  }

  private updateSlotVisuals(slot: InventorySlot): void {
    const bg = slot.background;
    bg.clear();

    // Determine background color based on state
    let backgroundColor;
    if (this.isDisabled) {
      backgroundColor = this.slotColors.empty.disabled;
    } else {
      backgroundColor = slot.isHovered
        ? this.slotColors.empty.hover
        : this.slotColors.empty.normal;
    }

    bg.rect(0, 0, this.slotWidth, this.slotHeight).fill(backgroundColor);

    if (slot.item) {
      // Show item icon on top of background
      slot.text.text = slot.item.icon;
      slot.text.visible = true;

      // Dim text when disabled
      slot.text.alpha = this.isDisabled ? 0.4 : 1.0;
    } else {
      // Hide text for empty slots
      slot.text.text = "";
      slot.text.visible = false;
    }
  }

  addItem(item: InventoryItem): boolean {
    // Find first empty slot
    const emptySlot = this.slots.find((slot) => !slot.item);

    if (emptySlot) {
      emptySlot.item = item;
      this.updateSlotVisuals(emptySlot);
      console.log(
        `Added ${item.name} to inventory slot ${emptySlot.slotIndex}`,
      );
      return true;
    }

    console.log(`Cannot add ${item.name} - inventory is full`);
    return false;
  }

  removeItem(slotIndex: number): InventoryItem | undefined {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return undefined;
    }

    const slot = this.slots[slotIndex];
    const item = slot.item;

    if (item) {
      slot.item = undefined;
      this.updateSlotVisuals(slot);
      console.log(`Removed ${item.name} from inventory slot ${slotIndex}`);
    }

    return item;
  }

  getItem(slotIndex: number): InventoryItem | undefined {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return undefined;
    }
    return this.slots[slotIndex].item;
  }

  getAllItems(): InventoryItem[] {
    return this.slots.filter((slot) => slot.item).map((slot) => slot.item!);
  }

  isEmpty(): boolean {
    return this.slots.every((slot) => !slot.item);
  }

  isFull(): boolean {
    return this.slots.every((slot) => slot.item);
  }

  getSlotCount(): number {
    return this.maxSlots;
  }

  setOnSlotClick(
    callback: (slotIndex: number, item?: InventoryItem) => void,
  ): void {
    this.onSlotClick = callback;
  }

  setOnSlotHover(
    callback: (slotIndex: number, item?: InventoryItem) => void,
  ): void {
    this.onSlotHover = callback;
  }

  setOnSlotHoverExit(callback: () => void): void {
    this.onSlotHoverExit = callback;
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
      this.slotsPerRow * this.slotWidth +
      (this.slotsPerRow - 1) * this.slotSpacing
    );
  }

  getHeight(): number {
    const rows = Math.ceil(this.maxSlots / this.slotsPerRow);
    return rows * this.slotHeight + (rows - 1) * this.slotSpacing;
  }

  // Enable/disable UI functionality
  setDisabled(disabled: boolean): void {
    this.isDisabled = disabled;

    // Update cursor and visuals for all slots
    for (const slot of this.slots) {
      slot.container.cursor = disabled ? "default" : "pointer";
      this.updateSlotVisuals(slot);
    }

    console.log(`InventorySystem ${disabled ? "disabled" : "enabled"}`);
  }

  isDisabledState(): boolean {
    return this.isDisabled;
  }

  destroy(): void {
    // Clean up event listeners
    for (const slot of this.slots) {
      slot.container.removeAllListeners();
    }

    this.slots.length = 0;
    this.container.destroy();
  }
}
