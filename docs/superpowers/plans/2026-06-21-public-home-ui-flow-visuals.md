# Public Home UI Flow Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace screenshot-based flow previews with language-neutral code-rendered UI illustrations and remove the hero planet's diagonal signal line.

**Architecture:** Extract a focused `PublicHomeFlowVisual` component that renders one of three decorative variants from div-based UI primitives and Lucide icons. Keep localized step copy and layout in `PublicHome`, remove `next/image` and screenshot asset references, and preserve all existing routes and animations.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React, Node test runner.

---

### Task 1: Lock the new visual contract

**Files:**
- Modify: `src/app/public-entry.test.ts`

- [ ] **Step 1: Replace screenshot assertions**

Assert that `PublicHome` imports and renders `PublicHomeFlowVisual`, contains no `/home-flow/` path or `next/image` import, and no longer includes the diagonal signal-line class.

- [ ] **Step 2: Assert the illustration variants**

Assert that `src/components/public-home-flow-visual.tsx` exists and contains `input`, `extract`, and `card` variants with `aria-hidden` presentation.

- [ ] **Step 3: Run focused tests**

Run: `npx tsx --test src/app/public-entry.test.ts`

Expected: FAIL because the screenshot implementation and signal line still exist.

### Task 2: Build UI illustrations

**Files:**
- Create: `src/components/public-home-flow-visual.tsx`
- Modify: `src/components/public-home.tsx`

- [ ] **Step 1: Implement the three decorative variants**

Use language-neutral rectangles, dots, dividers, and Lucide icons to render input, extraction, and card states. Give the root a stable `aspect-[16/10]` and `aria-hidden="true"`.

- [ ] **Step 2: Replace screenshot rendering**

Remove `next/image`, screenshot arrays, and image markup. Render the three variants by index while retaining localized external copy.

- [ ] **Step 3: Remove the signal line**

Delete the short diagonal line next to the hero planet while preserving the central planet and orbit tracks.

- [ ] **Step 4: Run focused tests**

Run: `npx tsx --test src/app/public-entry.test.ts src/lib/language.test.ts`

Expected: PASS.

### Task 3: Remove obsolete assets and verify

**Files:**
- Delete: `public/home-flow/01-input.png`
- Delete: `public/home-flow/02-draft.png`
- Delete: `public/home-flow/03-card.png`

- [ ] **Step 1: Remove unused screenshots**

Delete only the three generated walkthrough screenshots and the empty `public/home-flow` directory.

- [ ] **Step 2: Run all tests and build**

Run: `npm test && npm run build`

Expected: all tests pass and the build exits with code 0.

- [ ] **Step 3: Verify responsive layouts**

Inspect `/` at `1280x800` and `390x844`, confirm all three illustrations fit without text or overflow, and verify Chinese and English external labels still switch correctly.
