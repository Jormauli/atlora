# Atlora Public Home Three-Step Flow Design

## Goal

Show invited visitors how Atlora turns a link or text into a saved knowledge card before they register.

## Structure

Add one full-width section directly below the existing hero. The section uses the title `从素材到知识，只需三步` and a horizontal three-step sequence on desktop, stacking vertically on mobile.

The steps are:

1. Input material: a real screenshot of the link/text input surface.
2. AI extraction: a real screenshot of the generated card draft.
3. Saved knowledge: a real screenshot of the final card detail in the starfield.

Each screenshot is cropped to its relevant product surface and placed in a restrained graphite frame. A thin orbital line connects the steps on desktop. Mineral blue, muted amber, and brick red identify steps one through three without changing the page's neutral A2 palette.

## Content

The section contains localized title, description, step number, step title, and short supporting copy. Screenshots remain Chinese because they represent the current live product rather than translated marketing artwork.

## Responsive Behavior

- Desktop: three equal columns with a connecting line and stable screenshot aspect ratios.
- Mobile: one column, no horizontal overflow, screenshots remain readable, and the connecting line is omitted.
- The existing hero remains the first viewport; this walkthrough begins below it.

## Constraints

- Use local image assets only.
- Preserve existing authentication links and product behavior.
- Do not add animation, carousel controls, remote images, or new dependencies.
- Do not expose user-sensitive data in screenshots.

## Verification

- Structural tests cover the three localized steps and three local image paths.
- Desktop and mobile browser screenshots verify hierarchy, cropping, legibility, and absence of overflow.
- `npm test` and `npm run build` pass.
