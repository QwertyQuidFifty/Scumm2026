import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GESTURE_PHASE_MS,
  MOUTH_PATTERN,
  MOUTH_STEP_MS,
  talkFrameAt,
} from "../src/TalkAnimation.ts";

test("talking starts with the mouth open and no gesture", () => {
  assert.equal(talkFrameAt(0), "talk1");
});

test("the mouth follows the flap pattern during the rest phase", () => {
  MOUTH_PATTERN.forEach((open, i) => {
    const t = i * MOUTH_STEP_MS + 1;
    if (t >= GESTURE_PHASE_MS) return;
    assert.equal(talkFrameAt(t), open ? "talk1" : "idle", `step ${i}`);
  });
});

test("the gesture phase alternates with the rest phase", () => {
  const inGesture = (t: number) => ["talk2", "talk3"].includes(talkFrameAt(t));
  assert.equal(inGesture(GESTURE_PHASE_MS - 1), false);
  assert.equal(inGesture(GESTURE_PHASE_MS + 1), true);
  assert.equal(inGesture(2 * GESTURE_PHASE_MS + 1), false);
});

test("a long speech uses all four poses and opens the mouth often", () => {
  const frames = Array.from({ length: 600 }, (_, i) => talkFrameAt(i * 10));
  assert.deepEqual([...new Set(frames)].sort(), [
    "idle",
    "talk1",
    "talk2",
    "talk3",
  ]);
  const open = frames.filter((f) => f === "talk1" || f === "talk2").length;
  assert.ok(open / frames.length > 0.3 && open / frames.length < 0.7);
});

test("negative elapsed time is treated as the start", () => {
  assert.equal(talkFrameAt(-50), talkFrameAt(0));
});
