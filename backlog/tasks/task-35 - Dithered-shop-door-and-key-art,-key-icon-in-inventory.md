---
id: task-35
title: 'Dithered shop door and key art, key icon in inventory'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-27 13:08'
updated_date: '2026-11-27 13:13'
labels: []
dependencies: []
---

## Description

The closed shop door and the golden key look flat next to the dithered pixel-art backgrounds, and the key shows as the text KEY in the inventory instead of its picture.

## Acceptance Criteria

- [x] Closed shop door shading uses visible dithering between steel tones
- [x] Golden key is pixel art with dithered gold shading
- [x] Key in the inventory shows the same key art as in the scene
- [x] Door still fills exactly its polygon and stays opaque

## Implementation Plan

1. Add an ordered-dither helper\n2. Shade the closed door with dithered gradients\n3. Build the key as pixel art with dithered shading\n4. Render that art in the scene and in the inventory slot\n5. Tests, lint, build, check in game

## Implementation Notes

Added an ordered (4x4 Bayer) dither helper (src/sprites/dither.ts) and used it for the generated art.\n\n- Closed shop door (src/overlays/closedDoor.ts): steel shaded with a top-left light, dithered across three steel tones; dithered lit edge, window glow from a hot spot, red neon spill below the window, and a kick plate with a lit top edge fading to scuffs. Still fills exactly its polygon and stays opaque.\n- Golden key (src/sprites/keyArt.ts): new 24x12 pixel-art key (ring bow, collar, shaft, notched bit), outlined, with bevelled, dithered gold shading and a glint. At pixel size 2 it fills the key's 48x24 click area.\n- KeySprite now draws that art (drawPixelArt helper). Inventory items can carry iconArt; the slot draws it centred instead of the text icon, and the golden key uses the same art at pixel size 3.\n- Tests: tests/keyArt.test.ts (dither, key art), extra dithering test in tests/closedDoor.test.ts.
