---
id: task-7
title: Implement character movement and pathfinding
status: To Do
assignee: []
created_date: '2025-08-06 14:34'
labels:
  - character
  - movement
  - animation
dependencies:
  - task-4
priority: high
---

## Description

Create the character movement system with smooth linear interpolation, walking animation, and point-in-polygon collision detection for walkable areas

## Acceptance Criteria

- [ ] Character moves smoothly at 60 pixels per second to target coordinates
- [ ] Walking animation plays during movement with 300ms frame timing
- [ ] Character stops and animation ends when reaching destination
- [ ] Point-in-polygon collision detection works for walkable areas
- [ ] Character cannot be moved to unwalkable positions
