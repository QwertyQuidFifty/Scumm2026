---
id: task-26
title: Redraw the open shop door overlay
status: Done
assignee: []
created_date: '2026-11-27 06:56'
updated_date: '2026-11-27 06:58'
labels:
  - graphics
  - overlay
dependencies: []
priority: medium
---

## Description

Opening the building entrance on the street shows a flat dark quad over the whole entrance, including the glass transom above the door, which looks crude next to the pixel-art background. The open state should look like a lit doorway into the shop.

## Acceptance Criteria

- [x] The open-door overlay is pixel art at the background's pixel scale and fills exactly the building entrance's door polygon (same shape, size and position)
- [x] The open doorway shows a lit interior and the door leaf swung inward
- [x] Light from the shop spills onto the pavement in front of the door and stays behind characters
- [x] Opening and walking through the door still work as before
- [x] Tests cover the generated art; lint and build pass

## Implementation Plan

1. Generate the doorway art procedurally from the frame geometry (opening, frame, door leaf, interior light, pavement spill) as a palette grid with alpha\n2. Add a pixel-art overlay asset type and texture builder\n3. Replace the polygon door overlay with it\n4. Tests, lint, build; check open/close and transition in game

## Implementation Notes

Replaced the flat dark polygon shown over the whole building entrance with generated pixel art of a lit, open doorway.

- src/overlays/openDoorway.ts (new): builds the art at 4 game units per pixel (the background's pixel size) to fill exactly the door polygon, which it now exports (DOOR / DOOR_POLYGON) so the clickable door in StageManager uses the same shape. Inside it: a dark frame along the top and sides, the door leaf swung inward with a lit edge, a red-lit interior with a glimpse of the OPEN sign, dithered colour bands, and a translucent pool of light on the pavement.
- StageOverlayAssets: new 'pixelart' asset type and createPixelArtTexture (per-colour alpha); the door overlay is now built from openDoorway. The polygon type remains supported but is unused.
- StageManager: loads pixelart overlays.
- tests/openDoorway.test.ts: palette keys, rectangular rows, required features, translucent light, exact polygon fill, shared polygon, bounds (60 checks total).

Verified in game: Open shows the lit doorway behind characters; walking through still enters the shop.

Stool: could not reproduce it missing (shows on first and repeat visits, locally and on the live site); asked the user for steps.

Files: src/overlays/openDoorway.ts, src/StageOverlayAssets.ts, src/StageManager.ts, tests/openDoorway.test.ts.
