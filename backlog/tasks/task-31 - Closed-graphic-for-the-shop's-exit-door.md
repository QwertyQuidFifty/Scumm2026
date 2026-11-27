---
id: task-31
title: Closed graphic for the shop's exit door
status: Done
assignee: []
created_date: '2026-11-27 10:53'
updated_date: '2026-11-27 10:56'
labels:
  - graphics
  - overlay
dependencies: []
priority: medium
---

## Description

Inside the shop the exit door is painted open in the background, so it always looks open even though it should behave like a door. It needs a closed state that matches the room's pixel art and works like the street entrance.

## Acceptance Criteria

- [x] Inside the shop the exit door shows a closed pixel-art door that fills exactly the exit door's clickable polygon
- [x] Using Open on the door toggles it between the closed graphic and the painted open doorway
- [x] Walking out only works while the door is open; otherwise the player says the door is closed
- [x] The street entrance behaves exactly as before
- [x] Door art and open/closed state logic are covered by tests; lint and build pass

## Implementation Plan

1. Generate the closed door art from a shared exit-door polygon (also used by the clickable object)\n2. Overlays declare whether they depict the open or closed state; overlay manager answers whether an object is open\n3. Generalise the street-door special cases in Game to any door with an open/close overlay\n4. Exit door Open response no longer claims to leave\n5. Tests, lint, build; check both doors in game

## Implementation Notes

Added a closed state for the shop's exit door, which the background paints open.

- src/overlays/closedDoor.ts (new, pure): generated pixel art of a dark steel security door (frame, barred window glowing with the street's neon, recessed panels in perspective, push bar, green keypad light, kick plate) that fills exactly SHOP_EXIT_POLYGON; the clickable exit door in StageManager now uses that polygon.
- src/overlays/doorState.ts (new, pure): isDoorOpen(depicts, visible). Door overlays declare whether they depict the open or closed state (StageOverlayData.depicts, default open); StageOverlayManager.isObjectOpen answers for any door.
- Game: the street-entrance special cases are generalised to any door with an open/close overlay: Open toggles it, walking through requires it open (otherwise 'The door is closed. I need to open it first.').
- StageOverlayAssets: shop-exit-door-closed overlay (visible by default, depicts closed). ActionResponseSystem: exit door Open no longer says it steps outside.
- Both doors start closed when you arrive in a room (door state is not shared between rooms).
- tests/closedDoor.test.ts: exact polygon fill, shared polygon, opacity, door state logic (133 checks total).

Verified in game: the shop shows the closed door; walking at it gives the closed message; Open reveals the painted doorway; walking out returns to the street; the street entrance still opens and lets you in.

Files: src/overlays/closedDoor.ts, src/overlays/doorState.ts, src/StageOverlay.ts, src/StageOverlayAssets.ts, src/StageManager.ts, src/Game.ts, src/ActionResponseSystem.ts, tests/closedDoor.test.ts.

Follow-up: the door top was flat; the painted frame rises to the right. SHOP_EXIT_DOOR.topRight moved 258 -> 228 so the top and bottom edges converge near the room eye level (y~406) far left. The clickable polygon and the art (window, panels, push bar) follow automatically. Verified in game.
