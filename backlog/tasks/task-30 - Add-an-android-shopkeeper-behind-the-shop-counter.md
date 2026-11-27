---
id: task-30
title: Add an android shopkeeper behind the shop counter
status: Done
assignee: []
created_date: '2026-11-27 10:35'
updated_date: '2026-11-27 10:40'
labels:
  - graphics
  - npc
dependencies: []
priority: medium
---

## Description

The shop has a counter with an empty, shadowy space behind it. A shopkeeper standing there needs the counter drawn in front of them (a walk-behind), and an android fits the setting.

## Acceptance Criteria

- [x] The shop counter (including the cash register) is drawn in front of characters standing behind it and behind the player everywhere on the floor
- [x] The walk-behind is cut from the background art at runtime and lines up exactly with the painted counter
- [x] An android shopkeeper with its own design (shell / glowing visor / LED mouth grille / antenna) stands behind the counter facing the room with only its upper body visible
- [x] The shopkeeper can be talked to and looked at from in front of the counter and uses the talking and idle animations (visor dims to blink / grille lights when talking)
- [x] Tests cover the walk-behind mask and the new design; lint and build pass

## Implementation Plan

1. Pure walk-behind module: definitions (polygon in background coords and depth line) and polygon pixel mask\n2. Render walk-behinds per stage from the background texture; register at their depth line\n3. Android design (all views) with blinkSwap and talkSwap\n4. Shop NPC behind the counter with dialogue and an interaction point\n5. Tests, lint, build, verify in game

## Implementation Notes

Added a walk-behind for the shop counter and an android shopkeeper standing behind it.

- src/effects/walkBehinds.ts (new, pure): walk-behind definitions (polygon in background coords + depth line in world coords) and cutPolygon. SHOP_COUNTER traces the counter front, its top edge and the cash register; depth line 607 (its base + the 40px background offset), above the shop floor's top (613), so the player is always in front.
- src/effects/WalkBehindLayer.ts (new): cuts the polygons out of the background texture and positions sprites over the painted counter; StageManager registers them with the depth manager at their depth line and removes them on stage cleanup.
- designs.ts: ANDROID_DESIGN (pale shell, chrome joints/limbs, cyan visor that dims to blink, LED mouth grille that lights when talking via talkSwap, antenna, amber chest light); CHARACTER_DESIGNS.android.
- StageManager: shop NPC 'shopkeeper' (Unit K-7) at (435, 525) behind the counter facing the room, four lines, interaction point (590, 632) beside the counter so the player faces it from the side without blocking it.
- Speech placement: speechAnchorY puts text just above a character's head using its scaled height (was a fixed 60px offset, which overlapped faces at the shop's 260px scale). Used for all NPC lines and the player's lines.
- tests/walkBehinds.test.ts: polygon cutting, offsets, clipping, counter depth vs floor (127 checks total). Docs updated.

Verified in game: the counter hides the android below the chest and is drawn behind the player; talking to Unit K-7 walks the player to the side of the counter, they face it, and the line appears above its head; Jake's speech on the street sits just above his head.

Files: src/effects/walkBehinds.ts, src/effects/WalkBehindLayer.ts, src/sprites/designs.ts, src/StageManager.ts, src/SpeechBubble.ts, src/NPC.ts, src/Game.ts, docs/current-features-summary.md, tests/walkBehinds.test.ts.
