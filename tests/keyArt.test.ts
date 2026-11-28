import { test } from "node:test";
import assert from "node:assert/strict";
import { buildKeyArt, KEY_COLS, KEY_ROWS } from "../src/sprites/keyArt.ts";
import { bayerThreshold, ditherLevel } from "../src/sprites/dither.ts";

test("dithering returns the exact level at the ends and mixes in between", () => {
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      assert.equal(ditherLevel(0, 4, x, y), 0);
      assert.equal(ditherLevel(1, 4, x, y), 3);
    }
  }
  // Halfway between level 1 and 2: half of a 4x4 tile is each.
  let upper = 0;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const level = ditherLevel(0.5, 4, x, y);
      assert.ok(level === 1 || level === 2);
      if (level === 2) upper++;
    }
  }
  assert.equal(upper, 8);
});

test("Bayer thresholds cover the 4x4 tile evenly", () => {
  const values = new Set<number>();
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) values.add(bayerThreshold(x, y));
  }
  assert.equal(values.size, 16);
  assert.equal(bayerThreshold(-1, -1), bayerThreshold(3, 3));
});

const key = buildKeyArt(2);

test("the key art is a rectangular grid of known colours", () => {
  assert.equal(key.rows.length, KEY_ROWS);
  for (const row of key.rows) {
    assert.equal(row.length, KEY_COLS);
    for (const c of row) assert.ok(c === "." || c in key.palette, c);
  }
});

test("the key fills its 48x24 click area at pixel size 2", () => {
  assert.equal(KEY_COLS * key.pixelSize, 48);
  assert.equal(KEY_ROWS * key.pixelSize, 24);
});

test("the key is outlined and shaded with every gold tone", () => {
  const all = key.rows.join("");
  for (const c of ["o", "1", "2", "3", "4"]) assert.ok(all.includes(c), c);
  // Metal never touches transparency directly: the outline sits between.
  key.rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === "." || c === "o") return;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const n = key.rows[y + dy]?.[x + dx] ?? ".";
        assert.notEqual(n, ".", `metal at (${x},${y}) touches empty`);
      }
    });
  });
});

test("the key's gold is dithered, not flat bands", () => {
  // Some gold pixel has horizontal neighbours of a different gold tone on
  // both sides that match each other: a checker pattern.
  const gold = new Set(["1", "2", "3", "4"]);
  let checkers = 0;
  for (const row of key.rows) {
    for (let x = 1; x < row.length - 1; x++) {
      const [a, b, c] = [row[x - 1], row[x], row[x + 1]];
      if (gold.has(a) && gold.has(b) && a === c && a !== b) checkers++;
    }
  }
  assert.ok(checkers >= 5, `only ${checkers} dithered pixels`);
});

test("a bigger pixel size scales the same picture", () => {
  const big = buildKeyArt(3);
  assert.deepEqual(big.rows, key.rows);
  assert.equal(big.pixelSize, 3);
});
