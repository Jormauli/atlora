# First Security Stability Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the first externally reachable ingestion surfaces before broader local testing.

**Architecture:** Keep the first batch scoped to existing request paths. Add small testable helpers around URL safety, image validation, and LLM request execution so route and provider behavior can be verified without broad refactors.

**Tech Stack:** Next.js 14 route handlers and middleware, `jose`, Node test runner via `tsx --test`, TypeScript, Prisma-backed services.

---

### Task 1: Link Fetch Safety

**Files:**
- Create: `src/lib/services/link-fetcher/safety.ts`
- Create: `src/lib/services/link-fetcher/service.test.ts`
- Modify: `src/lib/services/link-fetcher/service.ts`

- [ ] **Step 1: Write failing tests**

Add tests that prove regular link fetching rejects non-HTTP schemes and internal destinations before calling `fetch`, accepts HTML responses, rejects non-HTML content, enforces the configured timeout/body limit path, and preserves WeChat routing.

- [ ] **Step 2: Run the link fetch tests**

Run: `npm test -- src/lib/services/link-fetcher/service.test.ts`

Expected: failures because no URL safety helper, content-type guard, or bounded response read exists yet.

- [ ] **Step 3: Implement minimal link safety**

Resolve input hostnames, reject private, loopback, link-local, multicast, and unspecified IP ranges, allow only `http:` and `https:`, validate redirect targets, use an 8 second abort timeout, read at most 2 MB from the response stream, and parse only HTML-like content types.

- [ ] **Step 4: Re-run link fetch tests**

Run: `npm test -- src/lib/services/link-fetcher/service.test.ts`

Expected: pass.

### Task 2: Middleware JWT Verification

**Files:**
- Create: `middleware.test.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Write failing tests**

Add middleware tests for a missing cookie redirect, an invalid cookie redirect, and a valid HS256 JWT passing through.

- [ ] **Step 2: Run middleware tests**

Run: `npm test -- middleware.test.ts`

Expected: invalid JWT currently passes because middleware only checks cookie presence.

- [ ] **Step 3: Verify JWTs in middleware**

Use `jose` inside the edge-compatible middleware path, treat verification failures as unauthenticated, and keep the matcher unchanged.

- [ ] **Step 4: Re-run middleware tests**

Run: `npm test -- middleware.test.ts`

Expected: pass.

### Task 3: Image Route Safety

**Files:**
- Create: `src/lib/services/image-upload/validation.ts`
- Create: `src/lib/services/image-upload/validation.test.ts`
- Modify: `src/app/api/ingestions/image/route.ts`

- [ ] **Step 1: Write failing tests**

Add helper tests for JPEG, PNG, and WebP magic bytes plus rejection of a spoofed image payload. Add a route-level expectation that production errors use the generic Chinese failure message.

- [ ] **Step 2: Run image safety tests**

Run: `npm test -- src/lib/services/image-upload/validation.test.ts`

Expected: fail because magic-byte validation does not exist.

- [ ] **Step 3: Implement minimal image safety**

Accept `image/jpg` browser metadata, validate the buffered payload from magic bytes before ingestion, normalize accepted MIME types, and gate raw provider errors behind development mode.

- [ ] **Step 4: Re-run image safety tests**

Run: `npm test -- src/lib/services/image-upload/validation.test.ts`

Expected: pass.

### Task 4: LLM Request Controls

**Files:**
- Create: `src/lib/providers/llm/openai-compatible.test.ts`
- Modify: `src/lib/providers/llm/openai-compatible.ts`

- [ ] **Step 1: Write failing tests**

Add provider tests that prove `max_tokens` is sent from the selected route, requests carry an abort timeout, and one transient 5xx retries once before succeeding.

- [ ] **Step 2: Run provider tests**

Run: `npm test -- src/lib/providers/llm/openai-compatible.test.ts`

Expected: fail because current provider omits output limits and retry handling.

- [ ] **Step 3: Implement minimal request control**

Share one request helper between generation and JSON repair, pass output token limits, use an abort timeout, retry one 5xx response with short backoff, and preserve current usage parsing.

- [ ] **Step 4: Re-run provider tests**

Run: `npm test -- src/lib/providers/llm/openai-compatible.test.ts`

Expected: pass.

### Task 5: Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run targeted tests**

Run the new targeted tests for each task and inspect failures.

- [ ] **Step 2: Run project tests**

Run: `npm test`

Expected: all Node tests pass.

- [ ] **Step 3: Run static verification**

Run: `npm run lint`

Expected: no lint errors.

- [ ] **Step 4: Inspect diff**

Run: `git diff --stat` and review touched files before summarizing the batch.
