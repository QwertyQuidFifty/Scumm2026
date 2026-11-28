/**
 * Pixel art for the golden key, used both lying on the street and as its
 * inventory icon.
 *
 * The key is a ring bow, a collar, a shaft and a notched bit, outlined in
 * dark brown and shaded in four golds with ordered dithering: lit from the
 * top-left, with bright upper edges and dark lower ones, so it reads as a
 * small rounded metal object at a glance.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */
import type { PixelArtColour, PixelArtImage } from "../overlays/openDoorway.ts";
import { ditherKey } from "./dither.ts";

/** Art grid size (including the outline). */
export const KEY_COLS = 24;
export const KEY_ROWS = 12;

const PALETTE: Record<string, PixelArtColour> = {
  o: { color: 0x2a1600, alpha: 1 }, // outline
  "1": { color: 0x6e4206, alpha: 1 }, // gold, deep shadow
  "2": { color: 0xb07a10, alpha: 1 }, // gold, shadow
  "3": { color: 0xe8b828, alpha: 1 }, // gold
  "4": { color: 0xfff0a0, alpha: 1 }, // gold, highlight
  w: { color: 0xffffff, alpha: 1 }, // glint
};

const GOLD = ["1", "2", "3", "4"] as const;

/** Is grid cell (x, y) part of the key's metal? */
function isMetal(x: number, y: number): boolean {
  // Ring bow with a hole through it.
  const dx = x - 5.5;
  const dy = y - 5.5;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= 4.6 && dist >= 1.8) return true;
  // Collar where the bow meets the shaft.
  if (x >= 10 && x <= 11 && y >= 3 && y <= 8) return true;
  // Shaft.
  if (x >= 12 && x <= 21 && y >= 4 && y <= 6) return true;
  // Bit, with notches cut into it.
  if (x >= 15 && x <= 20 && y >= 7 && y <= 9) {
    if (x === 17 && y >= 8) return false;
    if (x === 19 && y === 9) return false;
    return true;
  }
  return false;
}

function keyPixel(x: number, y: number): string {
  if (!isMetal(x, y)) {
    const touches =
      isMetal(x - 1, y) ||
      isMetal(x + 1, y) ||
      isMetal(x, y - 1) ||
      isMetal(x, y + 1);
    return touches ? "o" : ".";
  }
  if (x === 3 && y === 2) return "w"; // glint on the bow

  // Light from the top-left; bevel the edges.
  let shade = 0.78 - (y / KEY_ROWS) * 0.45 - (x / KEY_COLS) * 0.15;
  if (!isMetal(x, y - 1)) shade += 0.35;
  if (!isMetal(x, y + 1)) shade -= 0.35;
  if (!isMetal(x - 1, y)) shade += 0.1;
  if (!isMetal(x + 1, y)) shade -= 0.1;
  return ditherKey(shade, GOLD, x, y);
}

/** Build the golden key art, `pixelSize` units per art pixel. */
export function buildKeyArt(pixelSize = 2): PixelArtImage {
  const rows: string[] = [];
  for (let y = 0; y < KEY_ROWS; y++) {
    let row = "";
    for (let x = 0; x < KEY_COLS; x++) row += keyPixel(x, y);
    rows.push(row);
  }
  return { x: 0, y: 0, pixelSize, rows, palette: PALETTE };
}
