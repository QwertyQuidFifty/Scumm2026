/**
 * Pixel art for the shop's exit door when closed.
 *
 * The shop background paints this doorway open (the street's red neon
 * shows through), so a closed steel security door is drawn over it: dark
 * frame, a small barred window glowing with the neon outside, recessed
 * panels, a push bar, a green keypad light and a kick plate. The art is
 * generated to fill exactly the door's clickable polygon, at the
 * background's 4-unit pixel size.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */
import type { PixelArtColour, PixelArtImage } from "./openDoorway.ts";
import { ditherKey } from "../sprites/dither.ts";

const PIXEL = 4;

/**
 * The shop's exit door (game coordinates): vertical sides, with the top
 * rising and the bottom falling towards the right. Both edges follow the
 * wall's perspective and meet near the room's eye level (about y=406) far
 * to the left, matching the painted door frame.
 */
export const SHOP_EXIT_DOOR = {
  left: 856,
  right: 923,
  topLeft: 258,
  topRight: 228,
  bottomLeft: 599,
  bottomRight: 638,
};

/** The exit door as a polygon (clockwise from top-left), for hit-testing. */
export const SHOP_EXIT_POLYGON = [
  { x: SHOP_EXIT_DOOR.left, y: SHOP_EXIT_DOOR.topLeft },
  { x: SHOP_EXIT_DOOR.right, y: SHOP_EXIT_DOOR.topRight },
  { x: SHOP_EXIT_DOOR.right, y: SHOP_EXIT_DOOR.bottomRight },
  { x: SHOP_EXIT_DOOR.left, y: SHOP_EXIT_DOOR.bottomLeft },
];

const PALETTE: Record<string, PixelArtColour> = {
  K: { color: 0x0a0c16, alpha: 1 }, // frame / deep shadow
  H: { color: 0x323c5e, alpha: 1 }, // lit edge of the door
  E: { color: 0x252c4a, alpha: 1 }, // steel, catching the light
  D: { color: 0x191e33, alpha: 1 }, // steel door
  d: { color: 0x0f1324, alpha: 1 }, // steel in shadow / panel recess
  n: { color: 0x3a1a34, alpha: 1 }, // steel tinted by the neon window
  Q: { color: 0x323a5c, alpha: 1 }, // kick plate, top edge
  P: { color: 0x222842, alpha: 1 }, // kick plate
  p: { color: 0x151a2e, alpha: 1 }, // kick plate, scuffed / shadow
  g: { color: 0x2a1022, alpha: 1 }, // window glass (dark)
  r: { color: 0xc0302c, alpha: 1 }, // neon glow through the window
  R: { color: 0xff6a4a, alpha: 1 }, // neon hot spot
  B: { color: 0x646e86, alpha: 1 }, // push bar
  b: { color: 0x2c3346, alpha: 1 }, // push bar shadow
  L: { color: 0x40ff80, alpha: 1 }, // keypad light
};

/** Steel tones, darkest first, dithered for the door's shading. */
const STEEL = ["d", "D", "E"] as const;
const WINDOW = ["g", "r", "R"] as const;
const PLATE = ["p", "P", "Q"] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function edgesAt(x: number): { top: number; bottom: number } {
  const d = SHOP_EXIT_DOOR;
  const t = (x - d.left) / (d.right - d.left);
  return {
    top: lerp(d.topLeft, d.topRight, t),
    bottom: lerp(d.bottomLeft, d.bottomRight, t),
  };
}

/**
 * Classify one art pixel by the game-space point at its centre; (c, r)
 * is its position in the art grid, which sets the dither pattern.
 */
function pixelAt(gx: number, gy: number, c: number, r: number): string {
  const d = SHOP_EXIT_DOOR;
  if (gx < d.left || gx > d.right) return ".";
  const { top, bottom } = edgesAt(gx);
  if (gy < top || gy >= bottom) return ".";

  // Frame around the door leaf.
  if (gx < d.left + PIXEL || gx > d.right - PIXEL || gy < top + PIXEL) {
    return "K";
  }

  const u = (gx - d.left) / (d.right - d.left); // 0 hinge side .. 1 far side
  const v = (gy - top) / (bottom - top); // 0 top .. 1 floor

  // The edge nearest the room catches a little light, fading downwards.
  if (gx < d.left + 2 * PIXEL) {
    return ditherKey(1 - v * 0.9, ["E", "H"], c, r);
  }

  // Barred window with the street's red neon glowing through: brightest
  // at a hot spot, dithering out to dark glass at the edges.
  if (u >= 0.3 && u < 0.8 && v >= 0.08 && v < 0.27) {
    if (v < 0.1 || v >= 0.25 || u < 0.34 || u >= 0.76) return "K";
    if (Math.abs(u - 0.55) < 0.04) return "K"; // centre bar
    const du = (u - 0.66) / 0.3;
    const dv = (v - 0.165) / 0.09;
    const glow = 1.05 - Math.sqrt(du * du + dv * dv) * 0.75;
    return ditherKey(glow, WINDOW, c, r);
  }

  // Push bar with its shadow.
  if (u >= 0.18 && u < 0.86) {
    if (v >= 0.5 && v < 0.53) return "B";
    if (v >= 0.53 && v < 0.55) return "b";
  }

  // Keypad light by the latch.
  if (u >= 0.82 && u < 0.9 && v >= 0.42 && v < 0.45) return "L";

  // Kick plate along the bottom: lit top edge, scuffed towards the floor.
  if (v >= 0.9) {
    if (v < 0.915) return "Q";
    return ditherKey(0.75 - (v - 0.9) * 6, PLATE, c, r);
  }

  // Recessed panels (outlines) above and below the push bar.
  const inPanelX = u >= 0.22 && u < 0.82;
  const panelOutline = (v0: number, v1: number) =>
    inPanelX &&
    v >= v0 &&
    v < v1 &&
    (v < v0 + 0.02 || v >= v1 - 0.02 || u < 0.27 || u >= 0.77);
  if (panelOutline(0.31, 0.47) || panelOutline(0.6, 0.86)) return "d";
  const inPanel =
    inPanelX &&
    u >= 0.27 &&
    u < 0.77 &&
    ((v >= 0.33 && v < 0.45) || (v >= 0.62 && v < 0.84));

  // Steel shading: lighter at the top and towards the hinge (the room's
  // light), darker towards the floor and the far edge; panel faces sit a
  // little deeper.
  let shade = 0.92 - v * 0.45 - u * 0.18;
  if (inPanel) shade -= 0.1;
  const key = ditherKey(shade, STEEL, c, r);

  // Red neon from the window spills onto the steel just below it.
  if (u >= 0.3 && u < 0.8 && v >= 0.27 && v < 0.4) {
    const spill = 1 - (v - 0.27) / 0.13;
    if (ditherKey(spill * 0.7, ["-", "n"], c, r) === "n") return "n";
  }
  return key;
}

/** Build the closed exit door art. */
export function buildClosedShopDoor(): PixelArtImage {
  const d = SHOP_EXIT_DOOR;
  const x0 = d.left;
  const y0 = Math.min(d.topLeft, d.topRight);
  const x1 = d.right + PIXEL / 2;
  const y1 = Math.max(d.bottomLeft, d.bottomRight);
  const cols = Math.ceil((x1 - x0) / PIXEL);
  const rowsCount = Math.ceil((y1 - y0) / PIXEL);
  const rows: string[] = [];
  for (let r = 0; r < rowsCount; r++) {
    let row = "";
    for (let c = 0; c < cols; c++) {
      row += pixelAt(
        x0 + c * PIXEL + PIXEL / 2,
        y0 + r * PIXEL + PIXEL / 2,
        c,
        r,
      );
    }
    rows.push(row);
  }
  return { x: x0, y: y0, pixelSize: PIXEL, rows, palette: PALETTE };
}
