/**
 * Walk-behinds: parts of a background picture (a counter, a pillar) that
 * are redrawn on top of characters standing behind them.
 *
 * Each walk-behind is a polygon in background coordinates (the 1024x768
 * area the background is drawn into). At runtime its pixels are cut out of
 * the background texture and drawn as a separate layer whose depth line is
 * the object's base on the floor: characters whose feet are above that line
 * are drawn behind it, everyone else in front.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */

export interface Point {
  x: number;
  y: number;
}

export interface WalkBehind {
  id: string;
  stageId: string;
  /** Outline in background coordinates. */
  polygon: Point[];
  /** Depth line in game (world) coordinates: the object's base on the floor. */
  depthY: number;
}

/** The background is drawn this far down the screen (below the action bar). */
export const BACKGROUND_OFFSET_Y = 40;

/** The shop counter's front and the cash register on its left end. */
export const SHOP_COUNTER: WalkBehind = {
  id: "shop-counter",
  stageId: "test-indoor",
  polygon: [
    { x: 262, y: 356 }, // register, top-left
    { x: 353, y: 356 },
    { x: 353, y: 394 },
    { x: 643, y: 394 }, // counter top, right end
    { x: 643, y: 423 },
    { x: 627, y: 423 },
    { x: 627, y: 567 }, // base, right
    { x: 247, y: 567 }, // base, left
    { x: 247, y: 423 },
    { x: 233, y: 423 },
    { x: 233, y: 394 }, // counter top, left end
    { x: 262, y: 394 },
  ],
  depthY: 567 + BACKGROUND_OFFSET_Y,
};

export const WALK_BEHINDS: WalkBehind[] = [SHOP_COUNTER];

export function walkBehindsForStage(stageId: string): WalkBehind[] {
  return WALK_BEHINDS.filter((w) => w.stageId === stageId);
}

function inside(p: Point, polygon: Point[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    ) {
      hit = !hit;
    }
  }
  return hit;
}

/** Bounding box of a polygon, in whole pixels. */
export function polygonBounds(polygon: Point[]): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const x = Math.floor(Math.min(...xs));
  const y = Math.floor(Math.min(...ys));
  return {
    x,
    y,
    w: Math.ceil(Math.max(...xs)) - x,
    h: Math.ceil(Math.max(...ys)) - y,
  };
}

/**
 * Copy the pixels of an RGBA image that fall inside a polygon (given in
 * image pixels). Returns RGBA for the polygon's bounding box, transparent
 * outside the polygon.
 */
export function cutPolygon(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
  polygon: Point[],
): {
  data: Uint8ClampedArray;
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const b = polygonBounds(polygon);
  const x0 = Math.max(0, b.x);
  const y0 = Math.max(0, b.y);
  const x1 = Math.min(width, b.x + b.w);
  const y1 = Math.min(height, b.y + b.h);
  const w = Math.max(0, x1 - x0);
  const h = Math.max(0, y1 - y0);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside({ x: x0 + x + 0.5, y: y0 + y + 0.5 }, polygon)) continue;
      const src = ((y0 + y) * width + (x0 + x)) * 4;
      const dst = (y * w + x) * 4;
      data[dst] = pixels[src];
      data[dst + 1] = pixels[src + 1];
      data[dst + 2] = pixels[src + 2];
      data[dst + 3] = 255;
    }
  }
  return { data, x: x0, y: y0, width: w, height: h };
}

/** Does a walk-behind cover a point given in game (world) coordinates? */
export function walkBehindCovers(w: WalkBehind, x: number, y: number): boolean {
  return inside({ x, y: y - BACKGROUND_OFFSET_Y }, w.polygon);
}

/**
 * The scenery drawn in front of something whose depth line is `depthY`
 * that covers the point (x, y) in game coordinates, if any. Clicks at that
 * point belong to the scenery, not to whatever is behind it.
 */
export function coveringScenery(
  stageId: string,
  x: number,
  y: number,
  depthY: number,
): WalkBehind | undefined {
  return walkBehindsForStage(stageId).find(
    (w) => w.depthY > depthY && walkBehindCovers(w, x, y),
  );
}
