import { test } from "node:test";
import assert from "node:assert/strict";
import {
  facingFor,
  legSeconds,
  MIN_SPEED_FACTOR,
  speedFactorAt,
} from "../src/navigation/walking.ts";

test("with no perspective, facing follows the larger screen distance", () => {
  assert.equal(facingFor(100, 60, 1), "right");
  assert.equal(facingFor(-100, 60, 1), "left");
  assert.equal(facingFor(40, 60, 1), "down");
  assert.equal(facingFor(40, -60, 1), "up");
});

test("on a deep stage, a leg that is mostly climbing faces away", () => {
  // 150px across, 60px up at 0.2 vertical speed: 300 'across-pixels' of
  // climbing against 150 across, so most of the time is spent going up.
  assert.equal(facingFor(150, -60, 0.2), "up");
  assert.equal(facingFor(150, 60, 0.2), "down");
  // Mostly across: still sideways.
  assert.equal(facingFor(300, -20, 0.2), "right");
});

test("ties face sideways", () => {
  assert.equal(facingFor(100, 20, 0.2), "right");
});

test("a leg takes as long as its slower axis", () => {
  assert.equal(legSeconds(180, 0, 180, 0.2), 1);
  assert.equal(legSeconds(0, 36, 180, 0.2), 1);
  assert.equal(legSeconds(90, 36, 180, 0.2), 1);
});

const street = {
  minY: 600,
  maxY: 740,
  minScale: 50 / 144,
  maxScale: 236 / 144,
};

test("walking speed follows the character's size", () => {
  assert.equal(speedFactorAt(street, 740), 1);
  const middle = speedFactorAt(street, 670);
  assert.ok(middle > 0.5 && middle < 0.7, `middle ${middle}`);
  // Never slower than the minimum, even at the far end.
  assert.equal(speedFactorAt(street, 600), MIN_SPEED_FACTOR);
  // Smaller further away.
  for (let y = 600; y < 740; y += 10) {
    assert.ok(speedFactorAt(street, y) <= speedFactorAt(street, y + 10));
  }
});

test("a stage with a constant size, or none, walks at full speed", () => {
  const shop = { minY: 613, maxY: 772, minScale: 1.8, maxScale: 1.8 };
  assert.equal(speedFactorAt(shop, 650), 1);
  assert.equal(speedFactorAt(undefined, 650), 1);
});
