import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildClosedShopDoor,
  SHOP_EXIT_DOOR,
  SHOP_EXIT_POLYGON,
} from "../src/overlays/closedDoor.ts";
import { isDoorOpen } from "../src/overlays/doorState.ts";

const art = buildClosedShopDoor();
const all = art.rows.join("");

test("rows are rectangular and use palette keys", () => {
  assert.equal(new Set(art.rows.map((r) => r.length)).size, 1);
  for (const key of all) {
    assert.ok(key === "." || key in art.palette, `unknown key "${key}"`);
  }
});

test("has a frame, window with neon glow, push bar, keypad light and kick plate", () => {
  for (const key of ["K", "D", "d", "g", "r", "R", "B", "L", "P"]) {
    assert.ok(all.includes(key), `missing "${key}"`);
  }
});

test("the steel and window glow are dithered between tones", () => {
  // Count pixels flanked left and right by the same, different tone.
  const pairs = (keys: string[]) => {
    let n = 0;
    for (const row of art.rows) {
      for (let x = 1; x < row.length - 1; x++) {
        const [a, b, c] = [row[x - 1], row[x], row[x + 1]];
        if (keys.includes(a) && keys.includes(b) && a === c && a !== b) n++;
      }
    }
    return n;
  };
  assert.ok(pairs(["d", "D", "E"]) >= 30, "steel");
  assert.ok(pairs(["g", "r", "R"]) >= 3, "window");
  assert.ok(pairs(["D", "n"]) >= 3, "neon spill");
});

test("the door fills exactly the exit door polygon", () => {
  const d = SHOP_EXIT_DOOR;
  const P = art.pixelSize;
  art.rows.forEach((row, r) => {
    [...row].forEach((key, c) => {
      const gx = art.x + c * P + P / 2;
      const gy = art.y + r * P + P / 2;
      const t = (gx - d.left) / (d.right - d.left);
      const top = d.topLeft + (d.topRight - d.topLeft) * t;
      const bottom = d.bottomLeft + (d.bottomRight - d.bottomLeft) * t;
      const inside = gx >= d.left && gx <= d.right && gy >= top && gy < bottom;
      assert.equal(key !== ".", inside, `pixel (${gx}, ${gy}) key "${key}"`);
    });
  });
});

test("the clickable exit door uses the same polygon", () => {
  const d = SHOP_EXIT_DOOR;
  assert.deepEqual(SHOP_EXIT_POLYGON, [
    { x: d.left, y: d.topLeft },
    { x: d.right, y: d.topRight },
    { x: d.right, y: d.bottomRight },
    { x: d.left, y: d.bottomLeft },
  ]);
});

test("the door is fully opaque so the painted open doorway is hidden", () => {
  for (const key of new Set(all.replace(/\./g, ""))) {
    assert.equal(art.palette[key].alpha, 1, key);
  }
});

test("door state follows what the overlay draws", () => {
  // Street entrance: overlay draws the open doorway.
  assert.equal(isDoorOpen("open", true), true);
  assert.equal(isDoorOpen("open", false), false);
  // Shop exit: overlay draws the closed door.
  assert.equal(isDoorOpen("closed", true), false);
  assert.equal(isDoorOpen("closed", false), true);
});
