import { Application } from "pixi.js";
import { GameConfig, GameState } from "./types";

export class Game {
  private app!: Application;
  private gameContainer!: HTMLElement;
  private scale: number = 1;

  private readonly config: GameConfig = {
    gameWidth: 320,
    gameHeight: 200,
    backgroundColor: 0x000022,
    targetFPS: 60,
  };

  private gameState: GameState = {
    currentAction: "walk",
    isRunning: false,
    lastUpdateTime: 0,
  };

  async initialize(): Promise<void> {
    await this.setupApplication();
    this.setupCanvas();
    this.startGameLoop();
  }

  private async setupApplication(): Promise<void> {
    this.app = new Application();

    await this.app.init({
      width: this.config.gameWidth,
      height: this.config.gameHeight,
      backgroundColor: this.config.backgroundColor,
      antialias: false,
      resolution: 1,
      autoDensity: false,
    });

    this.gameContainer = document.getElementById("pixi-container")!;
    this.gameContainer.appendChild(this.app.canvas);
  }

  private setupCanvas(): void {
    const canvas = this.app.canvas;

    canvas.style.imageRendering = "pixelated";
    canvas.style.imageRendering = "crisp-edges";
    canvas.style.display = "block";

    this.calculateScale();
    this.updateCanvasScale();

    window.addEventListener("resize", () => {
      this.calculateScale();
      this.updateCanvasScale();
    });
  }

  private calculateScale(): void {
    const containerRect = this.gameContainer.getBoundingClientRect();
    const scaleX = Math.floor(containerRect.width / this.config.gameWidth);
    const scaleY = Math.floor(containerRect.height / this.config.gameHeight);

    this.scale = Math.max(1, Math.min(scaleX, scaleY));
  }

  private updateCanvasScale(): void {
    const canvas = this.app.canvas;
    const scaledWidth = this.config.gameWidth * this.scale;
    const scaledHeight = this.config.gameHeight * this.scale;

    canvas.style.width = `${scaledWidth}px`;
    canvas.style.height = `${scaledHeight}px`;
    canvas.style.margin = "auto";
  }

  private startGameLoop(): void {
    this.gameState.isRunning = true;
    this.gameState.lastUpdateTime = performance.now();

    const gameLoop = (currentTime: number) => {
      if (!this.gameState.isRunning) return;

      // const deltaTime = (currentTime - this.gameState.lastUpdateTime) / 1000;
      this.gameState.lastUpdateTime = currentTime;

      this.update();
      this.render();

      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
  }

  private update(): void {
    // Game update logic will be added in future tasks
    // deltaTime parameter will be added when movement system is implemented
  }

  private render(): void {
    // Additional rendering logic will be added in future tasks
    // PixiJS handles the main rendering automatically
  }

  getScale(): number {
    return this.scale;
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }
}
