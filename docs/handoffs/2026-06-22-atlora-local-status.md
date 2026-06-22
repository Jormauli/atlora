# Atlora Local Status - 2026-06-22

## Project

- Chinese name: 知识星域
- English name: Atlora
- Repository: `/Users/Jorma/Documents/Codex/2026-05-16/web-mvp-ai-1-ai-1`
- Branch: `main`
- Local preview: `http://localhost:3000`
- Production domain: `https://www.atlora.io`
- Production hosting: Vercel
- Production database: Neon Postgres

## Version State

- The latest implementation is committed locally on `main`.
- Local `main` is ahead of `origin/main`; the bilingual SEO changes have not been pushed or deployed.
- Current production/GitHub baseline remains commit `810f53f` (`feat: publish Atlora public MVP experience`).
- Existing published tag: `atlora-mvp-2026-06-21`.
- The local checkpoint for this handoff is tagged `atlora-local-2026-06-22`.

Do not reset history, remove existing tags, or push the local checkpoint until the user confirms the next online release.

## Current Product

- Login and registration.
- Onboarding with one or more content-view choices.
- Text, link, and image ingestion.
- AI-generated structured knowledge cards.
- Dashboard browsing, filtering, card detail, editing, and confirmed deletion.
- Global Chinese/English interface switching without translating saved content.
- Dark Atlora starfield visual system and Stellar Core brand mark.
- Public product homepage and dark authentication experience.

## Latest Local Changes

The local version adds a complete bilingual SEO foundation:

- `/zh`: server-rendered Chinese public homepage.
- `/en`: server-rendered English public homepage.
- `/`: redirects signed-out visitors to `/zh` and signed-in users to `/dashboard`.
- Localized title, description, keywords, canonical URL, Open Graph, Twitter metadata, and JSON-LD.
- Reciprocal `hreflang` entries for `zh-Hans`, `en`, and `x-default`.
- `robots.txt`, `sitemap.xml`, and a 1200 x 630 social preview image.
- `X-Robots-Tag: noindex, nofollow` on private application, authentication, and API routes.
- Correct server and client `<html lang>` synchronization.
- Middleware moved to `src/middleware.ts` so Next.js includes it in production builds.

Verification completed before this checkpoint:

- `npm test`: 92/92 passed.
- `npm run build`: passed.
- Desktop and mobile bilingual homepage checks passed without horizontal overflow.
- Chinese/English URL switching, page copy, document language, metadata, sitemap, robots, social image, and private-route response headers were checked.
- Final independent code review reported no findings or material test gaps.

## Open Issue 1: WeChat Article Links Online

The application recognizes `mp.weixin.qq.com` URLs, but reliable online extraction is not currently available on Vercel.

The implemented extractor depends on local/server capabilities:

- `WECHAT_ARTICLE_PYTHON`
- `WECHAT_ARTICLE_TOOL_DIR`
- A Python article-to-Markdown tool
- Camoufox for browser capture
- Tencent OCR after screenshot capture

These dependencies exist in the local setup but are not a practical part of the current Vercel serverless runtime. Without the Python/browser layer, both direct extraction and screenshot OCR return the fallback result. Tencent OCR credentials alone are insufficient because the article must first be opened and captured.

Recommended staged solution:

1. MVP fallback: clearly offer screenshot upload or pasted article text when a WeChat link cannot be read.
2. Do not call the LLM or create a low-value fallback card when no article body was extracted.
3. Add extraction strategy, duration, and failure-reason logging.
4. Later deploy a separate containerized Python extraction worker and let Vercel submit jobs to it.
5. Store real job stages in Postgres: `queued`, `fetching`, `screenshot`, `ocr`, `generating`, `completed`, or `failed`.

## Open Issue 2: Processing Feedback

A loading component already exists in `src/app/new/page.tsx` and is included in the current production baseline. It displays estimated, elapsed-time-based stages below the submit button.

Why it is easy to miss:

- It is an inline panel below the action and may appear outside the visible viewport.
- Its visual contrast and footprint are restrained.
- It disappears immediately when navigation completes.
- Stages are estimated by elapsed time rather than reported by the backend.
- Image ingestion does not explicitly wait for the first loading paint before starting the request.

Recommended next change:

- Replace the inline panel with a prominent fixed processing panel or modal.
- Show it immediately for text, image, and link ingestion.
- Keep the active task and elapsed time visible until completion or failure.
- Provide direct recovery actions for link failures: upload screenshots or paste article text.
- For the MVP, describe stages as processing guidance rather than claiming real backend progress.
- After an asynchronous worker exists, drive the same UI from real persisted task stages.

## Recommended Next Development Order

1. Improve the processing panel and failure-recovery flow locally.
2. Skip LLM generation for unreadable links.
3. Add ingestion diagnostics and duration logging.
4. Confirm the local UX and push the existing bilingual SEO release.
5. Design and deploy the separate WeChat extraction worker.
6. Replace estimated progress with real asynchronous job status.

## Important Files

- `src/app/new/page.tsx`
- `src/lib/services/link-fetcher/wechat.ts`
- `src/lib/services/link-fetcher/service.ts`
- `src/lib/services/ingestion/service.ts`
- `scripts/capture_wechat_article.py`
- `src/lib/seo.ts`
- `src/app/[locale]/page.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/opengraph-image.tsx`
- `src/middleware.ts`
- `src/components/language-provider.tsx`

## Next-Window Starting Prompt

Continue Atlora from local tag `atlora-local-2026-06-22` in:

`/Users/Jorma/Documents/Codex/2026-05-16/web-mvp-ai-1-ai-1`

Read `docs/handoffs/2026-06-22-atlora-local-status.md` first. Keep changes local until confirmed. The next priority is the ingestion processing panel and unreadable-link recovery flow; do not start the external WeChat worker until that UX is approved.
