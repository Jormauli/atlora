# Atlora Public Home UI Flow Visuals Design

## Goal

Replace the three screenshot thumbnails with language-neutral product UI illustrations and remove the unexplained signal line beside the hero planet.

## Visual System

The three illustrations use code-rendered UI primitives, Lucide icons, and the existing A2 palette. They contain no visible words, numbers, or language-specific content.

1. Input material: a link chip, image tile, document lines, and an input surface.
2. AI extraction: source fragments move through a central signal node into three structured output blocks.
3. Knowledge card: a planet identity mark, summary lines, three insight rows, and tag dots inside a card frame.

Each illustration uses the existing stable `16:10` frame. External step titles and descriptions remain localized through `copy.publicHome.flow`.

## Motion

One small signal dot may move along a short horizontal path in the extraction illustration. The animation stops under `prefers-reduced-motion: reduce`. No interaction or carousel behavior is added.

## Hero Cleanup

Remove the short diagonal signal line extending from the central planet. The planet, craters, concentric rings, and orbiting satellites remain unchanged.

## Verification

- Structural tests confirm there are no screenshot paths or `next/image` dependency in the public home.
- Tests confirm three UI illustration variants and absence of the old diagonal-line class.
- Browser verification covers desktop, mobile, Chinese, and English layouts.
- `npm test` and `npm run build` pass.
