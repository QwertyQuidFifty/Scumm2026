---
id: task-20
title: Add perspective scaling to NPC system
status: Done
assignee:
  - '@claude'
created_date: '2025-08-08 13:42'
updated_date: '2025-08-10 15:22'
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

- [x] NPCs automatically scale based on their Y position using the same perspective system as player
- [x] NPC scaling updates smoothly during movement
- [x] NPC scaling configuration is inherited from stage perspective settings
- [x] NPCs maintain correct scale relationships with player character and environment
- [x] NPC sprites appear correctly sized relative to background elements

## Implementation Notes

Successfully integrated perspective scaling system with NPCs. Added setPerspectiveScaler() method to NPCManager and updated the update() method to apply scaling to all NPCs during each frame. Integration point added to Game.ts setupCharacter() method right after perspective scaler configuration. NPCs now automatically scale based on Y position using the same perspective system as the player character.
