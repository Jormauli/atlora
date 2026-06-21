# Atlora Orbit Motion and Logo Options Design

## Goal

Add quiet orbital motion to the public-home planetary system and provide two logo directions for review without changing the active product logo.

## Orbit Motion

The central mineral-blue planet remains stationary. Three small signal planets orbit on concentric circular tracks:

- Inner mineral-blue satellite: 26-second clockwise orbit.
- Middle muted amber satellite: 38-second counter-clockwise orbit.
- Outer brick-red satellite: 52-second clockwise orbit.

The motion is linear and continuous, with staggered starting angles. It runs only at desktop breakpoints. `prefers-reduced-motion: reduce` disables all orbit animation. The existing static rings remain visible so the composition does not depend on animation.

## Logo Options

### A: Orbital Lettermark

Keep the letter `A` inside a neutral circular field. Add one incomplete graphite orbit and a muted amber satellite. This direction is the lowest-risk evolution of the current placeholder.

### B: Stellar Core

Use a mineral-blue central core with two graphite orbit paths and muted amber and brick-red signal nodes. This direction removes the letter and creates a more ownable symbol tied directly to the product's knowledge-starfield model.

The comparison board shows each mark with the Atlora wordmark at large, navigation, and favicon sizes. It is a review artifact only and does not ship in the app.

## Verification

- Structural tests verify three orbit classes, CSS keyframes, desktop-only animation, and reduced-motion fallback.
- Browser verification confirms visible movement over time without layout movement.
- Desktop and mobile screenshots confirm the planetary composition remains coherent.
- `npm test` and `npm run build` pass.
