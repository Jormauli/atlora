# Online WeChat Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a deployed Atlora user submit a public WeChat article URL, observe real processing stages, and receive exactly one generated draft card from extracted article text.

**Architecture:** Vercel owns users, ingestion state, LLM generation, and cards in Neon. Google Cloud Tasks invokes a private Cloud Run Python worker that extracts WeChat text with pinned Camoufox tooling and reports signed stage, success, or failure callbacks to Vercel. All queue deliveries and callbacks are idempotent by ingestion ID.

**Tech Stack:** Next.js 14, TypeScript, Prisma/Postgres, Google Cloud Tasks, Cloud Run, Python 3.11, Camoufox, Tencent OCR, HMAC-SHA256.

---

### Task 1: Persist asynchronous ingestion state

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/202606230001_add_async_ingestion/migration.sql`
- Test: `src/lib/services/ingestion/state.test.ts`
- Create: `src/lib/services/ingestion/state.ts`

- [ ] Write tests proving only valid stage transitions are accepted and terminal states cannot move backward.
- [ ] Add `IngestionStage`, processing timestamps, failure code, template ID, unique card relation, and query indexes.
- [ ] Implement `canTransitionIngestionStage(current, next)` and run its focused test.
- [ ] Run `npx prisma generate` and commit.

### Task 2: Add signed worker contracts

**Files:**
- Create: `src/lib/services/worker/contracts.ts`
- Create: `src/lib/services/worker/signature.ts`
- Test: `src/lib/services/worker/signature.test.ts`

- [ ] Write tests for canonical payload signing, valid verification, invalid signatures, and expired timestamps.
- [ ] Implement Zod callback schemas and timing-safe HMAC verification using `WORKER_CALLBACK_SECRET`.
- [ ] Run focused tests and commit.

### Task 3: Submit links asynchronously and enqueue Cloud Tasks

**Files:**
- Create: `src/lib/services/task-queue/types.ts`
- Create: `src/lib/services/task-queue/google.ts`
- Create: `src/lib/services/task-queue/index.ts`
- Modify: `src/app/api/ingestions/link/route.ts`
- Modify: `src/app/api/ingestions/[id]/route.ts`
- Test: `src/lib/services/task-queue/google.test.ts`
- Test: `src/app/api/ingestions/link/route.test.ts`

- [ ] Write tests for deterministic task names and a `202 { ingestionId }` response.
- [ ] Create the ingestion as `received/queued`, persist the resolved template, enqueue one OIDC-authenticated task, and mark queue failures terminal.
- [ ] Return sanitized stage, timestamps, failure details, and card ID from the owner-scoped status route.
- [ ] Run focused tests and commit.

### Task 4: Process idempotent worker callbacks

**Files:**
- Create: `src/app/api/internal/ingestions/[id]/stage/route.ts`
- Create: `src/app/api/internal/ingestions/[id]/extracted/route.ts`
- Create: `src/app/api/internal/ingestions/[id]/failed/route.ts`
- Create: `src/lib/services/ingestion/async-service.ts`
- Modify: `src/lib/services/card/service.ts`
- Test: `src/lib/services/ingestion/async-service.test.ts`

- [ ] Write tests for rejected signatures, invalid transitions, stored extraction reuse, no LLM on failure, and exactly-one-card behavior.
- [ ] Implement idempotent stage/failure/extracted operations with Prisma transactions where state changes are coupled.
- [ ] Generate a card only after usable normalized text exists and attach it through unique `ingestionItemId`.
- [ ] Run focused tests and commit.

### Task 5: Build the Cloud Run extraction worker

**Files:**
- Create: `worker/app.py`
- Create: `worker/extractor.py`
- Create: `worker/tencent_ocr.py`
- Create: `worker/signing.py`
- Create: `worker/requirements.txt`
- Create: `worker/tests/test_worker.py`
- Modify: `docker/wechat-extractor/Dockerfile`
- Modify: `docker/wechat-extractor/requirements.txt`

- [ ] Write Python tests for URL restrictions, text-quality rejection, signed callbacks, terminal failures, and successful markdown extraction.
- [ ] Implement `/tasks/extract` with bounded markdown, screenshot, OCR, cleanup, and callback stages.
- [ ] Add Gunicorn/Flask and Tencent OCR dependencies, run the worker as a non-root HTTP service, and add `/healthz`.
- [ ] Run Python tests and build the Linux amd64 image in Google Cloud Build.
- [ ] Commit.

### Task 6: Replace estimated loading with real status polling

**Files:**
- Modify: `src/app/new/page.tsx`
- Modify: `src/lib/language.ts`
- Modify: `src/app/new/page.test.ts`
- Create: `src/lib/client/ingestion-status.ts`
- Test: `src/lib/client/ingestion-status.test.ts`

- [ ] Write tests for immediate queued state, two-second polling, refresh restoration, terminal navigation, and failure recovery.
- [ ] Put `ingestion` in the URL, poll owner-scoped status, display backend stages without percentages, and preserve the submitted URL on failure.
- [ ] Keep text/image ingestion behavior unchanged and localize all new UI in Chinese and English.
- [ ] Run focused tests and commit.

### Task 7: Provision isolated preview infrastructure

**Files:**
- Create: `infra/gcp/bootstrap.sh`
- Create: `infra/gcp/deploy-worker.sh`
- Create: `infra/gcp/README.md`
- Modify: `.env.example`

- [ ] Enable Cloud Build, Artifact Registry, Cloud Run, Cloud Tasks, and Secret Manager APIs in `atlora-500217`.
- [ ] Create a regional Artifact Registry repository, private Cloud Run service, queue, invoker service account, and least-privilege IAM bindings.
- [ ] Generate callback secret locally and store it in Google Secret Manager and Vercel Preview without printing it.
- [ ] Store Tencent OCR credentials in Secret Manager without committing them.
- [ ] Deploy preview Worker with min instances 0, max instances 1, concurrency 1, and bounded timeout.
- [ ] Commit infrastructure scripts without generated secrets.

### Task 8: Verify preview, release, and production

**Files:**
- Create: `docs/handoffs/2026-06-23-online-wechat-verification.md`

- [ ] Run `npm test`, `npm run build`, Prisma migration validation, Python tests, and image smoke tests.
- [ ] Deploy a Vercel Preview and apply the migration to the preview database.
- [ ] Test the supplied real WeChat link plus success, duplicate, refresh, deleted/private, and failure cases; record timings and confirm failures create no cards or LLM usage.
- [ ] Review Cloud Run logs for secret/article-body leakage and measure image size, memory, and cold start.
- [ ] Merge the verified branch into `main`, create a dated local tag, push `main` and the tag, deploy production, run one production smoke test, and document rollback commit/tag.
