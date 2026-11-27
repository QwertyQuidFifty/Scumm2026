---
id: task-34
title: 'Reach animation for Use, Get and Open'
status: Done
assignee: []
created_date: '2026-11-27 11:46'
updated_date: '2026-11-27 11:56'
labels:
  - animation
  - player
dependencies: []
priority: medium
---

## Description

Using, picking up or opening things gives no visual feedback from the player; the line of text just appears. A short reach animation, in the spirit of the talking gesture, makes these actions read as the player doing something.

## Acceptance Criteria

- [x] When the player arrives to Use or Open an object (or use an inventory item on it) they turn to face it and reach out with their near arm
- [x] For Get the player crouches slightly and reaches down
- [x] The reach takes well under a second and then returns to idle; walking cancels it
- [x] Door opening and picking up the key happen at the moment of contact rather than on arrival
- [x] Reach frames exist for every character design and direction and the timeline is covered by tests; lint and build pass

## Implementation Plan

1. Compositor: reach (arm extended forward) and reachLow (crouch, arm down-forward) poses\n2. Pure ActionAnimation timeline: half reach -> reach -> half reach -> done, with a contact time\n3. CharacterController.playAction; walking cancels; action takes priority over speech/idle while it plays\n4. Game: face the object and play it for use/get/open and item-on-object; delay door toggle and key pickup to the contact moment\n5. Tests, lint, build, verify in game

## Implementation Notes

Added a reach animation for Use, Get and Open (and using an inventory item on an object).

- compositor.ts: 'reach' (near arm straight out in side view; elbow out with hand raised to chest height in front/back view) and 'reachLow' (crouch 2px, arm down and forward) poses for every design and direction.
- src/ActionAnimation.ts (new, pure): reachFrameAt timeline - half reach (talk3 gesture, or the sigh crouch for Get) for 110ms, full reach until 530ms, half until 650ms, then done; CONTACT_MS = 260; reachFor maps use/open -> reach, get -> reachLow.
- CharacterController.playReach(kind, onContact): the reach has priority over talking and idle while it plays; onContact runs on the frame the hand is fully out, or immediately if walking cuts the reach short, so effects stay in sync with the animation even when frames drop.
- Game: on arrival for use/get/open the player turns to face the object and reaches; door toggling and the key pickup run at contact instead of on arrival. Using an item on an object also turns and reaches.
- tests: reach.test.ts (timeline, mapping, contact) and sprite tests include the new frames (148 checks total).

Testing note: the browser pane was hidden during verification, which throttles the game to ~1 frame/s; a first version that used a timer for the contact moment opened the door before the arm appeared under that throttling, so contact is now driven from the animation frame. Verified in game that the reach frame is shown on arrival at the street door (back view, arm out) and that the door opens; real-time feel not observed because of the throttled pane.

Files: src/ActionAnimation.ts, src/sprites/compositor.ts, src/SpriteGenerator.ts, src/CharacterController.ts, src/Game.ts, tests/reach.test.ts, tests/sprites.test.ts.
