import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BLINK_MS,
  FIDGET_LENGTH_MS,
  IdleAnimator,
  NPC_IDLE,
  PLAYER_IDLE,
  seedFrom,
  type IdleState,
} from "../src/IdleAnimation.ts";

/** Run an animator from t=0 for `ms`, sampling every 10ms. */
function run(animator: IdleAnimator, ms: number): IdleState[] {
  animator.reset(0);
  return Array.from({ length: ms / 10 }, (_, i) => animator.frameAt(i * 10));
}

const isFidget = (s: IdleState) =>
  s.faceCamera || s.frame === "talk3" || s.frame === "sigh";

test("starts plain idle", () => {
  const a = new IdleAnimator(PLAYER_IDLE, 1);
  a.reset(0);
  assert.deepEqual(a.frameAt(0), { frame: "idle", faceCamera: false });
});

test("everyone blinks every few seconds, briefly", () => {
  const states = run(new IdleAnimator(NPC_IDLE, 3), 60_000);
  const blinkSamples = states.filter((s) => s.frame === "blink").length;
  // Roughly one 140ms blink every 2.5-6s => ~2-6% of the time.
  const fraction = blinkSamples / states.length;
  assert.ok(fraction > 0.01 && fraction < 0.08, `blink fraction ${fraction}`);
  // No blink lasts longer than one blink (allowing for a double blink gap).
  let run_ = 0;
  for (const s of states) {
    run_ = s.frame === "blink" ? run_ + 10 : 0;
    assert.ok(run_ <= BLINK_MS + 10, `blink lasted ${run_}ms`);
  }
});

test("the player does not fidget during the first 7 seconds still", () => {
  const states = run(new IdleAnimator(PLAYER_IDLE, 5), 7000);
  assert.ok(!states.some(isFidget));
});

test("the player fidgets once they have been still for a while", () => {
  const states = run(new IdleAnimator(PLAYER_IDLE, 5), 30_000);
  assert.ok(states.slice(750).some(isFidget));
});

test("NPCs fidget within the first few seconds and keep doing so", () => {
  const states = run(new IdleAnimator(NPC_IDLE, 9), 60_000);
  const firstFidget = states.findIndex(isFidget) * 10;
  assert.ok(
    firstFidget >= 1500 && firstFidget <= 6000,
    `first at ${firstFidget}`,
  );
  // Count separate fidgets.
  let count = 0;
  states.forEach((s, i) => {
    if (isFidget(s) && (i === 0 || !isFidget(states[i - 1]))) count++;
  });
  assert.ok(count >= 4, `only ${count} fidgets in a minute`);
});

test("every fidget type appears and none repeats back to back", () => {
  const states = run(new IdleAnimator(NPC_IDLE, 21), 180_000);
  const kinds: string[] = [];
  states.forEach((s, i) => {
    const kind = s.faceCamera
      ? "look"
      : s.frame === "talk3"
        ? "wrist"
        : s.frame === "sigh"
          ? "sigh"
          : null;
    const prev = states[i - 1];
    const prevKind = !prev
      ? null
      : prev.faceCamera
        ? "look"
        : prev.frame === "talk3"
          ? "wrist"
          : prev.frame === "sigh"
            ? "sigh"
            : null;
    if (kind && kind !== prevKind) kinds.push(kind);
  });
  assert.deepEqual([...new Set(kinds)].sort(), ["look", "sigh", "wrist"]);
  for (let i = 1; i < kinds.length; i++)
    assert.notEqual(kinds[i], kinds[i - 1]);
});

test("fidgets last as long as configured", () => {
  const states = run(new IdleAnimator(NPC_IDLE, 4), 60_000);
  const start = states.findIndex((s) => s.frame === "sigh");
  if (start >= 0) {
    const end = states.findIndex((s, i) => i > start && s.frame !== "sigh");
    const ms = (end - start) * 10;
    assert.ok(Math.abs(ms - FIDGET_LENGTH_MS.sigh) <= 20, `sigh ${ms}ms`);
  }
});

test("looking at the camera includes a blink", () => {
  const states = run(new IdleAnimator(NPC_IDLE, 21), 120_000);
  assert.ok(states.some((s) => s.faceCamera && s.frame === "blink"));
});

test("reset restarts the player's wait", () => {
  const a = new IdleAnimator(PLAYER_IDLE, 5);
  a.reset(0);
  for (let t = 0; t < 6000; t += 10) a.frameAt(t);
  a.reset(6000); // walked somewhere, stopped again
  for (let t = 6000; t < 13_000; t += 10)
    assert.ok(!isFidget(a.frameAt(t)), `fidget at ${t}`);
});

test("the same seed gives the same animation; different seeds differ", () => {
  const a = run(new IdleAnimator(NPC_IDLE, 42), 30_000);
  const b = run(new IdleAnimator(NPC_IDLE, 42), 30_000);
  const c = run(new IdleAnimator(NPC_IDLE, 43), 30_000);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test("seedFrom gives NPCs distinct stable seeds", () => {
  assert.equal(seedFrom("bartender"), seedFrom("bartender"));
  assert.notEqual(seedFrom("bartender"), seedFrom("street-vendor"));
});
