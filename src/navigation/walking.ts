/**
 * How a walk looks in a scene with perspective.
 *
 * On a deep stage, moving up the screen is moving away from the camera.
 * That is slower on screen (the stage's yFactor), so a leg that covers
 * more pixels across than up can still spend most of its time climbing.
 * The character should face the way most of the walking time goes.
 *
 * Far away, a character is drawn small, so to look like the same walking
 * pace it must also cover fewer screen pixels per second: speed scales
 * with the character's perspective size.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */

export type Facing = "up" | "down" | "left" | "right";

/**
 * Which way to face for a leg of (dx, dy) screen pixels, when vertical
 * movement runs at `yFactor` of the horizontal speed. Ties face sideways.
 */
export function facingFor(dx: number, dy: number, yFactor: number): Facing {
  const across = Math.abs(dx);
  const depth = Math.abs(dy) / yFactor;
  if (across >= depth) return dx >= 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/** Seconds a leg takes at full speed (both axes finish together). */
export function legSeconds(
  dx: number,
  dy: number,
  speed: number,
  yFactor: number,
): number {
  return Math.max(Math.abs(dx), Math.abs(dy) / yFactor) / speed;
}

export interface PerspectiveRange {
  minY: number;
  maxY: number;
  minScale: number;
  maxScale: number;
}

/** Slowest walk, as a fraction of full speed, so the far end isn't a crawl. */
export const MIN_SPEED_FACTOR = 0.35;

/**
 * Walking speed at screen height y, as a fraction of full speed: in
 * proportion to the character's size there, relative to its size at the
 * front of the stage (where it walks at full speed).
 */
export function speedFactorAt(
  range: PerspectiveRange | undefined,
  y: number,
): number {
  if (!range || range.maxScale <= 0) return 1;
  const clamped = Math.max(range.minY, Math.min(range.maxY, y));
  const t =
    range.maxY === range.minY
      ? 1
      : (clamped - range.minY) / (range.maxY - range.minY);
  const scale = range.minScale + t * (range.maxScale - range.minScale);
  const largest = Math.max(range.minScale, range.maxScale);
  return Math.max(MIN_SPEED_FACTOR, Math.min(1, scale / largest));
}
