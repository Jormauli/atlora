# Public Home Three-Step Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-screenshot three-step walkthrough below the Atlora public-home hero.

**Architecture:** Store three cropped product screenshots under `public/home-flow/`, add localized walkthrough copy to the existing language dictionary, and render a responsive presentational section from `PublicHome`. Preserve all current routes and hero behavior.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Node test runner, in-app browser screenshots.

---

### Task 1: Lock the walkthrough contract

**Files:**
- Modify: `src/app/public-entry.test.ts`
- Modify: `src/lib/language.test.ts`

- [ ] **Step 1: Add failing assertions**

Assert that `PublicHome` references three `/home-flow/*.png` assets, renders `copy.publicHome.flow`, and that both language dictionaries provide exactly three localized steps.

- [ ] **Step 2: Run focused tests**

Run: `npx tsx --test src/app/public-entry.test.ts src/lib/language.test.ts`

Expected: FAIL because the flow copy, markup, and screenshot files do not exist.

### Task 2: Capture real product screenshots

**Files:**
- Create: `public/home-flow/01-input.png`
- Create: `public/home-flow/02-draft.png`
- Create: `public/home-flow/03-card.png`

- [ ] **Step 1: Capture the input surface**

Log into the local demo account, open `/new`, and capture the material input panel without account data.

- [ ] **Step 2: Capture the draft and saved card surfaces**

Use an existing non-sensitive demo card to capture the draft editor and final card detail. Crop each screenshot to the relevant product panel.

### Task 3: Implement the walkthrough

**Files:**
- Modify: `src/lib/language.ts`
- Modify: `src/components/public-home.tsx`

- [ ] **Step 1: Add localized copy**

Add `flow.title`, `flow.description`, and three steps to both language dictionaries.

- [ ] **Step 2: Render the responsive section**

Render three screenshot figures below the hero using a stable `aspect-[16/10]`, graphite frames, A2 step colors, horizontal desktop layout, and vertical mobile layout.

- [ ] **Step 3: Run focused tests**

Run: `npx tsx --test src/app/public-entry.test.ts src/lib/language.test.ts`

Expected: PASS.

### Task 4: Verify

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run all tests and build**

Run: `npm test && npm run build`

Expected: all tests pass and the build exits with code 0.

- [ ] **Step 2: Verify desktop and mobile layouts**

Inspect `/` at `1280x800` and `390x844`. Confirm the hero remains first, the flow is readable below it, images do not distort, and there is no horizontal overflow.
