---
id: task-20
title: Add perspective scaling to NPC system
status: To Do
assignee: []
created_date: '2025-08-08 13:42'
labels:
  - npc
  - scaling
  - perspective
dependencies:
  - task-16
  - task-17
priority: low
---

## Description

Integrate the perspective-based scaling system with NPCs so they scale appropriately based on their position in the scene, matching the player character scaling behavior

## Acceptance Criteria

- [ ] NPCs automatically scale based on their Y position using the same perspective system as player
- [ ] NPC scaling updates smoothly during movement
- [ ] NPC scaling configuration is inherited from stage perspective settings
- [ ] NPCs maintain correct scale relationships with player character and environment
- [ ] NPC sprites appear correctly sized relative to background elements
