# Stellar Core Brand Mark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every active Atlora placeholder mark with the approved B Stellar Core logo before publishing the current MVP.

**Architecture:** Create one reusable SVG-based `BrandMark` component containing the mineral-blue core, two graphite orbits, and amber/brick-red satellites. Use it in public, authentication, application-shell, and dashboard brand links without changing link behavior or wordmarks.

**Tech Stack:** React 18, TypeScript, inline SVG, Node test runner.

---

### Task 1: Lock the shared-mark contract

**Files:**
- Modify: `src/lib/brand.test.ts`

- [ ] **Step 1: Add failing assertions**

Assert that `src/components/brand-mark.tsx` exists, contains the approved three palette values, and is imported by public home, auth frame, app shell, and dashboard workspace.

- [ ] **Step 2: Run the test**

Run: `npx tsx --test src/lib/brand.test.ts`

Expected: FAIL because the shared mark does not exist.

### Task 2: Implement and adopt the mark

**Files:**
- Create: `src/components/brand-mark.tsx`
- Modify: `src/components/public-home.tsx`
- Modify: `src/components/auth-frame.tsx`
- Modify: `src/components/app-shell-client.tsx`
- Modify: `src/components/dashboard-workspace.tsx`

- [ ] **Step 1: Implement the vector mark**

Render an accessible decorative SVG with stable `viewBox`, two orbit ellipses, a blue core, and amber/red satellites. Accept a `className` for sizing.

- [ ] **Step 2: Replace all placeholders**

Use `BrandMark` inside existing brand links and remove letter-A and Sparkles placeholders without changing navigation or text.

- [ ] **Step 3: Run focused tests**

Run: `npx tsx --test src/lib/brand.test.ts src/app/public-entry.test.ts src/app/shell-design.test.ts`

Expected: PASS.

### Task 3: Publish

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run full verification**

Run: `npm test && npm run build && git diff --check`

Expected: all tests pass, the build exits 0, and no whitespace errors are reported.

- [ ] **Step 2: Commit the current MVP**

Stage intended application and documentation files while excluding `.superpowers` review artifacts. Commit with a versioned MVP message and create a new annotated tag.

- [ ] **Step 3: Push main and tag**

Push `main` and the new tag to `origin`, allowing the connected Vercel project to deploy automatically.
