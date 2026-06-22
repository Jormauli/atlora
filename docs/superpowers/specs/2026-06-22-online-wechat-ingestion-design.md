# Atlora Online WeChat Ingestion Design

## Goal

Deliver the complete WeChat article ingestion flow online. A signed-in user submits a real `mp.weixin.qq.com` article URL, Atlora extracts usable article content in cloud infrastructure, generates one draft knowledge card, and reports real processing state until completion or failure.

Local-only extraction is not a completion criterion. The feature is complete only after the deployed preview environment passes end-to-end tests with real WeChat articles.

This design does not impose a user-visible processing deadline. Every technical step still has a bounded timeout and retry policy so jobs cannot remain stuck indefinitely.

## Current Problem

The Next.js application runs on Vercel, while the successful local WeChat extractor depends on Python, `wechat-article-for-ai`, Camoufox, a full browser, temporary screenshots, and Tencent OCR. Those dependencies are not part of the current Vercel deployment.

The current link ingestion request is synchronous. When extraction fails, it still invokes the LLM and creates a low-value "unread link" card. The loading panel estimates progress from elapsed time instead of reporting backend state. These behaviors make the local implementation appear complete while the production path remains unavailable.

## Selected Architecture

Keep the website, authentication, ordinary APIs, LLM orchestration, and Neon Postgres on the current Atlora stack. Add a dedicated asynchronous WeChat extraction worker deployed as a scale-to-zero container.

Use Google Cloud Tasks as the durable dispatcher and Cloud Run as the worker runtime:

1. Vercel validates the submitted URL and creates an ingestion record in Neon.
2. Vercel enqueues a Cloud Task and immediately returns the ingestion ID.
3. Cloud Tasks invokes the private Cloud Run worker with Google-issued OIDC authentication.
4. The worker runs the complete extraction strategy and reports signed stage updates to Atlora.
5. After usable text is returned, Atlora stores the processing result and invokes the existing LLM orchestration.
6. Atlora creates exactly one draft card, marks the ingestion complete, and exposes the card ID through the status API.
7. The browser polls the status API and navigates to the draft card when complete.

Cloud Run uses zero minimum instances and a low initial maximum instance count. This avoids fixed idle browser cost while retaining a runtime that can install the exact Python and browser dependencies used locally.

## Responsibilities

### Vercel Application

- Authenticate the user and validate link input.
- Reject unsafe or unsupported URLs before enqueuing work.
- Create and own ingestion, processing-result, and card records.
- Enqueue one idempotent extraction task.
- Accept only authenticated, signed worker callbacks.
- Generate a card only after validated article content exists.
- Expose user-scoped status without leaking article text or internal errors.
- Render the processing panel and recovery actions.

### Cloud Tasks

- Durably dispatch each extraction job.
- Retry transient worker failures with bounded exponential backoff.
- Identify each job by ingestion ID so retries cannot create duplicate cards.
- Authenticate to Cloud Run through OIDC; the worker is not publicly invocable.

### Cloud Run Worker

- Accept only Cloud Tasks requests.
- Validate that the URL is an HTTPS WeChat article URL.
- Execute the extraction strategies in order.
- Report real stage changes and structured failure reasons.
- Return only normalized title, body text, source metadata, strategy, confidence, and timing data.
- Delete screenshots and temporary article files after every attempt.
- Never call the LLM or write Atlora user/card data directly.

## Extraction Strategy

The container reproduces the working local environment in a versioned, repeatable image. It must not depend on `WECHAT_ARTICLE_TOOL_DIR` pointing to files on a developer machine.

1. Run the Markdown extractor with a pinned version of `wechat-article-for-ai`.
2. Validate the extracted text using minimum length, expected language/content ratios, and known challenge-page rejection rules.
3. If Markdown extraction fails, open the article with Camoufox and capture the complete rendered article.
4. Send the screenshot to Tencent OCR and validate confidence and text quality.
5. Retry the screenshot/OCR strategy once for transient rendering or OCR failures.
6. If no strategy yields usable text, report a terminal structured failure; do not fabricate content.

The worker records per-stage duration and one of these strategies: `wechat_markdown`, `wechat_screenshot_ocr`, or `wechat_failed`.

Technical safety limits:

- Markdown extraction: 120 seconds per attempt.
- Browser capture: 120 seconds per attempt.
- OCR call: 30 seconds per attempt.
- Screenshot/OCR attempts: two.
- Whole worker task: eight minutes.
- Cloud Tasks delivery attempts: three, only for transient infrastructure failures.

Content failures such as a deleted article, access confirmation, or persistent CAPTCHA are terminal and are not retried automatically.

## Data Model

Retain `IngestionStatus` as the coarse lifecycle and add a separate `IngestionStage` for user-visible progress:

- `queued`
- `opening_article`
- `extracting_text`
- `capturing_screenshot`
- `recognizing_text`
- `generating_card`
- `completed`
- `failed`

Add these fields to `IngestionItem`:

- `stage`: current `IngestionStage`
- `failureCode`: stable machine-readable failure reason
- `processingStartedAt`
- `processingCompletedAt`

Add a unique nullable `ingestionItemId` relation to `Card` and the inverse nullable `card` relation to `IngestionItem`. This single relation is the result reference and enforces exactly one card per ingestion across callback or task retries.

Map the detailed stages to the existing coarse status consistently:

- `queued` uses `received`.
- Active extraction and generation stages use `processing`.
- `completed` uses `processed`.
- `failed` uses `failed`.

Store extraction strategy, stage durations, source metadata, and OCR confidence in `ProcessingResult.sourceMetadata`. Store normalized article text in `ProcessingResult.normalizedText`; do not place full article text in application logs.

## API Flow

### Submit

`POST /api/ingestions/link`

- Validates authentication, URL safety, and supported protocol.
- Creates an ingestion with `status=received` and `stage=queued`.
- Enqueues the Cloud Task.
- Returns `202` with `{ ingestionId }` instead of waiting for a card.

For ordinary non-WeChat webpages, the same asynchronous contract is used even if direct extraction completes quickly. This gives the UI one consistent processing model and prevents long Vercel requests.

### Worker Stage Callback

`POST /api/internal/ingestions/:id/stage`

- Accepts only a timestamped HMAC-signed worker request.
- Rejects replayed, expired, unknown, or invalid stage transitions.
- Updates stage and sanitized diagnostic metadata idempotently.

### Worker Completion Callback

`POST /api/internal/ingestions/:id/extracted`

- Validates the signed payload and article-text quality.
- Upserts `ProcessingResult` idempotently.
- Changes the stage to `generating_card`.
- Calls the existing card-generation path.
- Creates or returns the unique card for this ingestion.
- Marks the ingestion `processed/completed`.

If card generation fails after extraction succeeds, the ingestion remains retryable from the stored normalized text; extraction is not repeated.

### Worker Failure Callback

`POST /api/internal/ingestions/:id/failed`

- Records a stable failure code and sanitized user-facing message.
- Marks the ingestion `failed/failed`.
- Does not call the LLM and does not create a fallback card.

### Status

`GET /api/ingestions/:id`

- Remains scoped to the signed-in owner.
- Returns coarse status, current stage, elapsed timestamps, failure code/message, and card ID.
- Does not return internal stack traces, credentials, screenshots, or full extracted article text.

## Processing Panel

Replace the inline estimated progress bar with a prominent fixed panel shown immediately after submission.

The panel contains:

- A restrained Atlora orbit animation and current stage label.
- A stage list driven exclusively by the status API.
- Elapsed time without a fabricated percentage or completion estimate.
- A message that the user may leave the page while processing continues online.
- A cancel/dismiss affordance that does not incorrectly claim the backend task was canceled.

The current ingestion ID is placed in the page URL so refresh restores the same task. Poll every two seconds while the document is visible, use slower polling while hidden, and stop after a terminal state.

On completion, navigate to `/cards/:id/draft`. On failure, keep the submitted URL visible and offer three direct actions:

- Retry extraction.
- Upload one or more screenshots.
- Paste article text.

The animation respects `prefers-reduced-motion`, the status text uses an `aria-live` region, and focus moves to the failure message when recovery is required.

## Failure and Retry Semantics

- Queue or container outages are transient and may be retried automatically.
- Invalid URLs, deleted/private articles, persistent CAPTCHA, empty extraction, and low-quality OCR are terminal content failures.
- Worker callbacks and card generation are idempotent by ingestion ID.
- A user retry creates a new extraction attempt for the same ingestion only when the previous attempt is terminal.
- Recovery through screenshot or pasted text reuses the saved source URL but does not rerun failed link extraction.
- No usable article text means zero LLM calls and zero cards.

## Security

- Keep Cloud Run private and permit invocation only by the Cloud Tasks service account.
- Store Tencent OCR credentials and callback secrets in managed environment secrets, never in the container image.
- Sign callbacks with method, path, timestamp, ingestion ID, and body digest; reject requests outside a short replay window.
- Revalidate URL safety inside the worker and allow only `https://mp.weixin.qq.com` for the browser path.
- Limit redirect count, response size, screenshot size, callback payload size, concurrency, and per-user submissions.
- Redact article body, cookies, secrets, and screenshots from logs.

## Observability and Cost Controls

Record structured events for queue delay, every extraction stage, strategy, duration, retry count, result quality, callback result, LLM start, and terminal status.

The initial deployment uses:

- Zero minimum Cloud Run instances.
- A low maximum instance count to cap browser concurrency and spending.
- One browser extraction per container at a time until memory measurements justify more.
- Cloud Tasks queue rate and concurrency limits.
- Alerts for failure rate, stuck jobs, callback rejection, and unexpected invocation volume.

No production SLA or cost claim is made from local measurements. Both are established from preview telemetry.

## Verification

### Automated

- Unit tests cover stage-transition validation, URL restrictions, callback signatures, replay rejection, text-quality gates, terminal failure classification, and idempotency.
- Integration tests cover task enqueueing, stage callbacks, extraction completion, LLM suppression on failure, card-generation retry, and exactly-one-card behavior.
- UI tests cover immediate panel visibility, real stages, refresh restoration, completion navigation, failure recovery, reduced motion, and bilingual copy.
- Existing text and image ingestion behavior remains covered.
- `npm test` and `npm run build` pass.
- The worker image builds reproducibly and its Python test suite passes.

### Actual Online Preview

Local extraction tests are diagnostic only and cannot approve the feature.

Before production release:

1. Deploy the worker, queue, secrets, and Atlora changes to isolated preview resources.
2. Run at least 100 real WeChat article URLs, including previously saved examples, fresh unseen links, long articles, image-heavy articles, deleted/private links, and links that trigger the OCR fallback.
3. Verify successful extraction content against the rendered source rather than trusting HTTP success.
4. Record queue delay, extraction strategy, P50/P95/P99 duration, OCR usage, failure reason, and card-generation outcome.
5. Test refresh, browser close/reopen, duplicate submission, callback retry, worker restart, queue retry, and recovery actions.
6. Confirm that failed extraction produces no LLM usage and no fallback card.
7. Review measured cost per successful article and failure rate before approving production.

Production deployment remains a separate explicit approval. No Git push, production environment change, DNS change, or `atlora.io` deployment is part of implementing the preview design.

## Scope Boundaries

Included:

- Complete online WeChat extraction.
- Durable asynchronous processing.
- Real loading stages and failure recovery.
- Preview deployment and evidence-based online verification.

Excluded:

- A three-second extraction guarantee.
- Translation of saved article content.
- General-purpose crawling beyond submitted article URLs.
- Personal-WeChat desktop automation as a production dependency.
- Production release before preview evidence and explicit user approval.
