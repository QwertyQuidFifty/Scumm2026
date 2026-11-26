/**
 * Player character pixel art.
 *
 * Frames are composed from layered parts (legs, arms, coat, head) onto a
 * 32x48 canvas. Each part is drawn fill-only; the compositor adds a 1px dark
 * outline around every part as it is stamped, so later parts get a clean
 * separation line where they overlap earlier ones. Limbs are rasterised from
 * joint positions, which keeps the walk-cycle poses consistent.
 *
 * This module has no runtime dependencies so it can be unit-tested in Node.
 */

export type SpriteDirection = "up" | "down" | "left" | "right";

export interface PixelFrame {
  name: string;
  data: string[];
}

export const SPRITE_WIDTH = 32;
export const SPRITE_HEIGHT = 48;
export const TRANSPARENT = "0";
const OUTLINE = "K";

/**
 * Colour keys used by the frame data. Ramps run highlight -> base -> shade.
 */
export const PLAYER_PALETTE: Record<string, number> = {
  K: 0x1a1020, // outline / eyes / belt
  L: 0xffb067, // hair highlight
  H: 0xe8692e, // hair
  h: 0xa53d22, // hair shade
  S: 0xf5c6a0, // skin
  s: 0xd08f6c, // skin shade
  r: 0x9c4a3c, // mouth
  G: 0xc08a55, // coat highlight
  J: 0x7a4b2c, // coat
  j: 0x4e2e1d, // coat shade
  N: 0x45e6e6, // neon trim
  T: 0xe04e8a, // shirt
  t: 0x9e2f62, // shirt shade
  Y: 0xf2c84b, // belt buckle
  P: 0x3f3a58, // trousers
  p: 0x29243d, // trousers shade
  B: 0x6a5f78, // boots
  b: 0x3e3648, // boots shade / sole
};

/** Palette overrides for NPC variants (keys not listed keep the player colour). */
export const NPC_PALETTE_OVERRIDES: Record<string, Record<string, number>> = {
  basic: {},
  bartender: {
    L: 0x8a6a5a,
    H: 0x4a3328,
    h: 0x2e1f18,
    S: 0xe8b090,
    s: 0xb9805f,
    G: 0x5a5a66,
    J: 0x34343e,
    j: 0x202028,
    N: 0xd8d8d8,
    T: 0xf0f0f0,
    t: 0xb8b8c4,
  },
  customer: {
    L: 0xfff0a0,
    H: 0xf2cc4a,
    h: 0xb08a22,
    S: 0xfed7aa,
    s: 0xd9a77c,
    G: 0x5b8ef0,
    J: 0x2f5bc0,
    j: 0x1e3a80,
    N: 0xff6ad5,
    T: 0xf5f5f5,
    t: 0xbfc4d0,
    P: 0x4a4a52,
    p: 0x303036,
  },
  mechanic: {
    L: 0xff7a6a,
    H: 0xc8322a,
    h: 0x7f1d1d,
    S: 0xc98b62,
    s: 0x9a6343,
    G: 0x58c47a,
    J: 0x2f8a4c,
    j: 0x1d5a30,
    N: 0xffb020,
    T: 0x3a3a3a,
    t: 0x242424,
    P: 0x2f8a4c,
    p: 0x1d5a30,
  },
};

// ---------------------------------------------------------------------------
// Compositing helpers
// ---------------------------------------------------------------------------

interface Pixel {
  x: number;
  y: number;
  c: string;
}

type Layer = Pixel[];
type Point = [number, number];

/** A part drawn as a character grid; '.' is transparent. */
function grid(rows: string[], ox: number, oy: number): Layer {
  const pixels: Layer = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== ".") pixels.push({ x: ox + x, y: oy + y, c: row[x] });
    }
  });
  return pixels;
}

/**
 * A limb rasterised as horizontal spans following a polyline of joints
 * (top to bottom). The trailing (right-hand) pixel of each span is shaded.
 */
function limb(
  joints: Point[],
  width: number,
  base: string,
  shade: string,
): Layer {
  const pixels: Layer = [];
  for (let i = 0; i < joints.length - 1; i++) {
    const [ax, ay] = joints[i];
    const [bx, by] = joints[i + 1];
    const last = i === joints.length - 2;
    for (let y = ay; last ? y <= by : y < by; y++) {
      const t = by === ay ? 0 : (y - ay) / (by - ay);
      const cx = ax + (bx - ax) * t;
      const left = Math.round(cx - (width - 1) / 2);
      for (let k = 0; k < width; k++) {
        pixels.push({ x: left + k, y, c: k === width - 1 ? shade : base });
      }
    }
  }
  return pixels;
}

class Canvas {
  private readonly px: string[][];

  constructor() {
    this.px = Array.from({ length: SPRITE_HEIGHT }, () =>
      Array<string>(SPRITE_WIDTH).fill(TRANSPARENT),
    );
  }

  /** Stamp a layer, then ring it with a 1px outline (4-neighbourhood). */
  stamp(layer: Layer): this {
    const occupied = new Set(layer.map((p) => `${p.x},${p.y}`));
    for (const p of layer) this.set(p.x, p.y, p.c);
    for (const p of layer) {
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = p.x + dx;
        const ny = p.y + dy;
        if (!occupied.has(`${nx},${ny}`)) this.set(nx, ny, OUTLINE);
      }
    }
    return this;
  }

  private set(x: number, y: number, c: string): void {
    if (x < 0 || y < 0 || x >= SPRITE_WIDTH || y >= SPRITE_HEIGHT) return;
    this.px[y][x] = c;
  }

  rows(): string[] {
    return this.px.map((r) => r.join(""));
  }
}

function mirror(rows: string[]): string[] {
  return rows.map((r) => r.split("").reverse().join(""));
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

/** Ground line: the bottom row of the boot soles. */
const GROUND = 44;
/** Hip height when standing. */
const HIP = 27;

const HEAD_FRONT = [
  "...LLHHHH...",
  ".LLHHHHHHHh.",
  "LHHHHHHHHHhh",
  "HHHHHHHHHhhh",
  "HHhSSHSSSShh",
  "HhSSSSSSSSSh",
  ".SSKSSSSKSs.",
  ".SSKSSSSKSs.",
  ".sSSSSsSSSs.",
  "..SSSrrSSs..",
  "...sSSSSs...",
  "....ssss....",
  "....ssss....",
];

const HEAD_BACK = [
  "...LLHHHH...",
  ".LLLHHHHHHh.",
  "LLHHHHHHHHhh",
  "LHHHHHHHHhhh",
  "HHHHHHHHHhhh",
  "HHHHHHHHhhhh",
  "sHHHHHHHHhhs",
  "sHHHHHHHhhhs",
  ".hHHHHHHhhh.",
  "..hhHHHhhh..",
  "...hhhhhh...",
  "....ssss....",
  "....ssss....",
];

const HEAD_SIDE = [
  "..LLHHHH....",
  ".LHHHHHHHH..",
  "LHHHHHHHHHh.",
  "HHHHhHHHHHhh",
  "HHHhHHHhSSHh",
  "HhHHHHSSSSSs",
  "hHHsSSSSKSS.",
  "hHHssSSSKSSS",
  ".hHsSSSSSSs.",
  ".hhSSSSSrrS.",
  "..hsSSSSSs..",
  "...ssSSSs...",
  "....sss.....",
];

const COAT_FRONT = [
  "..GJNttttNjj..",
  ".GGJNTTTtNJjj.",
  "GGJJNTTTtNJJjj",
  "GJJJNTTTtNJJjj",
  "GJJJNTTTtNJJjj",
  "GJJJNTTTtNJJjj",
  "GJJJNTTTtNJJjj",
  "GJJJNKYYKNJJjj",
  "GJJJNPPPPNJJjj",
  "GJJJNPPPPNJjjj",
  "GJJjN....NjJjj",
  "GJjj......jjjj",
];

const COAT_BACK = [
  "..GNNNNNNNNj..",
  ".GGJJJJJJJJjj.",
  "GGJJJJJJJJJJjj",
  "GJJJJJJJJJJJjj",
  "GJJJJNNNNJJJjj",
  "GJJJJNJJNJJJjj",
  "GJJJJNNNNJJJjj",
  "GJJJJJJJJJJJjj",
  "GJJJJJJJJJJJjj",
  "GJJJJJjJJJJJjj",
  "GJJJJjjjJJJjjj",
  "GJJjjj..jjjjjj",
];

const COAT_SIDE = [
  "...GJJJNt.",
  "..GJJJJNTt",
  ".GJJJJJNTT",
  "GJJJJJJNTT",
  "GJJJJJJNTt",
  "GJJJJJJNTT",
  "GJJJJJJNTT",
  "GJJJJJJNKY",
  "GJJJJJJjNP",
  "GJJJJJjjNP",
  "GJJJJjjjjN",
  "GJJjjjjjj.",
];

const BOOT_FRONT = [".BBb.", ".BBb.", "BBBbb", "bbbbb"];
const BOOT_SIDE = ["BBb..", "BBBBb", "bbbbb"];
const HAND = ["SS", "ss"];

/** A front/back facing leg: hip x, how far the foot is lifted off the ground. */
function legFront(x: number, hipY: number, lift: number): Layer {
  const ankle = GROUND - BOOT_FRONT.length - lift;
  return [
    ...limb(
      [
        [x, hipY],
        [x, ankle],
      ],
      3,
      "P",
      "p",
    ),
    ...grid(BOOT_FRONT, x - 2, ankle + 1),
  ];
}

/** A side-view leg from hip through knee to ankle, with a right-facing boot. */
function legSide(hip: Point, knee: Point, ankle: Point, far: boolean): Layer {
  const base = far ? "p" : "P";
  const boot = grid(BOOT_SIDE, ankle[0] - 1, ankle[1] + 1).map((p) =>
    far ? { ...p, c: p.c === "B" ? "b" : p.c } : p,
  );
  return [...limb([hip, knee, ankle], 3, base, "p"), ...boot];
}

/** An arm from shoulder through elbow to wrist, ending in a hand. */
function arm(shoulder: Point, elbow: Point, wrist: Point, far: boolean): Layer {
  const sleeve = limb([shoulder, elbow, wrist], 3, far ? "j" : "J", "j");
  return [...sleeve, ...grid(HAND, wrist[0] - 1, wrist[1] + 1)];
}

// ---------------------------------------------------------------------------
// Poses
// ---------------------------------------------------------------------------

type FrameName = "idle" | "walk1" | "walk2" | "walk3" | "walk4";
const FRAME_NAMES: FrameName[] = ["idle", "walk1", "walk2", "walk3", "walk4"];

/**
 * Per-frame pose parameters. Contact frames (walk1/walk3) have one leg
 * forward; passing frames (walk2/walk4) lift the swinging leg and raise the
 * body by 1px.
 */
interface Pose {
  bob: number; // vertical body offset (negative = up)
  leftLift: number; // front/back view: screen-left foot lift
  rightLift: number; // front/back view: screen-right foot lift
  leftHand: number; // front/back view: hand drop
  rightHand: number;
  stride: number; // side view: -1 near leg back, 0 together, 1 near leg forward
  passing: boolean;
}

const POSES: Record<FrameName, Pose> = {
  idle: {
    bob: 0,
    leftLift: 0,
    rightLift: 0,
    leftHand: 0,
    rightHand: 0,
    stride: 0,
    passing: false,
  },
  walk1: {
    bob: 0,
    leftLift: 0,
    rightLift: 2,
    leftHand: 0,
    rightHand: 1,
    stride: 1,
    passing: false,
  },
  walk2: {
    bob: -1,
    leftLift: 0,
    rightLift: 3,
    leftHand: 0,
    rightHand: 0,
    stride: 1,
    passing: true,
  },
  walk3: {
    bob: 0,
    leftLift: 2,
    rightLift: 0,
    leftHand: 1,
    rightHand: 0,
    stride: -1,
    passing: false,
  },
  walk4: {
    bob: -1,
    leftLift: 3,
    rightLift: 0,
    leftHand: 0,
    rightHand: 0,
    stride: -1,
    passing: true,
  },
};

function frontOrBack(pose: Pose, back: boolean): string[] {
  const hip = HIP + pose.bob;
  const canvas = new Canvas();
  canvas.stamp(legFront(13, hip, pose.leftLift));
  canvas.stamp(legFront(18, hip, pose.rightLift));

  const head = grid(back ? HEAD_BACK : HEAD_FRONT, 10, 4 + pose.bob);
  const coat = grid(back ? COAT_BACK : COAT_FRONT, 9, 17 + pose.bob);
  canvas.stamp(head).stamp(coat);

  const b = pose.bob;
  canvas.stamp(
    arm([10, 19 + b], [9, 23 + b], [9, 26 + b + pose.leftHand], false),
  );
  canvas.stamp(
    arm([21, 19 + b], [22, 23 + b], [22, 26 + b + pose.rightHand], back),
  );
  return canvas.rows();
}

/** Side view facing right (left view is the mirror image). */
function side(pose: Pose): string[] {
  const b = pose.bob;
  const hipY = HIP + b;
  const ankleY = GROUND - BOOT_SIDE.length;
  const canvas = new Canvas();

  // Legs: in a contact pose one foot is forward and one back; in a passing
  // pose one leg is planted and the other swings through with a bent knee.
  const planted = (x: number): [Point, Point, Point] => [
    [x, hipY],
    [x, hipY + 7],
    [x, ankleY],
  ];
  const forward = (x: number): [Point, Point, Point] => [
    [x, hipY],
    [x + 2, hipY + 7],
    [x + 4, ankleY],
  ];
  const backward = (x: number): [Point, Point, Point] => [
    [x, hipY],
    [x - 2, hipY + 7],
    [x - 4, ankleY - 1],
  ];
  const swinging = (x: number): [Point, Point, Point] => [
    [x, hipY],
    [x + 2, hipY + 6],
    [x - 1, ankleY - 3],
  ];

  let near: [Point, Point, Point];
  let far: [Point, Point, Point];
  if (pose.stride === 0) {
    near = planted(15);
    far = planted(17);
  } else if (pose.passing) {
    // walk2: near leg planted, far leg swings; walk4: the reverse.
    near = pose.stride > 0 ? planted(15) : swinging(15);
    far = pose.stride > 0 ? swinging(16) : planted(16);
  } else {
    near = pose.stride > 0 ? forward(15) : backward(15);
    far = pose.stride > 0 ? backward(16) : forward(16);
  }

  // Arms swing opposite to the legs.
  const swing = pose.passing ? 0 : -pose.stride * 3;
  const armPts = (x: number, dir: number): [Point, Point, Point] => [
    [x, 19 + b],
    [x + Math.round(dir / 2), 23 + b],
    [x + dir, 26 + b],
  ];

  canvas.stamp(arm(...armPts(17, -swing), true));
  canvas.stamp(legSide(...far, true));
  canvas.stamp(legSide(...near, false));
  canvas.stamp(grid(HEAD_SIDE, 9, 4 + b));
  canvas.stamp(grid(COAT_SIDE, 11, 17 + b));
  canvas.stamp(arm(...armPts(15, swing), false));
  return canvas.rows();
}

function buildFrames(): Record<SpriteDirection, PixelFrame[]> {
  const frames: Record<SpriteDirection, PixelFrame[]> = {
    down: [],
    up: [],
    left: [],
    right: [],
  };
  for (const name of FRAME_NAMES) {
    const pose = POSES[name];
    const right = side(pose);
    frames.down.push({ name, data: frontOrBack(pose, false) });
    frames.up.push({ name, data: frontOrBack(pose, true) });
    frames.right.push({ name, data: right });
    frames.left.push({ name, data: mirror(right) });
  }
  return frames;
}

/** All player frames: 4 directions x (idle + 4 walk frames), 32x48 each. */
export const PLAYER_FRAMES: Record<SpriteDirection, PixelFrame[]> =
  buildFrames();
