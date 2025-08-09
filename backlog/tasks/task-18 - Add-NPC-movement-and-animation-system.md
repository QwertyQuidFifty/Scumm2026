---
id: task-18
title: Add NPC movement and animation system
status: Done
assignee: []
created_date: '2025-08-08 13:42'
updated_date: '2025-08-09 13:26'
labels:
  - npc
  - movement
  - animation
dependencies:
  - task-17
priority: low
---

## Description

Implement movement and animation capabilities for NPCs including basic pathfinding, walking animations, and idle states similar to the player character system

## Acceptance Criteria

- [x] NPCs can move to specified positions using pathfinding
- [x] NPCs show appropriate walking and idle animations during movement
- [x] NPC movement respects stage walkable areas and boundaries
- [x] Multiple NPCs can move simultaneously without conflicts
- [x] NPC animation system integrates with existing sprite generation system

## Implementation Notes

Implemented comprehensive NPC movement and animation system with pathfinding, walking animations, and depth sorting integration. Added keyboard testing commands: 'N' for random movement, 'M' to move Maya, 'B' to move Jake. NPCs respect walkable areas, show proper walking/idle animations, and work with the depth sorting system.
