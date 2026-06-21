# Public Home Spectral Orbit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retune the approved Atlora public home from monochrome Graphite Orbit to the restrained A2 Spectral Orbit palette without changing its layout or behavior.

**Architecture:** Keep `PublicHome` as the existing localized client component and preserve all routes, copy, spacing, and responsive structure. Apply muted mineral blue, amber, and brick red only to planetary artwork, orbit signals, capability markers, and a small CTA detail while leaving the page predominantly neutral graphite.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Node test runner.

---

### Task 1: Lock the A2 visual contract

**Files:**
- Modify: `src/app/public-entry.test.ts`

- [ ] **Step 1: Add a failing structural test**

Assert that `PublicHome` contains the three spectral accent values, neutral graphite surface, and dedicated capability signal markers.

- [ ] **Step 2: Run the focused test**

Run: `npx tsx --test src/app/public-entry.test.ts`

Expected: FAIL because the current A page still uses the green-tinted palette and has no spectral capability markers.

### Task 2: Implement Spectral Orbit

**Files:**
- Modify: `src/components/public-home.tsx`

- [ ] **Step 1: Replace the green cast with neutral graphite**

Use near-black neutral surfaces and gray borders while preserving the current component tree, content hierarchy, links, and responsive dimensions.

- [ ] **Step 2: Add restrained category color**

Use mineral blue `#4f6f8f` for the primary planet, muted amber `#b48745` for a satellite, and brick red `#9a554b` for a small signal node. Add matching small capability dots and keep the CTA primarily neutral.

- [ ] **Step 3: Run focused tests**

Run: `npx tsx --test src/app/public-entry.test.ts src/lib/language.test.ts`

Expected: PASS.

### Task 3: Verify the local preview

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Verify desktop and mobile screenshots**

Open `/` at desktop and mobile viewport sizes. Confirm the page remains predominantly graphite, the three accents are visible but subordinate, text does not overlap, and both authentication actions remain usable.
