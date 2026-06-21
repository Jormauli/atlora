# Atlora Bilingual SEO Design

## Goal

Make Atlora's public site independently discoverable for overseas Chinese and English searches without exposing private product routes or changing authenticated product behavior.

## Scope

- Add indexable Chinese and English public home URLs.
- Add localized metadata, canonical URLs, language alternates, social metadata, and structured data.
- Add sitemap and robots directives.
- Prevent indexing of authentication, application, card, API, and onboarding routes.
- Keep the current homepage design and all authenticated features unchanged.

Keyword landing pages, editorial content, analytics integrations, and paid keyword-volume tooling are not part of this change.

## URL Model

- `https://www.atlora.io/zh` is the canonical Simplified Chinese homepage.
- `https://www.atlora.io/en` is the canonical English homepage.
- `/` redirects authenticated users to `/dashboard` and unauthenticated users to `/zh`.
- The public language control links directly between `/zh` and `/en`.
- Visiting a localized homepage synchronizes the existing UI language preference so login and authenticated navigation continue in the selected language.
- Only `zh` and `en` are valid locale segments; other values return not found.

## Localized Search Intent

Chinese intent clusters:

- Primary: AI article summarization, article summarization tool, link summarization.
- Category: AI knowledge management, knowledge management tool, personal knowledge base.
- Long tail: webpage-to-knowledge-card and article-to-knowledge-card workflows.
- Brand: Atlora and Knowledge Starfield.

English intent clusters:

- Primary: AI article summarizer, article summarizer, link summarizer.
- Category: AI knowledge management, personal knowledge base.
- Long tail: knowledge card generator, article-to-notes, and turn links into knowledge cards.
- Brand: Atlora and Knowledge Starfield.

Public trend and suggestion data guides relative intent priority. Exact monthly search volumes require an authenticated advertising or commercial SEO data source and will not be fabricated. Meta keywords may be included for completeness, but visible copy, titles, descriptions, internal semantics, and crawlability are the primary signals.

## Metadata

Chinese title:

`AI 文章总结与知识卡片工具 | Atlora 知识星域`

English title:

`AI Article Summarizer & Knowledge Card Generator | Atlora`

Each locale receives:

- A natural-language description aligned with the page's visible product capabilities.
- Its own canonical URL.
- `hreflang` alternates for `zh-Hans`, `en`, and `x-default`.
- Localized Open Graph title, description, URL, and locale.
- Localized Twitter card title and description.
- A restrained keyword list matching actual product functionality.

The site metadata base is `https://www.atlora.io`.

## Public Rendering And Language State

The localized route passes its locale directly to the public homepage so the first server-rendered HTML contains the correct language. The page must not depend on a client-side local-storage read to replace Chinese copy after hydration.

The public language control uses crawlable links. When a localized page loads, it updates the existing global language preference. Authenticated routes retain the current global language toggle and URL structure.

## Structured Data

Each public homepage includes localized JSON-LD using `WebApplication`:

- Name and URL.
- Localized description.
- `ProductivityApplication` category.
- Browser operating-system scope.
- A factual feature list covering link, text, and image input; summaries; claims; evidence; actions; and saved knowledge cards.

No price, ratings, reviews, user counts, or unsupported claims will be added.

## Social Preview

Add a 1200 x 630 generated Open Graph image using the existing dark Atlora visual system and Stellar Core brand mark. The image uses the English brand name and product category so one asset remains legible for both locale pages. It contains no screenshots, ratings, or promotional claims.

## Crawl And Index Rules

The sitemap contains only:

- `https://www.atlora.io/zh`
- `https://www.atlora.io/en`

Private and utility routes receive `noindex, nofollow`, including:

- `/login`, `/register`, and `/onboarding`
- `/dashboard`, `/new`, `/settings`, and `/usage`
- `/cards/*`
- `/api/*`

`robots.txt` points to the sitemap and disallows private route families. Response-level `X-Robots-Tag` protection is used for non-public routes so private pages remain excluded even when directly linked.

## Error Handling

- Unsupported locale segments return a normal 404 response.
- Metadata generation is deterministic and does not call external services.
- Sitemap and robots generation do not depend on environment variables, preventing preview deployments from publishing incorrect production URLs.

## Testing

Automated tests will verify:

- Locale validation and localized SEO copy.
- Canonical and alternate URL generation.
- The sitemap includes only `/zh` and `/en`.
- Robots rules exclude private routes.
- Public routes remain indexable and private routes receive `X-Robots-Tag` protection.
- `/` preserves the existing authenticated redirect and redirects public visitors to `/zh`.
- Public language links point to the opposite locale.

Verification includes the full test suite, production build, `git diff --check`, and browser checks of `/zh`, `/en`, metadata, language switching, mobile layout, and the social preview asset.

## Acceptance Criteria

- `/zh` and `/en` return visibly correct server-rendered language content.
- Each locale has unique title, description, canonical URL, and language alternates.
- The public language control changes the URL and preserves the selected UI language for the application.
- Search crawlers can discover only the two public homepages through the sitemap.
- Private product and authentication routes are marked noindex.
- Existing login, registration, dashboard, card, and language-toggle behavior continues to pass tests.
