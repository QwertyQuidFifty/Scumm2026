---
id: task-24
title: Add NPC speaking animation
status: Done
assignee: []
created_date: '2026-11-26 23:11'
updated_date: '2026-11-26 23:17'
labels:
  - sprites
  - npc
  - animation
dependencies: []
priority: medium
---

## Description

NPCs currently show a walk frame while talking, which reads as a frozen mid-step pose rather than speech. Speaking characters should visibly talk so players can tell who is speaking.

## Acceptance Criteria

- [x] Each character design provides talk frames (mouth open/closed and a hand gesture) in at least the directions NPCs face
- [x] NPCs animate between talk frames for as long as their speech is shown and return to idle when it ends
- [x] The mechanic
- [x] whose mouth is covered by a respirator
- [x] shows a visible speaking cue instead of a mouth
- [x] Walking and idle frames are unchanged
- [x] Tests cover the new frames; lint and build pass

## Implementation Plan

1. Add mouth-open and gesture options to the compositor poses and emit talk1-3 frames\n2. Let designs override the open-mouth effect (mechanic respirator glow)\n3. Add talk textures to DirectionalFrames\n4. Drive NPC talk animation from startTalking/stopTalking with a mouth flap and slower gesture cycle\n5. Tests, lint, build; check Jake and Maya in game

## Implementation Notes

Added talk frames to the sprite compositor and animated NPCs with them while they speak.

- compositor.ts: three talk poses (talk1 mouth open, talk2 mouth open + gesture, talk3 mouth closed + gesture) generated for every design and direction. The open mouth turns the 'r' mouth key into a dark opening and drops the lip a row; designs can override this with talkSwap. The gesture raises the near forearm forward (side view) or across the body (front view) with the hand at the end of the forearm. Back views keep the idle head/arms. Idle and walk frames are pixel-identical to before.
- designs.ts: the mechanic uses talkSwap so his respirator vents glow amber when he talks.
- SpriteGenerator.ts: DirectionalFrames gains talk1-3 textures.
- NPC.ts: startTalking/stopTalking now drive a talk animation instead of showing walk1. The mouth flaps in an irregular pattern (120ms steps) and the gesture alternates every 900ms; idle is shown with the mouth closed and no gesture. Walking takes priority and talking resumes on arrival.
- tests: frame list includes talk frames; talk poses are distinct where the face is visible and leave the legs identical to idle (47 checks).

Verified in game by sampling Jake's pixels during dialogue: 4 distinct poses, ~120-150ms changes, back to idle when the line ends.

Files: src/sprites/compositor.ts, src/sprites/designs.ts, src/SpriteGenerator.ts, src/NPC.ts, tests/sprites.test.ts.
