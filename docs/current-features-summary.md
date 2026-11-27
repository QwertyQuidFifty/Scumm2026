# SCUMM-Style Game - Current Features Summary

## Overview
This document captures all implemented features in the current SCUMM-style cyberpunk adventure game. Use this as a complete specification to replicate functionality in a new PixiJS project.

## Core Game Configuration

### Canvas & Display
- **Base Resolution**: 320x200 pixels (classic SCUMM dimensions)
- **Scaling**: Integer scaling to fit available screen space
- **Rendering**: Pixel-perfect with nearest-neighbor interpolation
- **Background Color**: `#000022` (dark blue)
- **Image Rendering**: `image-rendering: pixelated` for crisp pixels

### Responsive Layout
```
┌─────────────────────────────────────────────────────────┐
│                    GAME VIEWPORT                        │
│                 (320x200 scaled up)                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Dynamic Action Bar Text (26px font)                    │
├─────────────────────────────────────────────────────────┤
│ WALK  USE   PICK UP │         INVENTORY GRID            │
│ TALK  LOOK  OPEN    │      (10 slots horizontal)       │
└─────────────────────────────────────────────────────────┘
```

## Character System

### Character Sprite
- **Size**: 16x24 pixels
- **Animation Frames**: 3 frames (idle, walk1, walk2)
- **Animation Cycle**: [walk1, idle, walk2, idle] for walking
- **Frame Duration**: 300ms per frame
- **Colors**: Cyberpunk palette (brown hair, pink skin, grey clothing)
- **Starting Position**: (100, 150)

### Character Movement
- **Speed**: 60 pixels per second
- **Movement Type**: Smooth linear interpolation to target
- **Pathfinding**: Visibility-graph routing over the stage's walkable polygon with obstacle holes (`src/navigation/pathfinding.ts`). The character walks straight when nothing is in the way, otherwise follows the quickest route around obstacle corners (cost accounts for the stage's slower vertical movement). Clicking inside an obstacle walks to the nearest point beside it.
- **Obstacles**: `Stage.obstacles` lists floor footprints of props (e.g. the shop stool's legs, `STOOL_FOOTPRINT`). Props drawn as inline overlays use `depthY` (where they meet the floor) for depth sorting, so characters are behind them from above and in front from below.
- **Debug view**: press **W** to draw the walkable area (green), obstacles (red) and the current route (yellow).
- **Animation**: Walking animation plays during movement, stops when arrived
- **Idle animations** (`src/IdleAnimation.ts`): characters standing still blink every 2.5-6s (sometimes twice) and perform fidgets - look at the camera, check their wrist, or sigh. NPCs fidget every 5-12s with their own seeded rhythm; the player starts only after ~7s idle, resetting whenever they walk or talk. Eyes use the `e` key in head grids so the `blink` frame can close them; designs can override with `blinkSwap` (Maya's visor dims).

### Walkable Areas (Defined as Polygons)
1. **Main Street**: `[(0,140), (320,140), (320,200), (0,200)]`
2. **Left Sidewalk**: `[(0,120), (100,120), (100,140), (0,140)]`
3. **Right Sidewalk**: `[(200,120), (320,120), (320,140), (200,140)]`

### Walk-behinds
- Parts of a background picture that characters can stand behind (`src/effects/walkBehinds.ts`, rendered by `WalkBehindLayer.ts`). Each is an outline polygon in background coordinates plus a depth line (its base on the floor, in game coordinates). Its pixels are cut out of the background at runtime and depth-sorted like a sprite, so characters with feet above the line are drawn behind it.
- The shop counter (with the cash register) is one; the android shopkeeper (`android` design, NPC `shopkeeper`) stands behind it.
- Clicks respect depth: an NPC is only clicked on its drawn pixels, and not where scenery drawn in front of it covers it (`coveringScenery` in `walkBehinds.ts`, used by `NPCManager.getNPCAtPosition`). Overlapping NPCs: the one drawn in front wins.
- Speech text is placed just above a character's head at any scale (`speechAnchorY` in `SpeechBubble.ts`).

### Animated Neon Signs
- Signs painted into the backgrounds get animated overlays (`src/effects/neonSigns.ts` defines them, `src/effects/NeonSignLayer.ts` renders them).
- The neon pixels (bright and saturated) inside each sign's rectangle are cut out of the background texture at runtime, so overlays match the art exactly and no extra image files are needed.
- Each segment (a whole sign, or one letter of HOTEL) has a behaviour: `pulse` (slow breathing), `buzz` (occasional flicker burst), `broken` (stutters and cuts out; HOTEL's E) or `fluorescent` (rare quick double-flicker; the shop's strip light). A blurred additive halo follows the brightness.
- To add a sign: add an entry with its rectangle in background coordinates (1024x768) and stage id to `NEON_SIGNS`.

## Interactive Object System

### Interactive Objects
1. **Hotel Sign**
   - Position: (20, 30), Size: 60x40
   - Description: "A glowing neon hotel sign"

2. **Bar Sign** 
   - Position: (240, 45), Size: 40x25
   - Description: "A red neon bar sign"

3. **Street**
   - Position: (0, 140), Size: 320x60
   - Description: "The main street"

4. **Building Entrance**
   - Position: (80, 80), Size: 30x60
   - Description: "A dark building entrance"

### Interaction System
- **Hover Highlighting**: Green outline (2px stroke, #00ff00) around hovered objects
- **Click Detection**: Rectangle-based hit testing
- **Cursor Changes**: Default cursor becomes pointer on hover

### Action Responses (by Object and Action)

**Hotel Sign:**
- Look: "A bright neon sign advertising 'HOTEL' in pink letters. It flickers occasionally."
- Walk: "You walk closer to the hotel entrance."
- Use: "The sign is too high up to reach."
- Pickup: "The neon sign is permanently mounted to the building."
- Talk: "The sign doesn't respond. It's just a sign."
- Open: "It's a sign, not a door."

**Bar Sign:**
- Look: "A red neon 'BAR' sign glows invitingly in the night."
- Walk: "You approach the bar entrance."
- Use: "You can't interact with the sign directly."
- Pickup: "The sign is bolted to the wall."
- Talk: "Signs don't talk back."
- Open: "The sign itself doesn't open."

**Street:**
- Look: "The rain-slicked cyberpunk street reflects the neon lights beautifully."
- Walk: "You walk along the street, your footsteps echoing."
- Use: "You're already using the street to walk on."
- Pickup: "You can't pick up a street."
- Talk: "The street remains silent."
- Open: "Streets don't open."

**Building Entrance:**
- Look: "A dark entrance between the glowing signs. It looks like it leads deeper into the building."
- Walk: "You approach the mysterious entrance."
- Use: "You need to be more specific about what you want to use."
- Pickup: "You can't pick up an entire entrance."
- Talk: "No one seems to be around to talk to."
- Open: "You try the entrance, but it appears to be locked or blocked."

## User Interface System

### Action Bar
- **Position**: Top of UI, 80px height
- **Background**: `#1a1a1a`
- **Font**: Courier New, 26px, white
- **Default Text**: "Walk to"
- **Dynamic Updates**: "[Action] [Object Name]" (e.g., "Look at hotel sign")

### Command Panel (6 Buttons in Grid)
- **Layout**: 6 buttons in horizontal row
- **Buttons**: WALK, USE, PICK UP, TALK, LOOK, OPEN
- **Default Selected**: WALK
- **Styling**: 
  - Normal: `#555` background, `#666` outset border
  - Hover: `#666` background
  - Selected: `#777` background, `#666` inset border
- **Font**: Courier New, 32px, white

### Action System
- **Current Action Tracking**: Tracks selected action (default: 'walk')
- **Button Selection**: Visual feedback with border changes
- **Click Behavior**: 
  - Walk action: Move character to clicked position or near object
  - Other actions: Execute action on clicked object

## Inventory System

### Inventory Configuration
- **Capacity**: 10 items maximum
- **Display**: 10 horizontal slots in grid
- **Slot Styling**: 
  - Empty: `#444` background, `#666` border
  - Hover: `#555` background
- **Item Display**: Colored squares with text icons

### Current Test Items
1. **Key Card**
   - Color: `#4a90e2` (blue)
   - Icon: "KEY"
   - Description: "A plastic access card with a magnetic strip."

2. **Credits**
   - Color: `#f5a623` (orange)
   - Icon: "¢100"
   - Description: "Digital currency chips worth 100 credits."

3. **Data Pad**
   - Color: `#7ed321` (green)
   - Icon: "PAD"
   - Description: "A small handheld device containing encrypted files."

### Inventory Interactions
- **Left Click**: Select item / attempt to use
- **Right Click / Ctrl+Click**: Examine item (show description)
- **Hover**: Updates action bar with item name

## Asset System

### Background Image
- **File**: `cyberpunk.png`
- **Rendering**: Scales to fill canvas width, maintains aspect ratio
- **Positioning**: Centered vertically if taller than canvas

### Sprite Generation
- **Method**: Procedural generation from pixel art data arrays
- **Format**: 16-character strings representing pixel rows
- **Color Palette**: 
  - '0': transparent
  - '3': #2a2a2a (dark grey - shoes)
  - '4': #4a4a4a (medium grey - pants)
  - '5': #6a6a6a (light grey - belt/details)
  - '6': #8B4513 (brown - hair outline)
  - '7': #DAA520 (golden - hair)
  - '8': #FFB6C1 (light pink - face)

## Game Loop & Timing

### Frame Rate
- **Target**: 60 FPS using `requestAnimationFrame`
- **Delta Time**: Calculated for frame-independent movement
- **Animation Timing**: 300ms between character animation frames

### Update Cycle
1. **Update Movement**: Character position interpolation
2. **Update Animation**: Frame cycling for walking
3. **Render Background**: Draw cyberpunk.png
4. **Render Objects**: Draw interactive object highlights
5. **Render Character**: Draw current animation frame

## Input Handling

### Mouse Events
- **Canvas Click**: 
  - Get pixel coordinates (accounting for scale)
  - Check for object collision
  - Execute current action or move character
- **Canvas Hover**:
  - Update hovered object
  - Change cursor style
  - Update action bar text
- **Inventory Click**: Handle item selection/examination
- **Command Button Click**: Change current action

### Coordinate System
- **Game Coordinates**: 320x200 virtual pixels
- **Screen Coordinates**: Scaled up by integer factor
- **Conversion**: `(screenX - canvasRect.left) / scale`

## Technical Implementation Details

### Game Class Structure
```javascript
class Game {
    // Core properties
    canvas, ctx, scale, gameWidth: 320, gameHeight: 200
    
    // Game state
    currentAction: 'walk'
    characterX: 100, characterY: 150
    isMoving: false, targetX, targetY
    moveSpeed: 60 // pixels/second
    
    // Systems
    interactiveObjects[], walkableAreas[]
    inventory[], maxInventorySize: 10
    characterSprite, characterAnimation{}
    
    // Timing
    lastUpdateTime, lastFrameTime
}
```

### Key Methods
- `setupCanvas()`: Configure pixel-perfect rendering
- `handleCanvasClick(e)`: Process mouse clicks
- `walkTo(x, y)`: Initiate character movement
- `updateMovement(deltaTime)`: Move character toward target
- `performAction(action, object)`: Execute action on object
- `isPositionWalkable(x, y)`: Check walkable area collision
- `getObjectAtPosition(x, y)`: Find clicked object

## Color Scheme
- **UI Background**: `#2a2a2a`, `#1a1a1a`, `#333`
- **UI Borders**: `#666`
- **UI Text**: White (`#fff`)
- **Buttons**: `#555` normal, `#666` hover, `#777` selected
- **Highlight**: `#00ff00` (green outline)
- **Game Background**: `#000022` (dark blue)

This document contains everything needed to recreate the current SCUMM-style game functionality in a new PixiJS project.