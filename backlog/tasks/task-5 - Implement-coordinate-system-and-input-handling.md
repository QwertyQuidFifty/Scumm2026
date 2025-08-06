---
id: task-5
title: Implement coordinate system and input handling
status: Done
assignee: []
created_date: '2025-08-06 14:33'
updated_date: '2025-08-06 15:35'
labels:
  - input
  - coordinates
  - pixi
dependencies: []
priority: high
---

## Description

Set up the coordinate conversion system between screen pixels and game coordinates (320x200), and implement basic mouse input handling for the PixiJS canvas

## Acceptance Criteria

- [ ] Mouse clicks are converted from screen coordinates to 320x200 game coordinates
- [ ] Coordinate system accounts for integer scaling properly
- [ ] Mouse hover events are detected and tracked
- [ ] Canvas cursor style can be changed dynamically
- [ ] Input coordinates are accurate regardless of canvas scale factor

## Implementation Plan

1. Read ./docs/current-features-summary.md for coordinate specifications\n2. Create InputManager class for handling mouse input\n3. Implement coordinate conversion between screen and game coordinates\n4. Add mouse event listeners for click and hover\n5. Integrate cursor style changes\n6. Update Game class to use input system\n7. Test coordinate accuracy and mouse interactions

## Implementation Notes

Implemented comprehensive coordinate system and input handling for 1024x768 resolution:

**Files Created/Modified:**
- : Complete input management system with mouse event handling and coordinate conversion
- : Integrated input system into game initialization with event callbacks

**Key Features Implemented:**
- **Coordinate System**: Proper conversion between screen coordinates and 1024x768 game coordinates
- **Mouse Input Handling**: Click, hover, mouse enter/exit events with accurate coordinate tracking
- **Dynamic Cursor Support**: Ability to change cursor style based on mouse interactions
- **Scaling Support**: Coordinate conversion accounts for canvas scaling factors
- **Event Management**: Clean event listener setup with proper callback architecture

**Technical Implementation:**
- **Screen-to-Game Coordinate Conversion**: Accurate pixel-perfect coordinate mapping
- **Game-to-Screen Coordinate Conversion**: Reverse mapping for UI positioning
- **Mouse State Tracking**: Tracks mouse position, button state, and hover status
- **Bounds Checking**: Ensures coordinates stay within game boundaries
- **Canvas Integration**: Direct integration with PixiJS canvas element
- **Memory Management**: Proper cleanup methods for event listeners

**Input Features:**
- **Click Detection**: Logs clicks with precise game coordinates
- **Hover Detection**: Changes cursor to crosshair when over canvas
- **Cursor Management**: Dynamic cursor changes (crosshair on hover, default on exit)
- **Mouse State**: Tracks mouse down/up states and current position
- **Context Menu Prevention**: Blocks right-click context menu on canvas

**Coordinate Conversion Details:**
- Takes screen pixel coordinates and converts to 1024x768 game space
- Accounts for canvas positioning and scaling
- Clamps coordinates to valid game boundaries
- Provides both directions of conversion for flexibility

The input system is now fully functional with accurate coordinate conversion and responsive mouse handling, ready for object interaction and character movement systems.
