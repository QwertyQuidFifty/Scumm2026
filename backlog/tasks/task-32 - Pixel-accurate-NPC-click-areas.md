---
id: task-32
title: Pixel-accurate NPC click areas
status: Done
assignee: []
created_date: '2026-11-27 11:31'
updated_date: '2026-11-27 11:32'
labels:
  - npc
  - input
dependencies: []
priority: medium
---

## Description

NPCs are clickable anywhere in their sprite's full rectangle, which is much bigger than the character. Maya's rectangle covers the street door, so clicks meant for the door go to her instead.

## Acceptance Criteria

- [x] An NPC only counts as clicked or hovered when the pointer is on (or within one sprite pixel of) its drawn pixels
- [x] The lower half of the street door can be clicked while Maya stands in front of it
- [x] Clicking on an NPC's body still works for every NPC and facing
- [x] Hit testing is covered by unit tests; lint and build pass

## Implementation Plan

1. Remember each character texture's pixel rows when it is generated\n2. Pure hit test: map a point to a sprite pixel and check for drawn pixels within a 1-pixel margin\n3. NPC.containsPoint uses it (falls back to the rectangle if no pixel data)\n4. Tests, lint, build; click the door past Maya in game

## Implementation Notes

NPC click and hover detection now uses the character's drawn pixels instead of the whole sprite rectangle.

- src/sprites/hitTest.ts (new, pure): gridCellAt maps a world point to a cell of the 32x48 frame grid (anchor, scale and texture size aware); hitsDrawnPixel checks for a drawn pixel within a 1-cell margin; spriteHit combines them.
- SpriteGenerator: remembers the pixel rows each generated texture was drawn from (WeakMap) and exposes pixelRowsFor(texture).
- NPC.containsPoint: rectangle check first, then pixel test on the current frame (falls back to the rectangle if a texture has no pixel data). Applies to every NPC, so Jake and the shopkeeper also stop catching clicks in empty space.
- tests/hitTest.test.ts: grid mapping, margin, Maya's body hit in all directions, empty space not hit, most of the rectangle not clickable (138 checks total).

Verified in game: clicking low on the street door (where Maya's rectangle used to intercept it) opens the door; clicking Maya's body still talks to her.

Files: src/sprites/hitTest.ts, src/SpriteGenerator.ts, src/NPC.ts, tests/hitTest.test.ts.
