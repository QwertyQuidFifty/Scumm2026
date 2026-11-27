/**
 * Neon signs painted into the stage backgrounds, and how they animate.
 *
 * Each sign is a rectangle (in background coordinates: the 1024x768 area the
 * background is drawn into) split into one or more segments, e.g. one per
 * letter. At runtime the bright, saturated "neon" pixels inside each segment
 * are picked out of the background image and redrawn on top of it, so the
 * overlay matches the painted sign exactly. Each segment's brightness then
 * follows a behaviour curve over time.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * - pulse: steady glow that breathes slowly
 * - buzz: mostly steady, with a short flickering burst every few seconds
 * - broken: a failing tube that stutters and cuts out for a while
 * - fluorescent: a strip light with an occasional quick double-flicker
 */
export type NeonBehaviour = "pulse" | "buzz" | "broken" | "fluorescent";

export interface NeonSegment {
  rect: Rect;
  behaviour: NeonBehaviour;
  /** Varies the timing so signs don't flicker in sync. */
  seed: number;
}

export interface NeonSign {
  id: string;
  stageId: string;
  segments: NeonSegment[];
  /** Strength of the blurred halo around the sign (0..1). */
  glow: number;
}

const whole = (
  rect: Rect,
  behaviour: NeonBehaviour,
  seed: number,
): NeonSegment[] => [{ rect, behaviour, seed }];

/** Letters of the vertical HOTEL sign, top to bottom (E is the broken one). */
const HOTEL_X = 168;
const HOTEL_W = 56;
const hotelLetter = (
  y0: number,
  y1: number,
  behaviour: NeonBehaviour,
  seed: number,
): NeonSegment => ({
  rect: { x: HOTEL_X, y: y0, w: HOTEL_W, h: y1 - y0 },
  behaviour,
  seed,
});

export const NEON_SIGNS: NeonSign[] = [
  // Street
  {
    id: "hotel",
    stageId: "cyberpunk-street",
    glow: 0.9,
    segments: [
      hotelLetter(22, 98, "pulse", 1),
      hotelLetter(98, 164, "pulse", 1),
      hotelLetter(164, 229, "pulse", 1),
      hotelLetter(229, 294, "broken", 7),
      hotelLetter(294, 360, "pulse", 1),
    ],
  },
  {
    id: "bar",
    stageId: "cyberpunk-street",
    glow: 0.9,
    segments: whole({ x: 652, y: 322, w: 102, h: 122 }, "buzz", 3),
  },
  {
    id: "cyan-left",
    stageId: "cyberpunk-street",
    glow: 0.7,
    segments: whole({ x: 772, y: 36, w: 62, h: 246 }, "pulse", 11),
  },
  {
    id: "cyan-right",
    stageId: "cyberpunk-street",
    glow: 0.7,
    segments: whole({ x: 864, y: 26, w: 88, h: 276 }, "pulse", 23),
  },
  {
    id: "cyan-small",
    stageId: "cyberpunk-street",
    glow: 0.6,
    segments: whole({ x: 298, y: 402, w: 46, h: 50 }, "buzz", 17),
  },
  // Shop
  {
    id: "open",
    stageId: "test-indoor",
    glow: 1,
    segments: whole({ x: 608, y: 134, w: 158, h: 84 }, "buzz", 5),
  },
  {
    id: "ceiling-light",
    stageId: "test-indoor",
    glow: 0.8,
    segments: whole({ x: 336, y: 140, w: 194, h: 26 }, "fluorescent", 13),
  },
  {
    id: "door-sign",
    stageId: "test-indoor",
    glow: 0.7,
    segments: whole({ x: 890, y: 280, w: 36, h: 90 }, "pulse", 29),
  },
];

export function signsForStage(stageId: string): NeonSign[] {
  return NEON_SIGNS.filter((s) => s.stageId === stageId);
}

// ---------------------------------------------------------------------------
// Masks
// ---------------------------------------------------------------------------

/** Minimum brightness (HSV value) and saturation for a pixel to count as neon. */
export const NEON_MIN_VALUE = 0.55;
export const NEON_MIN_SATURATION = 0.45;

/** True when an RGB colour is bright and saturated enough to be neon. */
export function isNeon(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const value = max / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  return value >= NEON_MIN_VALUE && saturation >= NEON_MIN_SATURATION;
}

/**
 * Copy the neon pixels inside `rect` (in image pixels) out of an RGBA
 * image; everything else becomes transparent. Returns RGBA rows for the
 * rect and how many pixels were kept.
 */
export function extractNeon(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
  rect: Rect,
): { data: Uint8ClampedArray; width: number; height: number; count: number } {
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(width, Math.ceil(rect.x + rect.w));
  const y1 = Math.min(height, Math.ceil(rect.y + rect.h));
  const w = Math.max(0, x1 - x0);
  const h = Math.max(0, y1 - y0);
  const data = new Uint8ClampedArray(w * h * 4);
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = ((y0 + y) * width + (x0 + x)) * 4;
      const r = pixels[src];
      const g = pixels[src + 1];
      const b = pixels[src + 2];
      if (!isNeon(r, g, b)) continue;
      const dst = (y * w + x) * 4;
      data[dst] = r;
      data[dst + 1] = g;
      data[dst + 2] = b;
      data[dst + 3] = 255;
      count++;
    }
  }
  return { data, width: w, height: h, count };
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random number in [0, 1) for an integer key. */
export function hash01(n: number): number {
  let h = Math.imul(n | 0, 0x9e3779b1) ^ 0x85ebca6b;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Brightness while lit, with a slow breathing motion. */
function breathe(t: number, seed: number): number {
  const period = 2600 + (seed % 7) * 230;
  const phase = (seed % 5) * 1.3;
  return 0.92 + 0.08 * Math.sin((2 * Math.PI * t) / period + phase);
}

/** Rapid random on/off flicker within a burst. */
function stutter(t: number, seed: number, stepMs: number): number {
  return hash01(Math.floor(t / stepMs) * 31 + seed) < 0.45 ? 0.12 : 1.15;
}

/**
 * Brightness of a neon segment at time t (ms): about 1 when lit normally,
 * up to ~1.15 at a flicker's peak, down to ~0.1 when the tube is off.
 */
export function neonBrightness(
  behaviour: NeonBehaviour,
  t: number,
  seed: number,
): number {
  const base = breathe(t, seed);
  switch (behaviour) {
    case "pulse":
      return base;

    case "buzz": {
      // Every ~6s window has a 60% chance of one 450ms flicker burst.
      const windowMs = 6000;
      const w = Math.floor(t / windowMs);
      const within = t - w * windowMs;
      if (hash01(w * 7 + seed) < 0.6) {
        const start = 500 + hash01(w * 13 + seed) * 4500;
        if (within >= start && within < start + 450) {
          return stutter(t, seed, 60);
        }
      }
      return base;
    }

    case "broken": {
      // ~2.5s windows: sometimes dead for a while, sometimes stuttering.
      const windowMs = 2500;
      const w = Math.floor(t / windowMs);
      const within = t - w * windowMs;
      const roll = hash01(w * 17 + seed);
      if (roll < 0.3) {
        const offFor = 600 + hash01(w * 19 + seed) * 1500;
        return within < offFor ? 0.08 : stutter(t, seed, 70);
      }
      if (roll < 0.6 && within < 700) return stutter(t, seed, 50);
      return base * 0.95;
    }

    case "fluorescent": {
      // ~9s windows: half have a quick double-flicker.
      const windowMs = 9000;
      const w = Math.floor(t / windowMs);
      const within = t - w * windowMs;
      if (hash01(w * 23 + seed) < 0.5) {
        const start = 1000 + hash01(w * 29 + seed) * 6000;
        if (within >= start && within < start + 300) {
          return Math.floor((within - start) / 50) % 2 === 0 ? 0.2 : 1.1;
        }
      }
      return 0.97 + 0.03 * Math.sin(t / 37);
    }
  }
}
