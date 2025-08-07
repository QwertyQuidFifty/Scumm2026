---
id: task-6
title: Build interactive object system
status: Done
assignee: []
created_date: '2025-08-06 14:34'
updated_date: '2025-08-06 15:49'
labels:
  - objects
  - interaction
  - pixi
dependencies: []
priority: high
---

## Description

Create the foundation for interactive objects including hit detection, hover highlighting with green outlines, and object management for the four game objects (hotel sign, bar sign, street, building entrance)

## Acceptance Criteria

- [ ] Interactive objects can be defined with position and size
- [ ] Rectangle-based hit testing works accurately
- [ ] Hovered objects display green outline (2px stroke #00ff00)
- [ ] Object hover state is tracked and updated correctly
- [ ] Objects can be clicked and identified by the system

## Implementation Plan

1. Read ./docs/current-features-summary.md for interactive object specifications\n2. Create InteractiveObject class with position, size, and description\n3. Create ObjectManager class for managing multiple objects\n4. Implement rectangle-based hit testing\n5. Add green outline highlighting system using PixiJS Graphics\n6. Integrate object system into Game class with input handling\n7. Test object hover highlighting and click detection

## Implementation Notes

Implemented comprehensive interactive object system with collision detection and visual feedback:

**Files Created/Modified:**
- : Complete interactive object class with collision detection, hover states, and green outline highlighting
- : Object management system for handling multiple interactive objects with layered hit testing
- : Integrated object system into game with input handling and visual feedback

**Key Features Implemented:**
- **Interactive Object System**: Four game objects (Hotel Sign, Bar Sign, Street, Building Entrance) with proper scaling for 1024x768
- **Rectangle-Based Hit Testing**: Accurate collision detection for mouse clicks and hover
- **Green Outline Highlighting**: 2px green (#00ff00) stroke highlights appear on object hover
- **Cursor Management**: Cursor changes to pointer when hovering over objects, crosshair otherwise
- **Object Layering**: Proper z-order handling for overlapping objects

**Technical Implementation:**
- **InteractiveObject Class**: Encapsulates position, size, description, hover state, and highlight rendering
- **ObjectManager Class**: Manages collection of objects, handles hit testing, and coordinates highlighting
- **Collision Detection**: Point-in-rectangle testing with proper bounds checking
- **Visual Feedback**: PixiJS Graphics-based outline rendering with automatic cleanup
- **Input Integration**: Seamless integration with existing input system for hover and click events

**Interactive Objects (Scaled from 320x200 to 1024x768):**
1. **Hotel Sign**: Position (64, 115), Size 192x154 - "A glowing neon hotel sign"
2. **Bar Sign**: Position (768, 173), Size 128x96 - "A red neon bar sign"
3. **Street**: Position (0, 538), Size 1024x230 - "The main street"
4. **Building Entrance**: Position (256, 307), Size 96x230 - "A dark building entrance"

**Object Interaction Features:**
- **Hover Detection**: Objects highlight with green outline when mouse hovers
- **Click Detection**: Console logs object name and description when clicked
- **Cursor Feedback**: Pointer cursor indicates interactive objects
- **Multi-Object Support**: Handles overlapping objects with proper layering
- **State Management**: Tracks hover states and updates highlights in real-time

**Console Output:**
- Logs object clicks with name and description
- Provides coordinate feedback for debugging
- Indicates when objects are hovered or clicked

The interactive object system is fully functional with visual feedback, proper collision detection, and scalable architecture ready for action system integration.
