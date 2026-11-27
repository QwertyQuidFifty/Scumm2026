---
id: task-28
title: Animate neon signs in the backgrounds
status: Done
assignee: []
created_date: '2026-11-27 09:11'
updated_date: '2026-11-27 09:14'
labels:
  - graphics
  - effects
dependencies: []
priority: medium
---

## Description

The neon signs painted into the street and shop backgrounds are static, which makes the scenes feel frozen. Living neon (a soft glow, gentle pulsing and the odd flicker or broken letter) adds atmosphere without new art.

## Acceptance Criteria

- [x] Each neon sign in the street (HOTEL / BAR / two cyan signs / small cyan sign) and the shop (OPEN sign / ceiling strip light / red door sign) has an animated overlay aligned exactly with the painted sign
- [x] Signs glow with a soft halo and pulse gently; some buzz or flicker briefly at irregular intervals and one HOTEL letter is broken and cuts out
- [x] Overlays are derived from the background art at runtime (no new image files) and sit behind characters
- [x] Overlays are removed when leaving a stage and recreated on return
- [x] Flicker timing and sign masks are covered by unit tests; lint and build pass

## Implementation Plan

1. Pure module: sign definitions (rects in background coords, per-letter segments), neon pixel mask from RGBA, deterministic brightness curves (pulse / buzz / broken / fluorescent)\n2. Unit tests for masks and timing\n3. NeonSignLayer: extract background pixels, build lit/dim/glow sprites per segment, animate from brightness\n4. StageManager creates/destroys the layer per stage, registered just above the background; Game drives updates\n5. Tune in game, lint, build

## Implementation Notes

Added animated overlays for the neon signs painted into both backgrounds.

- src/effects/neonSigns.ts (new, pure): sign definitions (rects in 1024x768 background space, per-letter segments for HOTEL), isNeon/extractNeon (HSV value >= 0.55, saturation >= 0.45), and deterministic brightness curves: pulse, buzz (60% chance of a 450ms burst per 6s), broken (cuts out or stutters in ~60% of 2.5s windows), fluorescent (quick double-flicker in half of 9s windows). Rects were checked against the art: each captures all neon pixels of its sign (BAR excludes a separate light above it).
- src/effects/NeonSignLayer.ts (new): extracts the background texture's pixels once per stage, builds a texture per segment from its neon pixels, and drives three sprites per segment: a dark tinted copy that covers the tube when off, an additive copy for flicker peaks, and a blurred additive halo.
- StageManager creates the layer with the background (registered at depth -999, just above it, at the background's offset) and destroys it on stage cleanup; Game calls stageManager.updateEffects each frame.
- Signs: street HOTEL (E broken), BAR (buzz), two cyan signs (pulse), small cyan sign (buzz); shop OPEN (buzz), ceiling strip light (fluorescent), red door sign (pulse).
- docs/current-features-summary.md: new section on how to add signs.
- tests/neonSigns.test.ts: mask extraction, brightness ranges/determinism, off-time fractions per behaviour, seeds desynchronised, sign data sanity (83 checks total).

Verified in game: overlays align with the painted signs in both rooms, halos glow, HOTEL's E cuts in and out, and the layer is rebuilt after leaving and re-entering a room with no console errors.
