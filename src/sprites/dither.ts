/**
 * Ordered (Bayer) dithering for generated pixel art.
 *
 * A smooth shade between 0 and 1 is turned into one of a few palette
 * levels; in between two levels the pixels alternate in the classic 4x4
 * Bayer pattern, so gradients read as dithered bands like the painted
 * backgrounds.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Bayer threshold for a pixel, in (0, 1). */
export function bayerThreshold(x: number, y: number): number {
  const row = BAYER_4[((y % 4) + 4) % 4];
  return (row[((x % 4) + 4) % 4] + 0.5) / 16;
}

/**
 * Pick one of `levels` palette entries (0 = darkest) for a shade in
 * [0, 1] at pixel (x, y), dithering between the two nearest levels.
 */
export function ditherLevel(
  shade: number,
  levels: number,
  x: number,
  y: number,
): number {
  const scaled = Math.min(Math.max(shade, 0), 1) * (levels - 1);
  const base = Math.floor(scaled);
  if (base >= levels - 1) return levels - 1;
  return scaled - base > bayerThreshold(x, y) ? base + 1 : base;
}

/** Dither a shade onto a list of palette keys, darkest first. */
export function ditherKey(
  shade: number,
  keys: readonly string[],
  x: number,
  y: number,
): string {
  return keys[ditherLevel(shade, keys.length, x, y)];
}
