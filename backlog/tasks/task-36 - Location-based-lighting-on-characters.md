---
id: task-36
title: Location-based lighting on characters
status: Done
assignee:
  - '@claude'
created_date: '2026-11-28 01:34'
updated_date: '2026-11-28 01:36'
labels: []
dependencies: []
---

## Description

Characters look equally bright everywhere, while the backgrounds have neon pools, dark corners and lit counters. Tinting the player and NPCs by where they stand makes them sit in the scene.

## Acceptance Criteria

- [x] Player and NPCs are tinted by soft light zones based on where their feet are
- [x] Moving between zones fades the light smoothly
- [x] The street and the shop each have zones matching their painted light sources
- [x] A debug key shows the light zones

## Implementation Plan

1. Pure light-zone model (ambient + soft elliptical zones) with tests\n2. Zones for the street and shop from the backgrounds\n3. Tint player and NPC sprites each frame\n4. L key debug view of the zones\n5. Tests, lint, build, check in game

## Implementation Notes

Characters are now tinted by the light where they stand, like AGS light regions.\n\n- src/effects/lighting.ts: each stage has an ambient colour and soft elliptical floor zones (colour + strength). lightAt() starts from the ambient and pulls towards each zone's colour with a smoothstep falloff, so the tint changes smoothly as a character walks. Street: pink pools under the BAR and HOTEL signs, cyan under the right-hand signs, a hazy far end, dark near corners. Shop: warm strip light over the counter, red from the OPEN sign, magenta through the exit door, shadow at the front left.\n- Game.applyLighting() sets the tint of the player and every NPC each frame from the point at their feet (stages without lighting get no tint).\n- L toggles a debug view drawing each zone as a coloured ellipse.\n- tests/lighting.test.ts covers falloff, smoothness, ellipse shape and the two stages' zones.\n\nTrade-off: tint multiplies, so lights can only colour and dim, never brighten beyond the drawn sprite; the ambient is set below white so zones have room to read as brighter.
