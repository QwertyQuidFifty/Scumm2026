import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NPC_PALETTE_OVERRIDES,
  PLAYER_FRAMES,
  PLAYER_PALETTE,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  TRANSPARENT,
} from "../src/sprites/PlayerSprites.ts";

const DIRECTIONS = ["up", "down", "left", "right"] as const;
const FRAME_NAMES = ["idle", "walk1", "walk2", "walk3", "walk4"];

test("every direction has idle + 4 walk frames", () => {
  for (const dir of DIRECTIONS) {
    assert.deepEqual(
      PLAYER_FRAMES[dir].map((f) => f.name),
      FRAME_NAMES,
      dir,
    );
  }
});

test("every frame is exactly 32x48", () => {
  for (const dir of DIRECTIONS) {
    for (const frame of PLAYER_FRAMES[dir]) {
      assert.equal(frame.data.length, SPRITE_HEIGHT, `${dir}/${frame.name}`);
      frame.data.forEach((row, y) =>
        assert.equal(row.length, SPRITE_WIDTH, `${dir}/${frame.name} row ${y}`),
      );
    }
  }
});

test("every pixel uses a defined palette key", () => {
  for (const dir of DIRECTIONS) {
    for (const frame of PLAYER_FRAMES[dir]) {
      frame.data.forEach((row, y) => {
        for (const key of row) {
          assert.ok(
            key === TRANSPARENT || key in PLAYER_PALETTE,
            `${dir}/${frame.name} row ${y}: unknown colour key "${key}"`,
          );
        }
      });
    }
  }
});

test("NPC overrides only recolour existing palette keys", () => {
  for (const [npc, overrides] of Object.entries(NPC_PALETTE_OVERRIDES)) {
    for (const key of Object.keys(overrides)) {
      assert.ok(key in PLAYER_PALETTE, `${npc}: unknown key "${key}"`);
    }
  }
});

test("walk frames differ from idle and from each other", () => {
  for (const dir of DIRECTIONS) {
    const joined = PLAYER_FRAMES[dir].map((f) => f.data.join("\n"));
    assert.equal(new Set(joined).size, joined.length, dir);
  }
});

test("feet touch the ground line in every frame", () => {
  for (const dir of DIRECTIONS) {
    for (const frame of PLAYER_FRAMES[dir]) {
      const lowest = frame.data.findLastIndex((row) => /[^0]/.test(row));
      assert.equal(lowest, 45, `${dir}/${frame.name}`); // sole row 44 + outline
    }
  }
});
