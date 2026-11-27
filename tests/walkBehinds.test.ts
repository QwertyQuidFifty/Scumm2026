import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BACKGROUND_OFFSET_Y,
  coveringScenery,
  cutPolygon,
  polygonBounds,
  SHOP_COUNTER,
  walkBehindCovers,
  walkBehindsForStage,
} from "../src/effects/walkBehinds.ts";

/** A w x h RGBA image where each pixel's red channel is its x and green its y. */
function gradient(w: number, h: number): number[] {
  const px: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) px.push(x, y, 100, 255);
  }
  return px;
}

test("cutPolygon keeps pixels inside the polygon and clears the rest", () => {
  // A right triangle covering the lower-left half of a 10x10 box.
  const triangle = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  const cut = cutPolygon(gradient(10, 10), 10, 10, triangle);
  assert.equal(cut.width, 10);
  assert.equal(cut.height, 10);
  const alpha = (x: number, y: number) => cut.data[(y * 10 + x) * 4 + 3];
  assert.equal(alpha(1, 8), 255); // below the diagonal
  assert.equal(alpha(8, 1), 0); // above it
  // Copied pixels keep their colour.
  const i = (8 * 10 + 1) * 4;
  assert.deepEqual([...cut.data.slice(i, i + 3)], [1, 8, 100]);
});

test("cutPolygon reports where the cut-out sits", () => {
  const square = [
    { x: 3, y: 4 },
    { x: 7, y: 4 },
    { x: 7, y: 9 },
    { x: 3, y: 9 },
  ];
  const cut = cutPolygon(gradient(20, 20), 20, 20, square);
  assert.deepEqual([cut.x, cut.y, cut.width, cut.height], [3, 4, 4, 5]);
  assert.ok(cut.data.every((v, k) => k % 4 !== 3 || v === 255));
});

test("cutPolygon clips to the image", () => {
  const big = [
    { x: -5, y: -5 },
    { x: 50, y: -5 },
    { x: 50, y: 50 },
    { x: -5, y: 50 },
  ];
  const cut = cutPolygon(gradient(8, 6), 8, 6, big);
  assert.deepEqual([cut.x, cut.y, cut.width, cut.height], [0, 0, 8, 6]);
});

test("the counter sits behind the whole shop floor", () => {
  // The shop's walkable floor starts at y=613, so the player is always in
  // front of the counter.
  assert.ok(SHOP_COUNTER.depthY < 613, `depth ${SHOP_COUNTER.depthY}`);
  const b = polygonBounds(SHOP_COUNTER.polygon);
  assert.equal(SHOP_COUNTER.depthY, b.y + b.h + BACKGROUND_OFFSET_Y);
});

test("the counter outline stays inside the background", () => {
  const b = polygonBounds(SHOP_COUNTER.polygon);
  assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1024 && b.y + b.h <= 768);
});

test("walk-behinds are looked up by stage", () => {
  assert.deepEqual(
    walkBehindsForStage("test-indoor").map((w) => w.id),
    ["shop-counter"],
  );
  assert.deepEqual(walkBehindsForStage("cyberpunk-street"), []);
});

// The shopkeeper stands behind the counter with its feet at y=525; the
// counter's depth line is 607 and its outline sits 40px lower on screen
// than in the background image.
const SHOPKEEPER_DEPTH = 525;

test("the counter covers its own area for things behind it", () => {
  // Middle of the counter's front, in game coordinates.
  assert.ok(coveringScenery("test-indoor", 435, 520, SHOPKEEPER_DEPTH));
  // The cash register on the left end too.
  assert.ok(coveringScenery("test-indoor", 300, 410, SHOPKEEPER_DEPTH));
});

test("the counter does not cover points above its top edge", () => {
  // The shopkeeper's head is above the counter top (y=434 on screen).
  assert.equal(
    coveringScenery("test-indoor", 435, 400, SHOPKEEPER_DEPTH),
    undefined,
  );
});

test("the counter never covers things in front of it", () => {
  // Something standing on the floor in front (depth 640) is not hidden.
  assert.equal(coveringScenery("test-indoor", 435, 520, 640), undefined);
});

test("walkBehindCovers accounts for the background offset", () => {
  // y=560 in the image is inside the counter; that is y=600 in game.
  assert.equal(walkBehindCovers(SHOP_COUNTER, 435, 600), true);
  assert.equal(walkBehindCovers(SHOP_COUNTER, 435, 620), false);
});

test("no scenery covers anything on the street", () => {
  assert.equal(coveringScenery("cyberpunk-street", 435, 520, 0), undefined);
});
