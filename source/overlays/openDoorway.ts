/**
 * Pixel art for the open building entrance on the street.
 *
 * The art is generated from the door frame's geometry so it follows the
 * wall's perspective: a dark frame, the shop's red-lit interior with a
 * glimpse of the neon sign, the door leaf swung inward on its hinge, and a
 * pool of light spilling onto the pavement. Pixels are 4 game units square
 * to match the background art.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */

export interface PixelArtColour {
  color: number;
  alpha: number;
}

export interface PixelArtImage {
  /** Game-space position of the top-left corner. */
  x: number;
  y: number;
  /** Game units per art pixel. */
  pixelSize: number;
  /** One string per row; '.' is transparent. */
  rows: string[];
  palette: Record<string, PixelArtColour>;
}

const PIXEL = 4;

/**
 * The building entrance on the street: vertical left/right edges with
 * slanted top and bottom (the wall recedes to the right). This is both the
 * clickable area of the door and the shape the open-door art fills.
 */
export const DOOR = {
  left: 58,
  right: 124,
  topLeft: 450,
  topRight: 470,
  bottomLeft: 650,
  bottomRight: 634,
};

/** The door as a polygon (clockwise from top-left), for hit-testing. */
export const DOOR_POLYGON = [
  { x: DOOR.left, y: DOOR.topLeft },
  { x: DOOR.right, y: DOOR.topRight },
  { x: DOOR.right, y: DOOR.bottomRight },
  { x: DOOR.left, y: DOOR.bottomLeft },
];

const DOOR_WIDTH = DOOR.right - DOOR.left;
/** Width of the swung-in door leaf at the hinge side. */
const LEAF_WIDTH = Math.round(DOOR_WIDTH * 0.23);
/** How far the light pool reaches out from the threshold. */
const SPILL_DEPTH = 44;

const PALETTE: Record<string, PixelArtColour> = {
  K: { color: 0x0a0612, alpha: 1 }, // frame / deep shadow
  k: { color: 0x2a1830, alpha: 1 }, // inner jamb
  a: { color: 0x3a0f2a, alpha: 1 }, // interior, top (dim)
  b: { color: 0x6e1a2e, alpha: 1 }, // interior, middle
  c: { color: 0xa83a2c, alpha: 1 }, // interior, lower (warm)
  f: { color: 0xe07a3a, alpha: 1 }, // lit floor inside
  n: { color: 0xff4a3a, alpha: 1 }, // OPEN sign glow
  N: { color: 0xffb08a, alpha: 1 }, // OPEN sign hot core
  D: { color: 0x1c1a2e, alpha: 1 }, // door leaf
  d: { color: 0x2c2a44, alpha: 1 }, // door leaf panel
  E: { color: 0xd8703a, alpha: 1 }, // lit edge of the door leaf
  L: { color: 0xe0703a, alpha: 0.38 }, // light on the pavement, near
  l: { color: 0xc0503a, alpha: 0.2 }, // light on the pavement, far
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Top/bottom of the opening at a given x (perspective slant). */
function edgesAt(x: number): { top: number; bottom: number } {
  const t = (x - DOOR.left) / (DOOR.right - DOOR.left);
  return {
    top: lerp(DOOR.topLeft, DOOR.topRight, t),
    bottom: lerp(DOOR.bottomLeft, DOOR.bottomRight, t),
  };
}

/** Classify one art pixel by the game-space point at its centre. */
function pixelAt(gx: number, gy: number): string {
  // Checkerboard offset used to dither the boundaries between colour bands.
  const checker =
    (Math.floor(gx / PIXEL) + Math.floor(gy / PIXEL)) % 2 === 0 ? 0.05 : -0.05;
  const inX = gx >= DOOR.left && gx <= DOOR.right;
  const clampedX = Math.min(Math.max(gx, DOOR.left), DOOR.right);
  const { top, bottom } = edgesAt(clampedX);

  if (inX && gy >= top && gy < bottom) {
    // Frame: a dark border just inside the door's outline (not along the
    // threshold, which opens onto the street).
    if (gx < DOOR.left + PIXEL || gx > DOOR.right - PIXEL || gy < top + PIXEL) {
      return "K";
    }

    const v = (gy - top) / (bottom - top); // 0 top .. 1 floor

    // Door leaf, hinged on the left jamb and swung into the shop: its
    // free edge catches the light.
    const leafRight = DOOR.left + PIXEL + LEAF_WIDTH;
    if (gx < leafRight) {
      if (gx >= leafRight - PIXEL) return "E";
      return v > 0.15 && v < 0.85 && gx >= DOOR.left + 2 * PIXEL ? "d" : "D";
    }

    // Glimpse of the OPEN neon sign on the far wall.
    const across = (gx - DOOR.left) / DOOR_WIDTH;
    if (across >= 0.5 && across < 0.82 && v >= 0.22 && v < 0.3) {
      return across >= 0.58 && across < 0.74 && v >= 0.24 && v < 0.28
        ? "N"
        : "n";
    }

    const shade = v + checker;
    if (v > 0.88) return "f";
    if (gx > DOOR.right - 2 * PIXEL) return "k"; // far jamb in shadow
    if (shade > 0.62) return "c";
    if (shade > 0.3) return "b";
    return "a";
  }

  // Light spilling onto the pavement, widening as it comes towards the
  // viewer and leaning left (away from the vanishing point).
  const below = gy - bottom;
  if (below >= 0 && below < SPILL_DEPTH) {
    const spread = below / SPILL_DEPTH;
    const left = DOOR.left - 6 - spread * 34;
    const right = DOOR.right - spread * 6;
    if (gx >= left && gx < right) return spread + checker < 0.45 ? "L" : "l";
  }
  return ".";
}

/** Build the open-doorway art. */
export function buildOpenDoorway(): PixelArtImage {
  const x0 = DOOR.left - 44;
  const x1 = DOOR.right + PIXEL / 2;
  const y0 = Math.min(DOOR.topLeft, DOOR.topRight);
  const y1 = Math.max(DOOR.bottomLeft, DOOR.bottomRight) + SPILL_DEPTH;
  const cols = Math.ceil((x1 - x0) / PIXEL);
  const rowsCount = Math.ceil((y1 - y0) / PIXEL);

  const rows: string[] = [];
  for (let r = 0; r < rowsCount; r++) {
    let row = "";
    for (let c = 0; c < cols; c++) {
      row += pixelAt(x0 + c * PIXEL + PIXEL / 2, y0 + r * PIXEL + PIXEL / 2);
    }
    rows.push(row);
  }
  return { x: x0, y: y0, pixelSize: PIXEL, rows, palette: PALETTE };
}
