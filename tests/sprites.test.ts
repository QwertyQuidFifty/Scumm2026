import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCharacterFrames,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  TRANSPARENT,
  type CharacterDesign,
  type PartViews,
} from "../src/sprites/compositor.ts";
import { CHARACTER_DESIGNS, PLAYER_DESIGN } from "../src/sprites/designs.ts";

const DIRECTIONS = ["up", "down", "left", "right"] as const;
const WALK_NAMES = ["idle", "walk1", "walk2", "walk3", "walk4"];
const TALK_NAMES = ["talk1", "talk2", "talk3"];
const FRAME_NAMES = [...WALK_NAMES, ...TALK_NAMES];

/** One frame's pixel rows joined into a single string, for comparison. */
function frameData(
  frames: ReturnType<typeof buildCharacterFrames>,
  dir: (typeof DIRECTIONS)[number],
  name: string,
): string {
  const frame = frames[dir].find((f) => f.name === name);
  assert.ok(frame, `${dir}/${name} missing`);
  return frame.data.join("\n");
}

const designs: [string, CharacterDesign][] = [
  ["player", PLAYER_DESIGN],
  ...Object.entries(CHARACTER_DESIGNS),
];

for (const [name, design] of designs) {
  describe(`${name} design`, () => {
    const frames = buildCharacterFrames(design);

    test("has idle, 4 walk and 3 talk frames in every direction", () => {
      for (const dir of DIRECTIONS) {
        assert.deepEqual(
          frames[dir].map((f) => f.name),
          FRAME_NAMES,
        );
      }
    });

    test("every frame is exactly 32x48", () => {
      for (const dir of DIRECTIONS) {
        for (const frame of frames[dir]) {
          assert.equal(frame.data.length, SPRITE_HEIGHT);
          for (const row of frame.data) assert.equal(row.length, SPRITE_WIDTH);
        }
      }
    });

    test("every pixel uses a defined palette key", () => {
      for (const dir of DIRECTIONS) {
        for (const frame of frames[dir]) {
          frame.data.forEach((row, y) => {
            for (const key of row) {
              assert.ok(
                key === TRANSPARENT || key in design.palette,
                `${dir}/${frame.name} row ${y}: unknown colour key "${key}"`,
              );
            }
          });
        }
      }
    });

    test("part grids are rectangular", () => {
      const parts: [string, PartViews][] = [
        ["head", design.head],
        ["torso", design.torso],
      ];
      for (const [part, views] of parts) {
        for (const view of ["front", "back", "side", "sideRight"] as const) {
          const rows = views[view];
          if (!rows) continue;
          const widths = new Set(rows.map((r) => r.length));
          assert.equal(widths.size, 1, `${part}.${view} has ragged rows`);
        }
      }
    });

    test("walk frames differ from idle and from each other", () => {
      for (const dir of DIRECTIONS) {
        const joined = WALK_NAMES.map((n) => frameData(frames, dir, n));
        assert.equal(new Set(joined).size, joined.length, dir);
      }
    });

    test("talk frames are distinct poses wherever the face is visible", () => {
      for (const dir of ["down", "left", "right"] as const) {
        const joined = ["idle", ...TALK_NAMES].map((n) =>
          frameData(frames, dir, n),
        );
        assert.equal(new Set(joined).size, joined.length, dir);
      }
    });

    test("talk frames keep the legs exactly as in idle", () => {
      for (const dir of DIRECTIONS) {
        const legs = (n: string) =>
          frameData(frames, dir, n).split("\n").slice(34).join("\n");
        for (const n of TALK_NAMES) {
          assert.equal(legs(n), legs("idle"), `${dir}/${n}`);
        }
      }
    });

    test("the outline under the feet is the sprite's bottom row in every frame", () => {
      for (const dir of DIRECTIONS) {
        for (const frame of frames[dir]) {
          const lowest = frame.data.findLastIndex((row) => /[^0]/.test(row));
          assert.equal(lowest, SPRITE_HEIGHT - 1, `${dir}/${frame.name}`);
        }
      }
    });

    test("nothing is clipped at the canvas edges", () => {
      for (const dir of DIRECTIONS) {
        for (const frame of frames[dir]) {
          const edges = [
            frame.data[0],
            ...frame.data.map((r) => r[0] + r[SPRITE_WIDTH - 1]),
          ].join("");
          assert.match(edges, /^0+$/, `${dir}/${frame.name}`);
        }
      }
    });
  });
}

test("NPC types have distinct silhouettes from the player and each other", () => {
  const silhouettes = Object.entries(CHARACTER_DESIGNS)
    .filter(([, d]) => d !== PLAYER_DESIGN)
    .map(([type, d]) => [
      type,
      buildCharacterFrames(d)
        .down[0].data.map((r) => r.replace(/[^0]/g, "#"))
        .join("\n"),
    ]);
  const player = buildCharacterFrames(PLAYER_DESIGN)
    .down[0].data.map((r) => r.replace(/[^0]/g, "#"))
    .join("\n");
  const all = [player, ...silhouettes.map(([, s]) => s)];
  assert.equal(new Set(all).size, all.length);
});

test("asymmetric cyber arm stays on the bartender's left in every view", () => {
  const d = CHARACTER_DESIGNS.bartender;
  const f = buildCharacterFrames(d);
  const hasChrome = (rows: string[], from: number, to: number) =>
    rows.some((r) => r.slice(from, to).includes("M"));
  const armRows = (rows: string[]) => rows.slice(d.arms.shoulderY + 1, 30);
  // Front: his left arm is on screen-right; back: on screen-left.
  assert.ok(hasChrome(armRows(f.down[0].data), 16, 32));
  assert.ok(!hasChrome(armRows(f.down[0].data), 0, 16));
  assert.ok(hasChrome(armRows(f.up[0].data), 0, 16));
  assert.ok(!hasChrome(armRows(f.up[0].data), 16, 32));
  // Facing right shows his left (chrome) side; facing left shows skin only.
  assert.ok(hasChrome(armRows(f.right[0].data), 0, 32));
  assert.ok(!hasChrome(armRows(f.left[0].data), 0, 32));
});
