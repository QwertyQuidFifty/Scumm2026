/**
 * Pixel-art character compositor.
 *
 * Frames are composed from layered parts (legs, arms, torso, head) onto a
 * 32x48 canvas. Each part is drawn fill-only; the compositor adds a 1px dark
 * outline around every part as it is stamped, so later parts get a clean
 * separation line where they overlap earlier ones. Limbs are rasterised from
 * joint positions, which keeps the walk-cycle poses consistent across
 * characters.
 *
 * A CharacterDesign supplies the part grids, limb sizes and palette; the
 * compositor turns it into 4 directions x (idle + 4 walk) frames.
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
export const OUTLINE = "K";
/** Ground line used while composing: the bottom row of the boot soles. */
export const GROUND = 44;
/**
 * Finished frames are moved down so the outline under the soles is the
 * sprite's last row. Sprites are anchored at their bottom edge, so this puts
 * the character's feet exactly on their position instead of a few pixels
 * above it.
 */
const FEET_DROP = SPRITE_HEIGHT - 1 - (GROUND + 1);

function dropToFloor(rows: string[]): string[] {
  if (FEET_DROP <= 0) return rows;
  const blank = TRANSPARENT.repeat(SPRITE_WIDTH);
  return [
    ...Array<string>(FEET_DROP).fill(blank),
    ...rows.slice(0, SPRITE_HEIGHT - FEET_DROP),
  ];
}

/** A part seen from the front, back and side (side faces right). */
export interface PartViews {
  front: string[];
  back: string[];
  side: string[];
  /**
   * Optional side view of the character's right side, for asymmetric
   * designs. Drawn facing right like `side`; it is mirrored for the
   * left-facing frames.
   */
  sideRight?: string[];
  /** Top row of the part on the canvas. */
  y: number;
  /** Left column of the side view (front/back are centred automatically). */
  sideX: number;
}

export interface ArmStyle {
  base: string;
  shade: string;
  hand: string[];
}

export interface CharacterDesign {
  palette: Record<string, number>;
  /**
   * How the head changes in talk frames with the mouth open. By default
   * the mouth ('r') becomes a dark opening with the lip dropped a row; a
   * design can instead recolour keys, e.g. a respirator that glows.
   */
  talkSwap?: Record<string, string>;
  head: PartViews;
  torso: PartViews;
  arms: {
    width: number;
    shoulderY: number;
    wristY: number;
    /** Shoulder column of the screen-left arm in front view (mirrored for the other). */
    frontX: number;
    /** Shoulder column of the near arm in the right-facing side view. */
    sideX: number;
    /** The character's right arm (screen-left in front view). */
    right: ArmStyle;
    /** The character's left arm (screen-right in front view). */
    left: ArmStyle;
  };
  legs: {
    width: number;
    hipY: number;
    /** Hip column of the screen-left leg in front view (mirrored for the other). */
    frontX: number;
    /** Hip column of the near leg in the right-facing side view. */
    sideX: number;
    base: string;
    shade: string;
    bootFront: string[];
    bootSide: string[];
  };
}

// ---------------------------------------------------------------------------
// Layers and canvas
// ---------------------------------------------------------------------------

interface Pixel {
  x: number;
  y: number;
  c: string;
}

type Layer = Pixel[];
type Point = [number, number];
type Joints = [Point, Point, Point];

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

/** Widest row of a grid. */
function gridWidth(rows: string[]): number {
  return Math.max(...rows.map((r) => r.length));
}

/** Left column that centres a grid on the canvas. */
function centred(rows: string[]): number {
  return Math.round((SPRITE_WIDTH - gridWidth(rows)) / 2);
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
// Limbs
// ---------------------------------------------------------------------------

function legFront(
  d: CharacterDesign,
  x: number,
  hipY: number,
  lift: number,
): Layer {
  const { width, base, shade, bootFront } = d.legs;
  const ankle = GROUND - bootFront.length - lift;
  const bootX = x - Math.floor(gridWidth(bootFront) / 2);
  return [
    ...limb(
      [
        [x, hipY],
        [x, ankle],
      ],
      width,
      base,
      shade,
    ),
    ...grid(bootFront, bootX, ankle + 1),
  ];
}

function legSide(d: CharacterDesign, joints: Joints, far: boolean): Layer {
  const { width, base, shade, bootSide } = d.legs;
  const ankle = joints[2];
  // Boots use the B/b ramp; the far boot is drawn in its shade colour.
  const boot = grid(
    bootSide,
    ankle[0] - Math.floor(width / 2),
    ankle[1] + 1,
  ).map((p) => (far && p.c === "B" ? { ...p, c: "b" } : p));
  return [...limb(joints, width, far ? shade : base, shade), ...boot];
}

/**
 * Where the hand sits relative to the wrist: hanging below it, or at the end
 * of a raised forearm pointing right (+1) or left (-1).
 */
type HandPlacement = "below" | 1 | -1;

function arm(
  d: CharacterDesign,
  style: ArmStyle,
  joints: Joints,
  far: boolean,
  hand: HandPlacement = "below",
): Layer {
  const base = far ? style.shade : style.base;
  const sleeve = limb(joints, d.arms.width, base, style.shade);
  const [wx, wy] = joints[2];
  const handW = gridWidth(style.hand);
  const half = Math.floor(d.arms.width / 2);
  const handPos: Point =
    hand === "below"
      ? [wx - Math.floor(handW / 2), wy + 1]
      : hand > 0
        ? [wx + half + 1, wy - 1]
        : [wx - half - handW, wy - 1];
  return [...sleeve, ...grid(style.hand, handPos[0], handPos[1])];
}

// ---------------------------------------------------------------------------
// Poses
// ---------------------------------------------------------------------------

export type FrameName =
  | "idle"
  | "walk1"
  | "walk2"
  | "walk3"
  | "walk4"
  | "talk1"
  | "talk2"
  | "talk3";
export const FRAME_NAMES: FrameName[] = [
  "idle",
  "walk1",
  "walk2",
  "walk3",
  "walk4",
  "talk1",
  "talk2",
  "talk3",
];

/**
 * Per-frame pose parameters. Contact frames (walk1/walk3) have one leg
 * forward; passing frames (walk2/walk4) lift the swinging leg and raise the
 * body by 1px. Talk frames open the mouth and/or raise a hand in a gesture
 * (talk1: mouth open; talk2: open + gesture; talk3: closed + gesture).
 */
interface Pose {
  bob: number; // vertical body offset (negative = up)
  leftLift: number; // front/back view: screen-left foot lift
  rightLift: number; // front/back view: screen-right foot lift
  leftHand: number; // front/back view: hand drop
  rightHand: number;
  stride: number; // side view: -1 near leg back, 0 together, 1 near leg forward
  passing: boolean;
  mouthOpen?: boolean;
  gesture?: boolean;
}

// prettier-ignore
const POSES: Record<FrameName, Pose> = {
  idle:  { bob: 0,  leftLift: 0, rightLift: 0, leftHand: 0, rightHand: 0, stride: 0,  passing: false },
  walk1: { bob: 0,  leftLift: 0, rightLift: 2, leftHand: 0, rightHand: 1, stride: 1,  passing: false },
  walk2: { bob: -1, leftLift: 0, rightLift: 3, leftHand: 0, rightHand: 0, stride: 1,  passing: true },
  walk3: { bob: 0,  leftLift: 2, rightLift: 0, leftHand: 1, rightHand: 0, stride: -1, passing: false },
  walk4: { bob: -1, leftLift: 3, rightLift: 0, leftHand: 0, rightHand: 0, stride: -1, passing: true },
  talk1: { bob: 0,  leftLift: 0, rightLift: 0, leftHand: 0, rightHand: 0, stride: 0,  passing: false, mouthOpen: true },
  talk2: { bob: 0,  leftLift: 0, rightLift: 0, leftHand: 0, rightHand: 0, stride: 0,  passing: false, mouthOpen: true, gesture: true },
  talk3: { bob: 0,  leftLift: 0, rightLift: 0, leftHand: 0, rightHand: 0, stride: 0,  passing: false, gesture: true },
};

/** The head grid with the mouth open (see CharacterDesign.talkSwap). */
function openMouth(d: CharacterDesign, rows: string[]): string[] {
  if (d.talkSwap) {
    const swap = d.talkSwap;
    return rows.map((r) => [...r].map((c) => swap[c] ?? c).join(""));
  }
  const out = rows.map((r) => [...r]);
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== "r") return;
      out[y][x] = OUTLINE;
      const below = out[y + 1]?.[x];
      if (below !== undefined && below !== "." && below !== "r") {
        out[y + 1][x] = "r";
      }
    });
  });
  return out.map((r) => r.join(""));
}

function frontOrBack(d: CharacterDesign, pose: Pose, back: boolean): string[] {
  const b = pose.bob;
  const canvas = new Canvas();

  const lx = d.legs.frontX;
  canvas.stamp(legFront(d, lx, d.legs.hipY + b, pose.leftLift));
  canvas.stamp(
    legFront(d, SPRITE_WIDTH - 1 - lx, d.legs.hipY + b, pose.rightLift),
  );

  let headRows = back ? d.head.back : d.head.front;
  if (pose.mouthOpen && !back) headRows = openMouth(d, headRows);
  const torsoRows = back ? d.torso.back : d.torso.front;
  canvas.stamp(grid(headRows, centred(headRows), d.head.y + b));
  canvas.stamp(grid(torsoRows, centred(torsoRows), d.torso.y + b));

  // Seen from behind, the character's left arm is on screen-left.
  const screenLeft = back ? d.arms.left : d.arms.right;
  const screenRight = back ? d.arms.right : d.arms.left;
  const { shoulderY, wristY, frontX } = d.arms;
  const elbowY = Math.round((shoulderY + wristY) / 2);
  const rx = SPRITE_WIDTH - 1 - frontX;
  canvas.stamp(
    arm(
      d,
      screenLeft,
      [
        [frontX, shoulderY + b],
        [frontX - 1, elbowY + b],
        [frontX - 1, wristY + b + pose.leftHand],
      ],
      false,
    ),
  );
  // Gesture: the screen-right forearm swings in across the body.
  const rightArm: Joints =
    pose.gesture && !back
      ? [
          [rx, shoulderY + b],
          [rx + 1, elbowY + b],
          [rx - 2, elbowY + b + 2],
        ]
      : [
          [rx, shoulderY + b],
          [rx + 1, elbowY + b],
          [rx + 1, wristY + b + pose.rightHand],
        ];
  canvas.stamp(
    arm(
      d,
      screenRight,
      rightArm,
      back, // light comes from the top-left, so shade this arm from behind
      pose.gesture && !back ? -1 : "below",
    ),
  );
  return canvas.rows();
}

/**
 * Side view facing right. `near`/`far` pick which arm style is closest to the
 * viewer and `rightSide` selects the right-side head/torso art, so
 * asymmetric details stay on the correct side of the body when the
 * left-facing view is mirrored from this.
 */
function side(
  d: CharacterDesign,
  pose: Pose,
  near: ArmStyle,
  far: ArmStyle,
  rightSide: boolean,
): string[] {
  const b = pose.bob;
  const hipY = d.legs.hipY + b;
  const ankleY = GROUND - d.legs.bootSide.length;
  const canvas = new Canvas();

  // Legs: in a contact pose one foot is forward and one back; in a passing
  // pose one leg is planted and the other swings through with a bent knee.
  const kneeY = hipY + Math.floor((ankleY - hipY) / 2);
  const planted = (x: number): Joints => [
    [x, hipY],
    [x, kneeY],
    [x, ankleY],
  ];
  const forward = (x: number): Joints => [
    [x, hipY],
    [x + 2, kneeY],
    [x + 4, ankleY],
  ];
  const backward = (x: number): Joints => [
    [x, hipY],
    [x - 2, kneeY],
    [x - 4, ankleY - 1],
  ];
  const swinging = (x: number): Joints => [
    [x, hipY],
    [x + 2, kneeY - 1],
    [x - 1, ankleY - 3],
  ];

  const nx = d.legs.sideX;
  let nearLeg: Joints;
  let farLeg: Joints;
  if (pose.stride === 0) {
    nearLeg = planted(nx);
    farLeg = planted(nx + 2);
  } else if (pose.passing) {
    nearLeg = pose.stride > 0 ? planted(nx) : swinging(nx);
    farLeg = pose.stride > 0 ? swinging(nx + 1) : planted(nx + 1);
  } else {
    nearLeg = pose.stride > 0 ? forward(nx) : backward(nx);
    farLeg = pose.stride > 0 ? backward(nx + 1) : forward(nx + 1);
  }

  // Arms swing opposite to the legs.
  const swing = pose.passing ? 0 : -pose.stride * 3;
  const { shoulderY, wristY, sideX } = d.arms;
  const elbowY = Math.round((shoulderY + wristY) / 2);
  const armJoints = (x: number, dir: number): Joints => [
    [x, shoulderY + b],
    [x + Math.round(dir / 2), elbowY + b],
    [x + dir, wristY + b],
  ];

  canvas.stamp(arm(d, far, armJoints(sideX + 2, -swing), true));
  canvas.stamp(legSide(d, farLeg, true));
  canvas.stamp(legSide(d, nearLeg, false));
  const view = (part: PartViews): string[] =>
    rightSide && part.sideRight ? part.sideRight : part.side;
  const headRows = pose.mouthOpen ? openMouth(d, view(d.head)) : view(d.head);
  canvas.stamp(grid(headRows, d.head.sideX, d.head.y + b));
  canvas.stamp(grid(view(d.torso), d.torso.sideX, d.torso.y + b));
  // Gesture: the near forearm comes up and forward, palm out.
  const nearArm: Joints = pose.gesture
    ? [
        [sideX, shoulderY + b],
        [sideX + 1, elbowY + b],
        [sideX + 4, elbowY + b + 1],
      ]
    : armJoints(sideX, swing);
  canvas.stamp(arm(d, near, nearArm, false, pose.gesture ? 1 : "below"));
  return canvas.rows();
}

/** Build all frames for a design: 4 directions x (idle, 4 walk, 3 talk frames). */
export function buildCharacterFrames(
  d: CharacterDesign,
): Record<SpriteDirection, PixelFrame[]> {
  const frames: Record<SpriteDirection, PixelFrame[]> = {
    down: [],
    up: [],
    left: [],
    right: [],
  };
  for (const name of FRAME_NAMES) {
    const pose = POSES[name];
    frames.down.push({ name, data: dropToFloor(frontOrBack(d, pose, false)) });
    frames.up.push({ name, data: dropToFloor(frontOrBack(d, pose, true)) });
    // Facing right the viewer sees the character's left side.
    frames.right.push({
      name,
      data: dropToFloor(side(d, pose, d.arms.left, d.arms.right, false)),
    });
    frames.left.push({
      name,
      data: dropToFloor(mirror(side(d, pose, d.arms.right, d.arms.left, true))),
    });
  }
  return frames;
}
