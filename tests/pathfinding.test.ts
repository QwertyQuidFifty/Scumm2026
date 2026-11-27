import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NavMesh,
  offsetPolygon,
  pointInPolygon,
  type Point,
} from "../src/navigation/pathfinding.ts";

// The shop floor and a box-shaped obstacle in the middle.
const floor: Point[] = [
  { x: 0, y: 0 },
  { x: 400, y: 0 },
  { x: 400, y: 200 },
  { x: 0, y: 200 },
];
const box: Point[] = [
  { x: 150, y: 80 },
  { x: 250, y: 80 },
  { x: 250, y: 120 },
  { x: 150, y: 120 },
];
const mesh = new NavMesh({ walkable: floor, obstacles: [box] });

/** Every leg of the route must stay clear of the obstacle. */
function assertClear(start: Point, path: Point[]) {
  let a = start;
  for (const b of path) {
    for (let t = 0; t <= 1; t += 0.02) {
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      assert.ok(
        !pointInPolygon(p, box),
        `leg passes through box at ${p.x},${p.y}`,
      );
      assert.ok(pointInPolygon(p, floor), `leg leaves floor at ${p.x},${p.y}`);
    }
    a = b;
  }
}

const routeLength = (start: Point, path: Point[]) =>
  path.reduce((acc, p, i) => {
    const a = i === 0 ? start : path[i - 1];
    return acc + Math.hypot(p.x - a.x, p.y - a.y);
  }, 0);

test("walks straight when nothing is in the way", () => {
  const path = mesh.findPath({ x: 20, y: 20 }, { x: 380, y: 30 });
  assert.deepEqual(path, [{ x: 380, y: 30 }]);
});

test("goes around an obstacle instead of through it", () => {
  const start = { x: 100, y: 100 };
  const target = { x: 300, y: 100 };
  const path = mesh.findPath(start, target);
  assert.ok(path && path.length > 1, "expected a detour");
  assert.deepEqual(path.at(-1), target);
  assertClear(start, path);
});

test("the detour hugs the obstacle rather than wandering", () => {
  const start = { x: 100, y: 100 };
  const path = mesh.findPath(start, { x: 300, y: 100 })!;
  // Straight-line distance is 200; around a 40-tall box it should be close.
  assert.ok(
    routeLength(start, path) < 240,
    `route ${routeLength(start, path)}`,
  );
});

test("approaching from below goes round, never through", () => {
  const start = { x: 200, y: 190 };
  const target = { x: 200, y: 20 };
  const path = mesh.findPath(start, target)!;
  assertClear(start, path);
  assert.deepEqual(path.at(-1), target);
});

test("clicking inside an obstacle stops next to it", () => {
  const start = { x: 200, y: 190 };
  const path = mesh.findPath(start, { x: 200, y: 115 })!;
  const end = path.at(-1)!;
  assert.ok(!pointInPolygon(end, box));
  assert.ok(Math.abs(end.y - 120) < 15, `stopped at y=${end.y}`); // just below
  assertClear(start, path);
});

test("targets off the floor are rejected", () => {
  assert.equal(mesh.findPath({ x: 20, y: 20 }, { x: 500, y: 20 }), null);
});

test("isWalkable excludes obstacles and outside the floor", () => {
  assert.equal(mesh.isWalkable({ x: 200, y: 100 }), false);
  assert.equal(mesh.isWalkable({ x: -5, y: 100 }), false);
  assert.equal(mesh.isWalkable({ x: 50, y: 100 }), true);
});

test("with slow vertical movement the route is still clear of the obstacle", () => {
  // A wide, short box: going round its ends is long horizontally, going
  // over the top is short but vertical. With slow vertical movement the
  // cost model should still produce a valid, clear route.
  const wide: Point[] = [
    { x: 60, y: 90 },
    { x: 340, y: 90 },
    { x: 340, y: 110 },
    { x: 60, y: 110 },
  ];
  const slowY = new NavMesh(
    { walkable: floor, obstacles: [wide] },
    { yFactor: 0.2 },
  );
  const start = { x: 200, y: 150 };
  const path = slowY.findPath(start, { x: 200, y: 50 })!;
  assert.ok(path.length >= 2);
  for (const p of path) assert.ok(!pointInPolygon(p, wide));
});

test("routes around a concave floor corner", () => {
  // L-shaped floor: the inner corner at (200,100) blocks the direct line.
  const lShape: Point[] = [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 100 },
    { x: 400, y: 100 },
    { x: 400, y: 200 },
    { x: 0, y: 200 },
  ];
  const lMesh = new NavMesh({ walkable: lShape, obstacles: [] });
  const start = { x: 50, y: 20 };
  const target = { x: 380, y: 150 };
  const path = lMesh.findPath(start, target)!;
  assert.ok(path.length >= 2, "expected to turn the corner");
  let a = start;
  for (const b of path) {
    for (let t = 0; t <= 1; t += 0.02) {
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      assert.ok(pointInPolygon(p, lShape), `left the floor at ${p.x},${p.y}`);
    }
    a = b;
  }
});

test("offsetPolygon grows and shrinks a square by the given amount", () => {
  const grown = offsetPolygon(box, 10);
  assert.deepEqual(grown[0], { x: 140, y: 70 });
  const shrunk = offsetPolygon(box, -5);
  assert.deepEqual(shrunk[2], { x: 245, y: 115 });
});
