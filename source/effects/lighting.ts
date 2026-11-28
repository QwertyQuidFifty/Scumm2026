/**
 * Light zones: how bright, and what colour, a character looks depending
 * on where they stand.
 *
 * Each stage has an ambient light (the colour a character takes in the
 * open) and a set of soft elliptical zones on the floor: a pink pool
 * under a neon sign, a dark corner, the glow of a doorway. A character's
 * tint is worked out from the point at their feet: starting from the
 * ambient colour, each zone pulls it towards its own colour, fully at the
 * zone's centre and fading smoothly to nothing at its edge. Because the
 * result changes smoothly with position, walking between zones fades the
 * lighting rather than switching it.
 *
 * The tint multiplies the sprite's colours, so white leaves a character
 * as drawn and darker colours dim and colour them.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */

export interface LightZone {
  /** Label for the debug view. */
  name: string;
  /** Centre of the zone on the floor (game coordinates). */
  x: number;
  y: number;
  /** Radii: floor zones are wide and flat to match the perspective. */
  rx: number;
  ry: number;
  /** Light colour at the centre (0xRRGGBB). */
  color: number;
  /** How far the colour is pulled towards `color` at the centre (0..1). */
  strength: number;
}

export interface StageLighting {
  ambient: number;
  zones: LightZone[];
}

type Rgb = [number, number, number];

const toRgb = (c: number): Rgb => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const fromRgb = ([r, g, b]: Rgb): number =>
  (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** How much a zone affects the point (x, y): 1 at the centre, 0 outside. */
export function zoneWeight(zone: LightZone, x: number, y: number): number {
  const dx = (x - zone.x) / zone.rx;
  const dy = (y - zone.y) / zone.ry;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d >= 1) return 0;
  return zone.strength * smoothstep(1 - d);
}

/** The tint (0xRRGGBB) for a character standing at (x, y). */
export function lightAt(lighting: StageLighting, x: number, y: number): number {
  let rgb = toRgb(lighting.ambient);
  for (const zone of lighting.zones) {
    const w = zoneWeight(zone, x, y);
    if (w <= 0) continue;
    const target = toRgb(zone.color);
    rgb = rgb.map((v, i) => v + (target[i] - v) * w) as Rgb;
  }
  return fromRgb(rgb);
}

/**
 * The street at night: a cool blue ambient; pink from the HOTEL and BAR
 * signs pooling on the cobbles below them; cyan from the tall signs on
 * the right; the near corners in deep shadow.
 */
export const STREET_LIGHTING: StageLighting = {
  ambient: 0xb4b8dc,
  zones: [
    {
      name: "BAR neon",
      x: 680,
      y: 640,
      rx: 190,
      ry: 70,
      color: 0xff8cc8,
      strength: 0.75,
    },
    {
      name: "HOTEL neon",
      x: 220,
      y: 660,
      rx: 200,
      ry: 70,
      color: 0xff9ad0,
      strength: 0.6,
    },
    {
      name: "cyan signs",
      x: 900,
      y: 730,
      rx: 200,
      ry: 90,
      color: 0x8ce8ff,
      strength: 0.7,
    },
    {
      name: "far haze",
      x: 478,
      y: 612,
      rx: 140,
      ry: 30,
      color: 0x9a90d0,
      strength: 0.5,
    },
    {
      name: "left corner shadow",
      x: 0,
      y: 803,
      rx: 230,
      ry: 110,
      color: 0x4a4c78,
      strength: 0.85,
    },
    {
      name: "foreground shadow",
      x: 512,
      y: 820,
      rx: 420,
      ry: 70,
      color: 0x5a5c8a,
      strength: 0.6,
    },
  ],
};

/**
 * The mech shop: dim and blue; a warm white strip light over the counter,
 * the red OPEN sign glowing over the back right, magenta from the street
 * through the exit door, and the robot's shadow over the front left.
 */
export const SHOP_LIGHTING: StageLighting = {
  ambient: 0x9ca0c8,
  zones: [
    {
      name: "strip light",
      x: 440,
      y: 630,
      rx: 200,
      ry: 60,
      color: 0xfff4e0,
      strength: 0.8,
    },
    {
      name: "OPEN sign",
      x: 700,
      y: 640,
      rx: 170,
      ry: 70,
      color: 0xff9c84,
      strength: 0.7,
    },
    {
      name: "exit door neon",
      x: 899,
      y: 660,
      rx: 120,
      ry: 110,
      color: 0xff80c0,
      strength: 0.6,
    },
    {
      name: "robot shadow",
      x: 227,
      y: 772,
      rx: 220,
      ry: 120,
      color: 0x4a4c74,
      strength: 0.8,
    },
  ],
};

const STAGE_LIGHTING: Record<string, StageLighting> = {
  "cyberpunk-street": STREET_LIGHTING,
  "test-indoor": SHOP_LIGHTING,
};

/** The lighting for a stage, or undefined if it has none (no tint). */
export function lightingForStage(stageId: string): StageLighting | undefined {
  return STAGE_LIGHTING[stageId];
}
