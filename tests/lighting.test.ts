import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lightAt,
  lightingForStage,
  SHOP_LIGHTING,
  STREET_LIGHTING,
  zoneWeight,
  type LightZone,
  type StageLighting,
} from "../src/effects/lighting.ts";

const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const brightness = (c: number) => rgb(c).reduce((a, b) => a + b, 0);

const red: LightZone = {
  name: "red",
  x: 100,
  y: 100,
  rx: 50,
  ry: 20,
  color: 0xff0000,
  strength: 1,
};
const simple: StageLighting = { ambient: 0x808080, zones: [red] };

test("outside every zone a character takes the ambient light", () => {
  assert.equal(lightAt(simple, 500, 500), 0x808080);
  assert.equal(zoneWeight(red, 151, 100), 0);
  assert.equal(zoneWeight(red, 100, 121), 0);
});

test("at a zone's centre its colour applies at full strength", () => {
  assert.equal(lightAt(simple, 100, 100), 0xff0000);
  const half: StageLighting = {
    ambient: 0x000000,
    zones: [{ ...red, strength: 0.5 }],
  };
  assert.deepEqual(rgb(lightAt(half, 100, 100)), [128, 0, 0]);
});

test("light fades smoothly from the centre to the edge", () => {
  let previous = Infinity;
  for (let x = 100; x <= 150; x += 2) {
    const w = zoneWeight(red, x, 100);
    assert.ok(w <= previous, `weight rises at x=${x}`);
    previous = w;
  }
  // No sudden step between neighbouring positions.
  for (let x = 100; x < 160; x++) {
    const a = rgb(lightAt(simple, x, 100));
    const b = rgb(lightAt(simple, x + 1, 100));
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(a[i] - b[i]) <= 12);
  }
});

test("zones are flat ellipses: the light reaches further sideways", () => {
  assert.ok(zoneWeight(red, 130, 100) > 0);
  assert.equal(zoneWeight(red, 100, 130), 0);
});

test("both stages have lighting; other stages have none", () => {
  assert.equal(lightingForStage("cyberpunk-street"), STREET_LIGHTING);
  assert.equal(lightingForStage("test-indoor"), SHOP_LIGHTING);
  assert.equal(lightingForStage("nowhere"), undefined);
});

test("on the street, characters are pinker under the BAR sign and darker in the near corner", () => {
  const underBar = rgb(lightAt(STREET_LIGHTING, 680, 640));
  assert.ok(underBar[0] > underBar[1] + 40, "pink under the BAR sign");
  const corner = lightAt(STREET_LIGHTING, 20, 790);
  const open = lightAt(STREET_LIGHTING, 480, 700);
  assert.ok(brightness(corner) < brightness(open) - 120, "darker corner");
});

test("in the shop the counter light is the brightest spot", () => {
  const counter = brightness(lightAt(SHOP_LIGHTING, 440, 630));
  const front = brightness(lightAt(SHOP_LIGHTING, 300, 760));
  assert.ok(counter > front + 150);
});

test("lighting never brightens a character past how they were drawn", () => {
  for (const lighting of [STREET_LIGHTING, SHOP_LIGHTING]) {
    for (let x = 0; x <= 1024; x += 32) {
      for (let y = 600; y <= 810; y += 10) {
        for (const v of rgb(lightAt(lighting, x, y))) {
          assert.ok(v >= 0 && v <= 255);
        }
      }
    }
  }
});
