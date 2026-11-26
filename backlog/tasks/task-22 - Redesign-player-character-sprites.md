---
id: task-22
title: Redesign player character sprites
status: Done
assignee: []
created_date: '2026-11-26 15:26'
updated_date: '2026-11-26 15:34'
labels:
  - sprites
  - art
dependencies: []
priority: high
---

## Description

The current 32x48 player sprites are flat placeholders (no outline or shading, block head, back view shows a face, near-static walk cycle) and clash with the painted neon backgrounds. Redraw the full 4-direction set so the character reads clearly and fits the art style.

## Acceptance Criteria

- [x] All 20 player frames (4 directions x idle + 4 walk) are redrawn with a dark outline and 2-3 tone shading
- [x] Back-facing frames show the back of the head (hair) not a face
- [x] Walk cycles show clearly distinct contact and passing poses with a 1px body bob
- [x] Every frame is exactly 32x48 and uses only colour keys defined in the palette
- [x] NPC variants (basic/bartender/customer/mechanic) still render with distinct colour schemes
- [x] An automated test fails if any frame has wrong dimensions or an undefined colour key
- [x] Lint and production build pass

## Implementation Plan

1. Move player sprite data into a new module built from layered parts (head, torso+arms, legs) per direction, composed onto a 32x48 canvas with per-frame offsets\n2. Define an extended palette (outline, skin/hair/jacket ramps, neon accent)\n3. Render sprite sheets offline and iterate on the art\n4. Point SpriteGenerator at the new frames and palette; remap NPC palettes to the new keys\n5. Add a node:test validation test (dimensions + palette keys)\n6. Lint, tsc, build; check in the running game

## Implementation Notes

Replaced the 20 hand-typed sprite grids with a layered compositor in src/sprites/PlayerSprites.ts. Each frame is built from fill-only parts (head, coat, arms, legs, boots) stamped back-to-front onto a 32x48 canvas; the compositor adds a 1px outline around every part so overlaps get separation lines automatically. Limbs are rasterised from joint positions, so walk poses come from a small pose table (contact frames walk1/walk3, passing frames walk2/walk4 with 1px bob). Left frames mirror the right ones.

- New 18-colour palette with highlight/base/shade ramps (orange hair, brown leather coat, cyan neon trim, magenta shirt) chosen to read against the neon backgrounds.
- Back view shows the back of the head and a coat emblem.
- NPC variants are palette overrides of the new keys (NPC_PALETTE_OVERRIDES); silhouettes are still shared.
- SpriteGenerator.ts reduced to texture generation; unused non-renderer generateCharacterSprites()/createTextureFromPixelData removed. Missing palette keys now render magenta instead of silently black.
- tests/PlayerSprites.test.ts (node:test via npm test): frame count, 32x48 size, palette keys, NPC override keys, distinct walk frames, feet on ground line.
- Added .claude/launch.json for the dev server.

Files: src/sprites/PlayerSprites.ts (new), src/SpriteGenerator.ts, tests/PlayerSprites.test.ts (new), package.json (test script), .claude/launch.json (new).
