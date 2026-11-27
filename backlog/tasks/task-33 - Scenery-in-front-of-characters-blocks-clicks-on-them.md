---
id: task-33
title: Scenery in front of characters blocks clicks on them
status: Done
assignee: []
created_date: '2026-11-27 11:40'
updated_date: '2026-11-27 11:42'
labels:
  - input
  - npc
  - depth
dependencies: []
priority: medium
---

## Description

Clicks only check whether a point is on a character, not whether something drawn in front of the character covers that point. The shop counter hides the android's lower body, yet clicking the counter's front talks to the android. Any scenery that is depth-sorted in front of a character should take the click there.

## Acceptance Criteria

- [x] Clicking a part of an NPC that is hidden behind a walk-behind (e.g. the android's body behind the counter) does not select that NPC
- [x] Visible parts of the NPC above the counter still select it
- [x] When NPCs overlap the one drawn in front gets the click
- [x] The rule is shared (a scenery shape plus a depth line) so other walk-behinds or props can use it
- [x] Covered by unit tests; lint and build pass

## Implementation Plan

1. walkBehinds: coveringScenery(stage, point, depth) using the walk-behind polygon in world coords\n2. NPCManager: occlusion check + pick the front-most NPC\n3. StageManager wires the check for the current stage\n4. Tests, lint, build; click counter vs android head in game

## Implementation Notes

Clicks now respect what is drawn in front.

- walkBehinds.ts: walkBehindCovers (polygon in game coords, background offset applied) and coveringScenery(stage, x, y, depthY) - scenery whose depth line is in front of depthY and covers the point.
- NPCManager: setOcclusionCheck; getNPCAtPosition skips NPCs whose clicked pixel is covered by scenery in front of them and returns the front-most (largest y) NPC when several overlap (previously list order).
- StageManager.setNPCManager wires the check for the current stage. The check is a shape plus depth line, so other walk-behinds automatically take part; other props (e.g. inline overlays) can be added to the same check later.
- tests/walkBehinds.test.ts: covering counter/register, not above the counter top, never for things in front, background offset, street (143 checks total). Docs updated.

Verified in game: with Talk selected, clicking the counter front where the android is hidden does nothing; clicking its head talks to it.

Files: src/effects/walkBehinds.ts, src/NPCManager.ts, src/StageManager.ts, docs/current-features-summary.md, tests/walkBehinds.test.ts.
