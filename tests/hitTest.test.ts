import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gridCellAt,
  hitsDrawnPixel,
  spriteHit,
  type SpriteGeometry,
} from "../src/sprites/hitTest.ts";
import { buildCharacterFrames } from "../src/sprites/compositor.ts";
import { CHARACTER_DESIGNS } from "../src/sprites/designs.ts";

// A character sprite as the game draws it: 96x144 texture (3x the 32x48
// grid), anchored bottom-centre, here at scale 1.5.
const sprite: SpriteGeometry = {
  x: 100,
  y: 500,
  anchorX: 0.5,
  anchorY: 1,
  textureWidth: 96,
  textureHeight: 144,
  scaleX: 1.5,
  scaleY: 1.5,
};
const cellSize = 3 * 1.5; // world units per grid pixel

/** World point at the centre of a grid cell. */
const worldOf = (col: number, row: number) => ({
  x: sprite.x - 48 * 1.5 + (col + 0.5) * cellSize,
  y: sprite.y - 144 * 1.5 + (row + 0.5) * cellSize,
});

test("gridCellAt maps world points back to grid cells", () => {
  for (const [col, row] of [
    [0, 0],
    [15, 30],
    [31, 47],
  ]) {
    const p = worldOf(col, row);
    assert.deepEqual(gridCellAt(sprite, p.x, p.y), { col, row });
  }
  // The anchor (bottom centre) is the boundary between columns 15 and 16.
  assert.deepEqual(gridCellAt(sprite, 100.01, 499.99), { col: 16, row: 47 });
});

test("hitsDrawnPixel respects the margin", () => {
  const rows = ["00000", "00X00", "00000"];
  assert.equal(hitsDrawnPixel(rows, 2, 1, 0), true);
  assert.equal(hitsDrawnPixel(rows, 3, 1, 0), false);
  assert.equal(hitsDrawnPixel(rows, 3, 2, 1), true); // diagonal neighbour
  assert.equal(hitsDrawnPixel(rows, 4, 1, 1), false); // two away
  assert.equal(hitsDrawnPixel(rows, -3, 9, 1), false); // off the grid
});

const maya = buildCharacterFrames(CHARACTER_DESIGNS.customer);

test("clicking Maya's body hits her in every direction", () => {
  for (const dir of ["down", "left", "right", "up"] as const) {
    const rows = maya[dir][0].data;
    // Find a drawn pixel in the middle of her torso.
    const row = 26;
    const col = [...rows[row]].findIndex((k) => k !== "0");
    assert.ok(col >= 0, dir);
    const p = worldOf(col + 1, row);
    assert.equal(spriteHit(rows, sprite, p.x, p.y), true, dir);
  }
});

test("the empty space around Maya is not clickable", () => {
  const rows = maya.right[0].data;
  // Top corners and the area beside her legs are empty.
  for (const [col, row] of [
    [1, 2],
    [30, 2],
    [1, 40],
    [30, 40],
  ]) {
    const p = worldOf(col, row);
    assert.equal(spriteHit(rows, sprite, p.x, p.y), false, `${col},${row}`);
  }
});

test("most of the sprite rectangle is not clickable", () => {
  // Maya fills only a small part of her 32x48 frame.
  const rows = maya.right[0].data;
  let hits = 0;
  for (let row = 0; row < 48; row++) {
    for (let col = 0; col < 32; col++) {
      const p = worldOf(col, row);
      if (spriteHit(rows, sprite, p.x, p.y)) hits++;
    }
  }
  const fraction = hits / (32 * 48);
  assert.ok(fraction < 0.45, `clickable fraction ${fraction.toFixed(2)}`);
});
