---
id: task-29
title: Add idle animations for player and NPCs
status: Done
assignee: []
created_date: '2026-11-27 10:05'
updated_date: '2026-11-27 10:11'
labels:
  - animation
  - npc
  - player
dependencies: []
priority: medium
---

## Description

Characters stand perfectly still when not walking or talking, which makes scenes feel lifeless. Small idle animations (blinking and occasional fidgets) bring them to life; NPCs should do this on their own at random, and the player only after standing still for a while.

## Acceptance Criteria

- [x] All characters blink every few seconds at irregular intervals (Maya's visor dims instead; Jake's cyber eye stays lit)
- [x] NPCs perform a random fidget (look at the camera / check wrist / sigh) every few seconds with independent timing
- [x] The player starts fidgeting only after standing idle for about 7 seconds and the timer resets when they walk or talk
- [x] Idle animations never interrupt walking or talking and characters return to their normal facing afterwards
- [x] Idle timing is deterministic per seed and covered by unit tests; lint and build pass

## Implementation Plan

1. Compositor: eye key 'e' in head grids, blink and sigh frames, blinkSwap override for Maya\n2. Pure IdleAnimator: seeded schedule of blinks and fidgets, player delay vs NPC random\n3. Tests for the scheduler and new frames\n4. CharacterController and NPC use it when standing still and not talking\n5. Lint, build, verify in game

## Implementation Notes

Added idle animations: blinks for everyone, random fidgets for NPCs, and fidgets for the player after standing still.

- compositor.ts: new 'blink' (eyes closed) and 'sigh' (upper body down 1px, feet planted) frames. Eyes now use their own key 'e' (same colour as the outline) so blinks can close them: the upper pixel of a two-pixel eye becomes skin, a one-pixel eye a lid line. blinkSwap lets a design recolour instead.
- designs.ts: eye pixels marked 'e' in all head views; 'e' added to palettes. Maya's visor dims on blink; Jake's red cyber eye stays lit.
- src/IdleAnimation.ts (new, pure): IdleAnimator with a seeded PRNG schedules blinks (every 2.5-6s, 140ms, 20% double) and fidgets (lookAtCamera 1.8s with a blink, checkWrist 1.5s reusing the talk3 gesture pose, sigh 0.9s; never the same twice in a row). PLAYER_IDLE: first fidget after 7-7.5s, then every 8-14s. NPC_IDLE: first after 1.5-6s, then every 5-12s; NPCs are seeded from their id.
- CharacterController / NPC: use the animator whenever standing still and not talking; reset when they start standing still (after walking or talking). Looking at the camera shows the 'down' frames without changing the character's facing.
- SpriteGenerator: DirectionalFrames gains blink and sigh.
- tests: idle.test.ts (scheduling, player delay, reset, determinism) and sprite tests for blink/sigh (109 checks total). Docs updated.

Verified in game by sampling the canvas for 22s untouched: player blinked at 4s and sighed at ~7s; Jake looked at the camera (with a blink) at ~4.6s and checked his wrist at 14.5s; Maya had her own timing including a double blink and a wrist check; poses checked visually.

Files: src/IdleAnimation.ts, src/sprites/compositor.ts, src/sprites/designs.ts, src/SpriteGenerator.ts, src/CharacterController.ts, src/NPC.ts, docs/current-features-summary.md, tests/idle.test.ts, tests/sprites.test.ts.
