---
id: task-27
title: Walk around obstacles with pathfinding
status: Done
assignee: []
created_date: '2026-11-27 07:33'
updated_date: '2026-11-27 07:37'
labels:
  - navigation
  - movement
dependencies: []
priority: high
---

## Description

The player walks in a straight line to wherever they click, passing straight through props like the shop stool, and can stand inside them, which also breaks front/behind drawing order. Props on the floor should block walking, and the player should route around them like in classic adventure games.

## Acceptance Criteria

- [x] Stages can define obstacle footprints that are removed from the walkable area
- [x] The player cannot walk through or stop inside an obstacle and instead takes the shortest route around it
- [x] Clicking on an obstacle walks the player to the nearest reachable point next to it
- [x] Routes respect the stage's slower vertical movement when choosing the shortest path
- [x] The shop stool has a footprint under its legs and its drawing order matches that footprint so the player is behind it from above and in front of it from below
- [x] A debug key draws the walkable area / obstacles / current route
- [x] Movement on the street and existing interactions (doors / NPCs / objects) behave as before
- [x] Pathfinding is covered by unit tests; lint and build pass

## Implementation Plan

1. Pure pathfinding module: visibility graph over inflated obstacle corners and reflex walkable corners, line-of-sight against walkable edges and obstacles, Dijkstra with a time-based cost (y movement factor), nearest reachable point for blocked targets\n2. Unit tests for straight lines, detours, blocked targets, y-weighting\n3. CharacterController follows a list of waypoints; arrival still reported once the last leg ends\n4. Stage.obstacles + stool footprint; overlay depth line taken from the footprint\n5. W key draws walkable area / obstacles / route\n6. Lint, build; verify in game from all sides of the stool

## Implementation Notes

Added obstacle-aware pathfinding for the player and gave the shop stool a floor footprint.

- src/navigation/pathfinding.ts (new): NavMesh over a walkable polygon with obstacle holes. Visibility graph whose nodes are the start, target, obstacle corners pushed out by a margin, and reflex walkable corners pushed in; line of sight blocks on walkable edges and (half-margin) obstacles; Dijkstra with cost max(|dx|, |dy|/yFactor) to match how the character moves. Targets inside an obstacle snap to the nearest walkable point on its padded outline; targets off the floor return null as before.
- CharacterController: builds the NavMesh lazily (rebuilt on walkable area / obstacles / y factor change); moveTo walks a route leg by leg, facing each leg's direction; isMoving stays true until the last leg so pending actions fire on final arrival. isPositionWalkable now also excludes obstacles. setObstacles, getNavMesh, getRoute.
- Stage.obstacles; the shop stage uses STOOL_FOOTPRINT (quad under the four legs, measured from the image). Inline overlays can set depthY; the stool's depth line moved from its image bottom (700) to the footprint middle (669), so the player is drawn behind it from above and in front from below.
- Game: passes obstacles on load and stage transition; W key toggles a debug drawing of walkable area, obstacles and the live route.
- docs/current-features-summary.md: movement section updated.
- tests/pathfinding.test.ts: straight lines, detours, approach from below, clicks inside obstacles, off-floor targets, y-weighting, concave floors, polygon offsetting (70 checks total).

Verified in game: walking left-to-right across the stool routes around its front corner and the player is drawn in front; walking behind it the stool is drawn over the player's legs; street movement and talking to Jake unchanged.

NPCs still move in straight lines (no obstacles where they walk today).

Files: src/navigation/pathfinding.ts, src/CharacterController.ts, src/Stage.ts, src/StageManager.ts, src/StageOverlayAssets.ts, src/Game.ts, docs/current-features-summary.md, tests/pathfinding.test.ts.

Follow-up (stool front edge): the player walking in front of the stool looked higher than its front legs. Measured: the sprite anchor is exactly at the feet position, but character frames had 2 blank rows under the sole outline and the sole/outline rows are near-black on the dark floor, so visible boots ended ~6 sprite px (~32 game px at shop scale) above the feet line. Fixes: compositor now drops finished frames 2 rows so the sole outline is the sprite's last row (feet sit on the character's position everywhere; idle/walk/talk art otherwise unchanged), and the stool footprint's front edge moved 12px lower (685/674 -> 697/686). Verified in game: walking in front, the boots are below the stool's front legs and the player is drawn in front.
