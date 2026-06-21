# Orbit Motion and Logo Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accessible concentric orbit motion to the public-home planet composition and create a standalone two-option logo comparison board.

**Architecture:** Keep the orbit rings static in `PublicHome`, place each small planet inside its own absolute rotation track, and define desktop-only CSS animations with a reduced-motion override. Keep logo exploration outside the application in a standalone HTML review artifact.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, CSS keyframes, Node test runner, standalone HTML/CSS.

---

### Task 1: Lock the motion contract

**Files:**
- Modify: `src/app/public-entry.test.ts`

- [ ] **Step 1: Add failing structural assertions**

Assert that the home component uses three named orbit motion tracks and that global CSS defines `orbit-spin`, desktop-only animation, and a reduced-motion override.

- [ ] **Step 2: Run the focused test**

Run: `npx tsx --test src/app/public-entry.test.ts`

Expected: FAIL because no orbit animation classes or keyframes exist.

### Task 2: Implement orbital motion

**Files:**
- Modify: `src/components/public-home.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add three concentric motion tracks**

Place mineral-blue, amber, and brick-red planets on inner, middle, and outer absolute tracks while retaining the stationary central planet and static orbit borders.

- [ ] **Step 2: Add accessible CSS animation**

Define 26-second, 38-second reverse, and 52-second linear rotations inside `@media (min-width: 1024px)`. Disable animation under `prefers-reduced-motion: reduce`.

- [ ] **Step 3: Run the focused test**

Run: `npx tsx --test src/app/public-entry.test.ts`

Expected: PASS.

### Task 3: Create the logo comparison board

**Files:**
- Create: `.superpowers/brainstorm/atlora-logo-options.html`

- [ ] **Step 1: Render both logo concepts**

Create a neutral graphite comparison board with Orbital Lettermark and Stellar Core shown at product-header, navigation, and favicon sizes. Use the approved A2 palette and include concise trade-offs.

- [ ] **Step 2: Open the board for review**

Open the local HTML file in the in-app browser and leave it visible for user selection.

### Task 4: Verify

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run all tests and build**

Run: `npm test && npm run build`

Expected: all tests pass and the build exits with code 0.

- [ ] **Step 2: Verify motion and responsive fallback**

At `1280x800`, sample planet positions at two moments and confirm they change while the central planet remains fixed. At `390x844`, confirm the desktop orbital artwork stays hidden and no overflow appears.
