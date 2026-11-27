import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractNeon,
  hash01,
  isNeon,
  NEON_SIGNS,
  neonBrightness,
  signsForStage,
  type NeonBehaviour,
} from "../src/effects/neonSigns.ts";

const sample = (behaviour: NeonBehaviour, seed: number, ms = 120_000) =>
  Array.from({ length: ms / 10 }, (_, i) =>
    neonBrightness(behaviour, i * 10, seed),
  );
const fractionOff = (values: number[]) =>
  values.filter((v) => v < 0.5).length / values.length;

test("neon colours are bright and saturated", () => {
  assert.equal(isNeon(240, 60, 140), true); // hot pink
  assert.equal(isNeon(40, 220, 230), true); // cyan
  assert.equal(isNeon(30, 30, 60), false); // dark wall
  assert.equal(isNeon(230, 230, 235), false); // white light, unsaturated
});

test("extractNeon keeps only neon pixels inside the rect", () => {
  // 4x2 image: pink, dark, cyan, grey / dark x4
  const px = [
    240, 60, 140, 255, 20, 20, 40, 255, 40, 220, 230, 255, 200, 200, 200, 255,
    10, 10, 10, 255, 10, 10, 10, 255, 10, 10, 10, 255, 10, 10, 10, 255,
  ];
  const out = extractNeon(px, 4, 2, { x: 0, y: 0, w: 3, h: 2 });
  assert.equal(out.width, 3);
  assert.equal(out.height, 2);
  assert.equal(out.count, 2);
  assert.deepEqual([...out.data.slice(0, 4)], [240, 60, 140, 255]);
  assert.equal(out.data[7], 0); // dark pixel transparent
  assert.deepEqual([...out.data.slice(8, 12)], [40, 220, 230, 255]);
});

test("extractNeon clips rects that run off the image", () => {
  const px = new Array(4 * 4 * 4).fill(0);
  const out = extractNeon(px, 4, 4, { x: 2, y: 2, w: 10, h: 10 });
  assert.equal(out.width, 2);
  assert.equal(out.height, 2);
});

test("brightness stays in range for every behaviour", () => {
  for (const b of ["pulse", "buzz", "broken", "fluorescent"] as const) {
    for (const v of sample(b, 7, 30_000)) {
      assert.ok(v >= 0 && v <= 1.2, `${b}: ${v}`);
    }
  }
});

test("brightness is deterministic for the same time and seed", () => {
  for (const t of [0, 1234, 98765]) {
    assert.equal(
      neonBrightness("broken", t, 7),
      neonBrightness("broken", t, 7),
    );
  }
});

test("pulsing signs never go dark", () => {
  assert.ok(Math.min(...sample("pulse", 3)) > 0.8);
});

test("buzzing signs flicker now and then but are mostly lit", () => {
  const values = sample("buzz", 5);
  const off = fractionOff(values);
  assert.ok(off > 0 && off < 0.05, `off ${off}`);
});

test("a broken letter cuts out noticeably but is lit most of the time", () => {
  const off = fractionOff(sample("broken", 7));
  assert.ok(off > 0.1 && off < 0.45, `off ${off}`);
});

test("the strip light flickers rarely", () => {
  const off = fractionOff(sample("fluorescent", 13));
  assert.ok(off > 0 && off < 0.02, `off ${off}`);
});

test("signs with different seeds don't flicker in sync", () => {
  const a = sample("buzz", 3, 60_000).map((v) => v < 0.5);
  const b = sample("buzz", 17, 60_000).map((v) => v < 0.5);
  assert.notDeepEqual(a, b);
});

test("hash01 is spread over [0, 1)", () => {
  const values = Array.from({ length: 1000 }, (_, i) => hash01(i));
  assert.ok(values.every((v) => v >= 0 && v < 1));
  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  assert.ok(Math.abs(mean - 0.5) < 0.05, `mean ${mean}`);
});

test("every sign has segments inside the background and a known stage", () => {
  for (const sign of NEON_SIGNS) {
    assert.ok(sign.segments.length > 0, sign.id);
    for (const { rect } of sign.segments) {
      assert.ok(rect.x >= 0 && rect.y >= 0, sign.id);
      assert.ok(rect.x + rect.w <= 1024 && rect.y + rect.h <= 768, sign.id);
    }
  }
  assert.equal(signsForStage("cyberpunk-street").length, 5);
  assert.equal(signsForStage("test-indoor").length, 3);
});

test("the HOTEL sign has one broken letter", () => {
  const hotel = NEON_SIGNS.find((s) => s.id === "hotel")!;
  assert.equal(hotel.segments.length, 5);
  assert.equal(
    hotel.segments.filter((s) => s.behaviour === "broken").length,
    1,
  );
});
