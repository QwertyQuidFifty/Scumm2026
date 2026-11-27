/**
 * The player's reach animation for Use, Get and Open.
 *
 * A short sequence: start to raise the arm (the half-reach "talk3" gesture
 * pose, or a slight crouch for Get), hold the full reach, then ease back.
 * Whatever the action does (a door opening, an item being picked up)
 * should happen at CONTACT_MS, when the hand is fully out.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */

/** reach: arm out (use / open). reachLow: crouch and reach down (get). */
export type ReachKind = "reach" | "reachLow";
export type ReachFrame = "talk3" | "sigh" | ReachKind;

/** When the hand is fully out: trigger the action's effect then. */
export const CONTACT_MS = 260;
const RAISE_MS = 110;
const HOLD_UNTIL_MS = 530;
/** Total length of the animation. */
export const REACH_TOTAL_MS = 650;

/** The frame to show `elapsedMs` into a reach, or null once it is over. */
export function reachFrameAt(
  kind: ReachKind,
  elapsedMs: number,
): ReachFrame | null {
  const halfway: ReachFrame = kind === "reachLow" ? "sigh" : "talk3";
  if (elapsedMs < 0) return halfway;
  if (elapsedMs < RAISE_MS) return halfway;
  if (elapsedMs < HOLD_UNTIL_MS) return kind;
  if (elapsedMs < REACH_TOTAL_MS) return halfway;
  return null;
}

/** Which reach an action uses, or null if it has none. */
export function reachFor(action: string): ReachKind | null {
  if (action === "get") return "reachLow";
  if (action === "use" || action === "open") return "reach";
  return null;
}
