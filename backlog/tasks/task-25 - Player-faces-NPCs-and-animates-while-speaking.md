---
id: task-25
title: Player faces NPCs and animates while speaking
status: Done
assignee: []
created_date: '2026-11-26 23:32'
updated_date: '2026-11-26 23:36'
labels:
  - animation
  - player
  - npc
dependencies: []
priority: medium
---

## Description

When the player walks up to an NPC they keep facing whichever way they walked, often away from the person they are talking to, and the player's own lines show no speaking animation, unlike the NPCs.

## Acceptance Criteria

- [x] When the player reaches an NPC to interact
- [x] they turn to face that NPC
- [x] The player plays a talking animation (mouth and gesture) for as long as their own speech text is shown and returns to idle afterwards
- [x] The player does not play the talking animation while an NPC is speaking or while walking
- [x] NPC talking animation behaves as before
- [x] Talk frame timing is shared by player and NPCs and covered by tests; lint and build pass

## Implementation Plan

1. Extract talk frame selection into a shared pure module and test it\n2. Use it in NPC; add talking + faceTowards to CharacterController\n3. Tag speech bubble text with its speaker; drive player talking from the bubble\n4. Route player speech through one Game helper\n5. Face the NPC on arrival before the interaction runs\n6. Tests, lint, build; check Jake and Maya in game

## Implementation Notes

The player now turns to face an NPC on arrival and plays the talk animation while their own line is on screen.

- src/TalkAnimation.ts (new): talkFrameAt(elapsed) picks idle/talk1/talk2/talk3 from the mouth-flap pattern and gesture phase. Moved out of NPC.ts so player and NPCs share it.
- CharacterController: setSpeakingCheck() and a talking branch in updateAnimation (only when standing still; snaps back to idle as soon as speech ends); faceTowards(position) and getDirection().
- SpeechBubble: showSpeech takes a speaker ('player' | 'other'); getSpeaker(). The player animates only while the bubble is showing a player line, so NPC lines and hidden bubbles don't trigger it.
- Game: all player lines go through showPlayerSpeech() (replaces 8 copies of show + position). Two item-use responses that sat 60px lower now use the same offset as the rest. executePendingNPCAction calls faceTowards(npc) before the interaction.
- tests/talk.test.ts: timing of talkFrameAt (52 checks total).

Verified in game: walking to Jake from the right, the player turns to face him; during the player's reply the player cycles talk poses for ~1.5s then returns to idle and stays idle while Jake answers.

Files: src/TalkAnimation.ts, src/CharacterController.ts, src/SpeechBubble.ts, src/Game.ts, src/NPC.ts, tests/talk.test.ts.
