import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOpenDoorway,
  DOOR,
  DOOR_POLYGON,
} from "../src/overlays/openDoorway.ts";

const art = buildOpenDoorway();
const all = art.rows.join("");

test("rows are rectangular", () => {
  const widths = new Set(art.rows.map((r) => r.length));
  assert.equal(widths.size, 1);
});

test("every pixel uses a palette key or is transparent", () => {
  for (const key of all) {
    assert.ok(key === "." || key in art.palette, `unknown key "${key}"`);
  }
});

test("contains the frame, door leaf, lit interior, sign and pavement light", () => {
  for (const key of ["K", "D", "E", "a", "b", "c", "f", "n", "N", "L", "l"]) {
    assert.ok(all.includes(key), `missing "${key}"`);
  }
});

test("pavement light is translucent so the street shows through", () => {
  assert.ok(art.palette.L.alpha < 1 && art.palette.l.alpha < 1);
  assert.ok(art.palette.l.alpha < art.palette.L.alpha);
});

test("the doorway fills exactly the door polygon", () => {
  const P = art.pixelSize;
  const edgeAt = (x: number) => {
    const t = (x - DOOR.left) / (DOOR.right - DOOR.left);
    return {
      top: DOOR.topLeft + (DOOR.topRight - DOOR.topLeft) * t,
      bottom: DOOR.bottomLeft + (DOOR.bottomRight - DOOR.bottomLeft) * t,
    };
  };
  art.rows.forEach((row, r) => {
    [...row].forEach((key, c) => {
      const gx = art.x + c * P + P / 2;
      const gy = art.y + r * P + P / 2;
      const { top, bottom } = edgeAt(gx);
      const inside =
        gx >= DOOR.left && gx <= DOOR.right && gy >= top && gy < bottom;
      const isDoor = key !== "." && key !== "L" && key !== "l";
      assert.equal(isDoor, inside, `pixel (${gx}, ${gy}) key "${key}"`);
    });
  });
});

test("the clickable door uses the same polygon", () => {
  assert.deepEqual(DOOR_POLYGON, [
    { x: DOOR.left, y: DOOR.topLeft },
    { x: DOOR.right, y: DOOR.topRight },
    { x: DOOR.right, y: DOOR.bottomRight },
    { x: DOOR.left, y: DOOR.bottomLeft },
  ]);
});

test("stays inside the street scene", () => {
  const right = art.x + art.rows[0].length * art.pixelSize;
  const bottom = art.y + art.rows.length * art.pixelSize;
  assert.ok(art.x >= 0 && right <= 1024 && bottom <= 768);
});

test("light only appears below the doorway", () => {
  const firstLightRow = art.rows.findIndex((r) => /[Ll]/.test(r));
  const lastInteriorRow = art.rows.findLastIndex((r) => /[abc]/.test(r));
  assert.ok(firstLightRow > lastInteriorRow);
});
