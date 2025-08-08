---
id: task-14
title: Create stage management system foundation
status: Done
assignee: []
created_date: '2025-08-08 13:41'
updated_date: '2025-08-08 13:59'
labels:
  - multi-stage
  - refactor
dependencies: []
priority: high
---

## Description

Refactor the current single-stage game to support multiple stages/backgrounds by creating a stage management system that can handle stage data, transitions, and initialization

## Acceptance Criteria

- [x] Game initializes with stage management system instead of direct background setup
- [x] Stage data structure defines background asset and walkable areas
- [x] Current cyberpunk stage works exactly as before through the new system
- [x] Stage manager handles asset loading and cleanup for individual stages
- [x] All game systems can reference current stage data dynamically

## Implementation Plan

1. Create Stage interface and StageManager class
2. Analyze current stage-related code in Game.ts
3. Refactor Game.ts to use StageManager instead of direct background/object setup
4. Move all stage-specific data into stage definition
5. Test that cyberpunk stage works identically through new system

## Implementation Notes

Successfully implemented stage management system foundation.

## Approach taken
- Created Stage interface defining background, walkable areas, objects, and character positioning
- Implemented StageManager class to handle stage loading, asset management, and cleanup
- Refactored Game.ts to use StageManager instead of direct background/object setup
- Moved all cyberpunk stage data from hardcoded Game.ts values into structured stage definition

## Features implemented
- Stage interface with background asset, walkable area polygon, interactive objects, character start position
- StageManager class with stage loading, background/object management, key sprite handling
- Stage data encapsulation for the existing cyberpunk street stage
- Proper cleanup and memory management for stage transitions

## Technical decisions
- Stage data includes both visual positioning and interaction polygons
- StageManager handles PixiJS sprite lifecycle (creation, positioning, cleanup)
- Character positioning now comes from stage definition rather than hardcoded values
- Key sprite management integrated into stage system for proper cleanup

## Modified files
- Created: src/Stage.ts (interface definitions)
- Created: src/StageManager.ts (stage management logic)
- Modified: src/Game.ts (refactored to use StageManager)
