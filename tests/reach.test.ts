import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_MS,
  REACH_TOTAL_MS,
  reachFor,
  reachFrameAt,
} from "../src/ActionAnimation.ts";

test("use and open reach out; get reaches down; other actions don't reach", () => {
  assert.equal(reachFor("use"), "reach");
  assert.equal(reachFor("open"), "reach");
  assert.equal(reachFor("get"), "reachLow");
  for (const a of ["walk", "look", "talk"]) assert.equal(reachFor(a), null);
});

test("a reach raises the arm, holds, eases back and ends", () => {
  assert.equal(reachFrameAt("reach", 0), "talk3");
  assert.equal(reachFrameAt("reach", 300), "reach");
  assert.equal(reachFrameAt("reach", 600), "talk3");
  assert.equal(reachFrameAt("reach", REACH_TOTAL_MS), null);
});

test("reaching down crouches on the way", () => {
  assert.equal(reachFrameAt("reachLow", 0), "sigh");
  assert.equal(reachFrameAt("reachLow", 300), "reachLow");
  assert.equal(reachFrameAt("reachLow", 600), "sigh");
});

test("the hand is fully out at the moment of contact", () => {
  assert.equal(reachFrameAt("reach", CONTACT_MS), "reach");
  assert.equal(reachFrameAt("reachLow", CONTACT_MS), "reachLow");
});

test("the whole reach is quick", () => {
  assert.ok(REACH_TOTAL_MS <= 800);
  for (let t = REACH_TOTAL_MS; t < REACH_TOTAL_MS + 500; t += 50) {
    assert.equal(reachFrameAt("reach", t), null);
  }
});
