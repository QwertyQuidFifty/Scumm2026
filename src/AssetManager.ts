import { Assets, Texture } from "pixi.js";

export interface AssetDefinition {
  name: string;
  url: string;
  type: "image" | "sprite" | "audio";
}

export class AssetManager {
  private loadedAssets: Map<string, Texture> = new Map();
  private loadingProgress: number = 0;
  private isLoading: boolean = false;

  private assets: AssetDefinition[] = [
    {
      name: "cyberpunk",
      url: "./assets/cyberpunk.png",
      type: "image",
    },
    {
      name: "mechstore",
      url: "./assets/mechstore-copilot.png",
      type: "image",
    },
  ];

  async loadAllAssets(): Promise<void> {
    this.isLoading = true;
    this.loadingProgress = 0;

    try {
      // Add all assets to the Assets loader first
      const assetUrls: Record<string, string> = {};
      for (const asset of this.assets) {
        assetUrls[asset.name] = asset.url;
        // Add individual assets to the loader
        Assets.add({ alias: asset.name, src: asset.url });
      }

      // Load all assets (PixiJS 8.x doesn't have the same progress API)
      const loadedTextures = await Assets.load(Object.keys(assetUrls));

      // Store loaded assets
      for (const [name, texture] of Object.entries(loadedTextures)) {
        if (texture instanceof Texture) {
          this.loadedAssets.set(name, texture);
        }
      }

      this.isLoading = false;
      this.loadingProgress = 100;
    } catch (error) {
      this.isLoading = false;
      console.error("Failed to load assets:", error);
      throw new Error(`Asset loading failed: ${error}`);
    }
  }

  async loadAsset(name: string, url: string): Promise<Texture> {
    try {
      // Check if already loaded
      if (this.loadedAssets.has(name)) {
        return this.loadedAssets.get(name)!;
      }

      // Load the asset
      const texture = await Assets.load(url);
      this.loadedAssets.set(name, texture);
      return texture;
    } catch (error) {
      console.error(`Failed to load asset ${name} from ${url}:`, error);
      throw new Error(`Failed to load asset ${name}: ${error}`);
    }
  }

  getAsset(name: string): Texture | undefined {
    return this.loadedAssets.get(name);
  }

  hasAsset(name: string): boolean {
    return this.loadedAssets.has(name);
  }

  getLoadingProgress(): number {
    return this.loadingProgress;
  }

  isAssetLoading(): boolean {
    return this.isLoading;
  }

  getAllLoadedAssets(): string[] {
    return Array.from(this.loadedAssets.keys());
  }

  addAssetDefinition(asset: AssetDefinition): void {
    this.assets.push(asset);
  }

  getAssetDefinitions(): AssetDefinition[] {
    return [...this.assets];
  }
}
