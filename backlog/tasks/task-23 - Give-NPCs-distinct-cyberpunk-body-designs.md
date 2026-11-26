---
id: task-23
title: Give NPCs distinct cyberpunk body designs
status: Done
assignee: []
created_date: '2026-11-26 15:42'
updated_date: '2026-11-26 15:48'
labels:
  - sprites
  - art
  - npc
dependencies: []
priority: medium
---

## Description

All NPCs currently share the player's silhouette and differ only by colour, so they are hard to tell apart and don't sell the cyberpunk setting. Each NPC type should have its own build, hair, clothing and cyber details matching its role (Jake the bartender, Maya the street vendor, the mechanic).

## Acceptance Criteria

- [x] Bartender
- [x] customer (Maya) and mechanic each have their own head
- [x] torso
- [x] arm and leg design and a distinct silhouette from the player and each other
- [x] Each NPC design includes at least one cyberpunk detail (implant
- [x] cyber limb
- [x] visor
- [x] goggles
- [x] respirator or neon trim)
- [x] All NPC types still provide 4 directions x idle + 4 walk frames at 32x48 with feet on the ground line
- [x] Asymmetric details (e.g. a cyber arm) stay on the same side of the body in every direction
- [x] Unknown NPC types still fall back to the basic look
- [x] Automated tests cover every design's dimensions and palette keys; lint and build pass

## Implementation Plan

1. Generalise the compositor so a CharacterDesign supplies its parts, limb sizes, joint positions and palette\n2. Move the player into a design and verify its frames are unchanged\n3. Author bartender, Maya and mechanic designs\n4. Render sheets and iterate\n5. Point SpriteGenerator NPC generation at the designs; update tests\n6. Lint, build and check in game

## Implementation Notes

Generalised the sprite compositor so each character is a CharacterDesign (part grids, limb widths, joint positions, boots, hands, palette) and added three cyberpunk NPC designs.

- src/sprites/compositor.ts: compositor from task-22, now design-driven. Front/back parts are auto-centred; arms take per-side styles (character's left/right) and parts can supply an optional sideRight view, so asymmetric details stay on the correct side of the body in all four directions. Player frames verified pixel-identical to before the refactor.
- src/sprites/designs.ts: PLAYER_DESIGN plus
  - bartender (Jake): heavy build, buzz cut + beard, red cyber eye with chrome temple plate, chrome cyber arm on his left, sleeveless vest with neon trim, 4px limbs.
  - customer (Maya): slight build, shorter, neon-pink bob with undercut on her left, cyan wraparound visor, cropped bomber with neon hem, cargo pants, platform boots.
  - mechanic: stocky, neon mohawk, welding goggles, respirator, hazard-orange jumpsuit with reflective stripes and zip, tool belt, heavy gloves.
- SpriteGenerator picks the design by NPC type (unknown types fall back to basic = player look) and passes the palette per texture rather than swapping shared state. NPC_PALETTE_OVERRIDES removed.
- tests/sprites.test.ts replaces PlayerSprites.test.ts: per-design frame count/size/palette keys/rectangular grids/ground line/no edge clipping, distinct NPC silhouettes, and the bartender's cyber arm side in every direction (37 checks).

Files: src/sprites/compositor.ts, src/sprites/designs.ts (new), src/sprites/PlayerSprites.ts (removed), src/SpriteGenerator.ts, tests/sprites.test.ts (new), tests/PlayerSprites.test.ts (removed).
