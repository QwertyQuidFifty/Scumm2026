---
id: task-16
title: Implement perspective-based sprite scaling system
status: Done
assignee: []
created_date: '2025-08-08 13:42'
updated_date: '2025-08-08 16:11'
labels:
  - scaling
  - perspective
dependencies: []
priority: medium
---

## Description

Add SCUMM-style perspective scaling where sprites automatically scale based on their Y position to simulate depth and perspective in the scene background

## Acceptance Criteria

- [x] Character sprite scales larger when positioned at the bottom of the screen (foreground)
- [x] Character sprite scales smaller when positioned at the top of walkable areas (background)
- [x] Scaling interpolation is smooth and matches SCUMM engine style perspective
- [x] Scale factors are configurable per stage for different perspective depths
- [x] Character appears correct size when standing in front of reference objects like doors

## Implementation Plan

1. Analyze SCUMM-style perspective scaling requirements and design system
2. Create PerspectiveScale interface for stage configuration
3. Implement PerspectiveScaler class with smooth interpolation
4. Add perspective scaling zones to cyberpunk street and mechstore stages
5. Integrate perspective scaling into game loop for real-time updates
6. Test scaling works correctly in both stages

## Implementation Notes

Successfully implemented SCUMM-style perspective-based sprite scaling system.

## Approach taken
- Created PerspectiveScale interface for configurable scaling zones per stage
- Implemented PerspectiveScaler class with smooth linear interpolation between min/max Y positions
- Added perspective scaling configurations to both cyberpunk street and mechstore stages
- Integrated real-time scaling updates in game loop for smooth scaling during movement

## Features implemented
- **Stage-specific scaling**: Each stage defines its own perspective zones with minY/maxY boundaries
- **Smooth interpolation**: Linear scaling between min/max scale factors based on Y position
- **Real-time updates**: Character scale updates every frame as they move through the scene
- **Configurable scaling**: Easy to adjust min/max scale factors and Y boundaries per stage
- **Debug support**: PerspectiveScaler includes debug information methods

## Technical decisions
- Y-position based scaling to simulate depth (lower Y = closer to camera = larger)
- Linear interpolation for smooth SCUMM-style scaling (not exponential)
- Base scale factor (3x) combined with perspective multiplier for consistent sizing
- Clamped Y positions to prevent scaling outside defined zones

## Stage configurations
**Cyberpunk Street**: Y 610-803, Scale 60%-100% (0.6-1.0 multiplier)
**Mechstore**: Y 613-772, Scale 70%-110% (0.7-1.1 multiplier) - closer indoor perspective

## Modified files
- Created: src/PerspectiveScaler.ts (scaling logic and interpolation)
- Enhanced: src/Stage.ts (added PerspectiveScale interface)
- Enhanced: src/StageManager.ts (added perspective configs to stages)
- Enhanced: src/Game.ts (integrated perspective scaling in game loop)
