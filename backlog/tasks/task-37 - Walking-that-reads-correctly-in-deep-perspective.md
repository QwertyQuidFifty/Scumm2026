---
id: task-37
title: Walking that reads correctly in deep perspective
status: Done
assignee:
  - '@claude'
created_date: '2026-11-28 02:45'
updated_date: '2026-11-28 02:48'
labels: []
dependencies: []
---

## Description

On the street the player often faces sideways while mostly climbing up the screen, far-away sprites zip sideways as fast as close ones, and the front of the street has a band where the player moves without changing size.

## Acceptance Criteria

- [x] The player faces up or down when a leg's walking time is mostly depth and sideways when it is mostly across
- [x] Walking speed scales with the sprite's perspective size
- [x] The street's walkable floor lies entirely within its perspective scaling range
- [x] Clicking the street below the walkable floor walks to the floor directly above the click

## Implementation Plan

1. Pure walking helpers: facing by time per axis, speed factor from scale\n2. CharacterController advances legs per frame at a speed set by the current scale\n3. Trim the street floor to y=740 and extend scaling to it\n4. NavMesh snaps below-floor clicks up onto the floor\n5. Tests, lint, build, check in game

## Implementation Notes

Walking now reads as depth on the deep street view.\n\n- src/navigation/walking.ts (pure): facingFor() picks the facing by which axis takes more walking time (|dx| vs |dy| / yFactor), so a leg that is mostly climbing faces away even if it covers more pixels across. speedFactorAt() gives walking speed in proportion to the character's perspective size, relative to the front of the stage (min 0.35 so the far end isn't a crawl); constant-size stages like the shop are unchanged.\n- CharacterController advances each leg per frame at the speed for the player's current y (progress-based instead of a fixed duration), and uses facingFor for each leg. Game passes the stage's perspective range on load and on stage change.\n- Street: walkable floor trimmed from y=803 to y=740 and the perspective range extended to 740 with the same growth rate (236px at the front), so size changes everywhere you can walk; existing sizes at y<=713 are unchanged.\n- NavMesh.floorAbove(): clicks up to 160px below the floor walk to the floor directly above; sky/wall clicks are still ignored.\n- Tests: tests/walking.test.ts, two new pathfinding tests.\n\nNPC walking (debug keys only) is unchanged.
