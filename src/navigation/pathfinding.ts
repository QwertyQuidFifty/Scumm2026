/**
 * Point-and-click pathfinding over a walkable polygon with obstacle holes.
 *
 * Uses a visibility graph: the nodes are the start, the target, the corners
 * of every obstacle (pushed outwards by a margin) and the inward-pointing
 * (reflex) corners of the walkable area (pushed inwards). Two nodes are
 * connected when the straight line between them stays on the floor and does
 * not pass through an obstacle; Dijkstra then finds the quickest route.
 *
 * The cost of a leg matches how the character moves: horizontal and
 * vertical motion run at different speeds and finish together, so a leg
 * takes max(|dx|, |dy| / yFactor).
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */

export interface Point {
  x: number;
  y: number;
}

export interface NavArea {
  /** The floor the character may walk on. */
  walkable: Point[];
  /** Footprints of props that block walking (holes in the floor). */
  obstacles: Point[][];
}

export interface PathOptions {
  /** How far to keep the character's feet from obstacle edges. */
  margin?: number;
  /** Vertical speed relative to horizontal (the stage's yMovementFactor). */
  yFactor?: number;
}

const DEFAULT_MARGIN = 8;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** How far below the floor a click still walks to the floor above it. */
export const BELOW_FLOOR_REACH = 160;

export function pointInPolygon(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** True when segments ab and cd cross at a single interior point. */
function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  const eps = 1e-9;
  return (
    ((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps)) &&
    ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps))
  );
}

function edges(polygon: Point[]): [Point, Point][] {
  return polygon.map((p, i) => [p, polygon[(i + 1) % polygon.length]]);
}

function signedArea(polygon: Point[]): number {
  let area = 0;
  for (const [a, b] of edges(polygon)) area += a.x * b.y - b.x * a.y;
  return area / 2;
}

/**
 * Move each corner of a polygon outwards (positive amount) or inwards
 * (negative) along its corner bisector so edges shift by about `amount`.
 */
export function offsetPolygon(polygon: Point[], amount: number): Point[] {
  const orientation = signedArea(polygon) > 0 ? 1 : -1;
  const n = polygon.length;
  return polygon.map((p, i) => {
    const prev = polygon[(i - 1 + n) % n];
    const next = polygon[(i + 1) % n];
    // Outward normals of the two edges meeting at p.
    const normal = (a: Point, b: Point): Point => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: (dy / len) * orientation, y: (-dx / len) * orientation };
    };
    const n1 = normal(prev, p);
    const n2 = normal(p, next);
    const bis = { x: n1.x + n2.x, y: n1.y + n2.y };
    const len = Math.hypot(bis.x, bis.y) || 1;
    // Scale so that both adjacent edges move by `amount` (capped for spikes).
    const cosHalf = Math.max(0.35, (bis.x * n1.x + bis.y * n1.y) / len);
    const k = amount / cosHalf / len;
    return { x: p.x + bis.x * k, y: p.y + bis.y * k };
  });
}

/** Closest point to p on segment ab. */
function closestOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t =
    len2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return { x: a.x + dx * t, y: a.y + dy * t };
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export class NavMesh {
  private readonly walkable: Point[];
  /** Obstacles grown by half the margin: what actually blocks lines. */
  private readonly blockers: Point[][];
  /** Obstacles grown by the full margin: where route corners go. */
  private readonly padded: Point[][];
  private readonly yFactor: number;
  private readonly waypoints: Point[];

  constructor(area: NavArea, options: PathOptions = {}) {
    const margin = options.margin ?? DEFAULT_MARGIN;
    this.walkable = area.walkable;
    this.yFactor = options.yFactor ?? 1;
    this.blockers = area.obstacles.map((o) => offsetPolygon(o, margin / 2));
    this.padded = area.obstacles.map((o) => offsetPolygon(o, margin));

    // Route corners: padded obstacle corners plus reflex walkable corners
    // nudged inwards, kept only if a character could stand there.
    const reflex = this.reflexCorners(margin);
    this.waypoints = [...this.padded.flat(), ...reflex].filter((p) =>
      this.isWalkable(p),
    );
  }

  /** On the floor and not inside any obstacle. */
  isWalkable(p: Point): boolean {
    return (
      pointInPolygon(p, this.walkable) &&
      !this.blockers.some((b) => pointInPolygon(p, b))
    );
  }

  isOnFloor(p: Point): boolean {
    return pointInPolygon(p, this.walkable);
  }

  /**
   * For a point below the floor (the near ground in front of it): the
   * floor directly above, if it is within BELOW_FLOOR_REACH. Points beside
   * or above the floor (walls, sky) have none.
   */
  floorAbove(p: Point): Point | null {
    for (let up = 1; up <= BELOW_FLOOR_REACH; up++) {
      const q = { x: p.x, y: p.y - up };
      if (this.isOnFloor(q)) {
        // Step a little further in so the point isn't on the very edge.
        const inside = { x: p.x, y: q.y - 2 };
        return this.isOnFloor(inside) ? inside : q;
      }
    }
    return null;
  }

  /** The obstacle footprints as used for blocking (for debug drawing). */
  getBlockers(): Point[][] {
    return this.blockers.map((b) => b.map((p) => ({ ...p })));
  }

  /** Can the character walk straight from a to b? */
  hasLineOfSight(a: Point, b: Point): boolean {
    for (const [c, d] of edges(this.walkable)) {
      if (segmentsCross(a, b, c, d)) return false;
    }
    for (const blocker of this.blockers) {
      for (const [c, d] of edges(blocker)) {
        if (segmentsCross(a, b, c, d)) return false;
      }
    }
    // A line can run through an obstacle without crossing an edge if both
    // ends sit on its corners; check a few points along it as well.
    for (const t of [0.25, 0.5, 0.75]) {
      const m = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (!this.isOnFloor(m)) return false;
      if (this.blockers.some((bl) => pointInPolygon(m, bl))) return false;
    }
    return true;
  }

  /**
   * Where to go when the clicked point is inside an obstacle: the nearest
   * point just outside its padded outline that is on the floor.
   */
  nearestReachable(clicked: Point): Point | null {
    if (this.isWalkable(clicked)) return clicked;
    const target = this.isOnFloor(clicked) ? clicked : this.floorAbove(clicked);
    if (!target) return null;
    if (this.isWalkable(target)) return target;

    let best: Point | null = null;
    let bestDist = Infinity;
    for (const outline of this.padded) {
      for (const [a, b] of edges(outline)) {
        const q = closestOnSegment(target, a, b);
        const d = Math.hypot(q.x - target.x, q.y - target.y);
        if (d < bestDist && this.isWalkable(q)) {
          best = q;
          bestDist = d;
        }
      }
    }
    return best;
  }

  /** Time-like cost of walking straight from a to b. */
  cost(a: Point, b: Point): number {
    return Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y) / this.yFactor);
  }

  /**
   * Route from start to target as a list of points to walk to in turn
   * (start excluded, the final point last). Returns null when the target is
   * off the floor or cannot be reached.
   */
  findPath(start: Point, target: Point): Point[] | null {
    const goal = this.nearestReachable(target);
    if (!goal) return null;
    if (this.hasLineOfSight(start, goal)) return [goal];

    // Nodes: 0 = start, 1 = goal, then the waypoints.
    const nodes = [start, goal, ...this.waypoints];
    const dist = new Array<number>(nodes.length).fill(Infinity);
    const prev = new Array<number>(nodes.length).fill(-1);
    const done = new Array<boolean>(nodes.length).fill(false);
    dist[0] = 0;

    for (;;) {
      let u = -1;
      for (let i = 0; i < nodes.length; i++) {
        if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i;
      }
      if (u === -1 || dist[u] === Infinity) return null;
      if (u === 1) break;
      done[u] = true;
      for (let v = 1; v < nodes.length; v++) {
        if (done[v] || v === u) continue;
        const alt = dist[u] + this.cost(nodes[u], nodes[v]);
        if (alt < dist[v] && this.hasLineOfSight(nodes[u], nodes[v])) {
          dist[v] = alt;
          prev[v] = u;
        }
      }
    }

    const path: Point[] = [];
    for (let v = 1; v !== 0; v = prev[v]) path.unshift(nodes[v]);
    return path;
  }

  /** Corners of the walkable area that point into the floor, moved inwards. */
  private reflexCorners(margin: number): Point[] {
    const poly = this.walkable;
    const orientation = signedArea(poly) > 0 ? 1 : -1;
    const inset = offsetPolygon(poly, -margin);
    return poly
      .map((p, i) => {
        const prev = poly[(i - 1 + poly.length) % poly.length];
        const next = poly[(i + 1) % poly.length];
        const isReflex = cross(prev, p, next) * orientation < 0;
        return isReflex ? inset[i] : null;
      })
      .filter((p): p is Point => p !== null);
  }
}
