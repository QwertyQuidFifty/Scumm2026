---
id: task-16
title: Implement perspective-based sprite scaling system
status: To Do
assignee: []
created_date: '2025-08-08 13:42'
labels:
  - scaling
  - perspective
dependencies: []
priority: medium
---

## Description

Add SCUMM-style perspective scaling where sprites automatically scale based on their Y position to simulate depth and perspective in the scene background

## Acceptance Criteria

- [ ] Character sprite scales larger when positioned at the bottom of the screen (foreground)
- [ ] Character sprite scales smaller when positioned at the top of walkable areas (background)
- [ ] Scaling interpolation is smooth and matches SCUMM engine style perspective
- [ ] Scale factors are configurable per stage for different perspective depths
- [ ] Character appears correct size when standing in front of reference objects like doors
