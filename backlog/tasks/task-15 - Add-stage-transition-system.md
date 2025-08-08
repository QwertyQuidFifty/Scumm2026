---
id: task-15
title: Add stage transition system
status: Done
assignee: []
created_date: '2025-08-08 13:41'
updated_date: '2025-08-08 15:12'
labels:
  - multi-stage
  - transitions
dependencies:
  - task-14
priority: medium
---

## Description

Implement stage transition functionality allowing the character to move between different stages/backgrounds when interacting with transition points like doors or exits

## Acceptance Criteria

- [x] Character can transition to new stages through interaction with designated objects
- [x] Stage transitions preserve character state and inventory
- [x] Game properly loads and unloads stage assets during transitions
- [x] Walkable areas and interactive objects update correctly for new stages
- [x] Stage transitions are visually smooth without rendering glitches

## Implementation Plan

1. Analyze current object interaction system in Game.ts
2. Enhance StageManager with transition detection and stage switching
3. Create test indoor stage for demonstrating transitions
4. Add stage transition logic to executePendingAction method
5. Update ActionResponseSystem with transition object responses
6. Test transitions work between cyberpunk street and indoor room

## Implementation Notes

Successfully implemented stage transition system.

## Approach taken
- Enhanced StageManager with findTransition and transitionToStage methods
- Created test indoor stage reusing cyberpunk background to demonstrate transitions
- Modified executePendingAction to check for stage transitions before regular responses
- Added bidirectional transitions: building-entrance -> indoor room, exit-door -> street

## Features implemented
- StageManager.findTransition() to detect transition triggers based on current stage and object ID
- StageManager.transitionToStage() to handle complete stage switching with asset management
- Character state preservation during transitions (position, inventory maintained)
- Walkable area updates for new stage environments
- Proper cleanup and loading of stage-specific objects

## Technical decisions
- Transitions trigger on 'open' and 'walk' actions to match typical adventure game conventions
- Character positioning handled by transition definitions with fallback to stage start position
- Async transition handling to avoid blocking game loop during stage loading
- Stage transitions take priority over normal object responses to ensure smooth gameplay

## Modified files
- Enhanced: src/StageManager.ts (added transition methods, test indoor stage)
- Enhanced: src/Game.ts (added handleStageTransition, modified executePendingAction)
- Enhanced: src/ActionResponseSystem.ts (added exit-door responses, updated building-entrance)
