# Manual Concepts And Product Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users manually add/remove card knowledge concepts while preserving the personal global concept library, then add minimal PostHog analytics for the core product funnel.

**Architecture:** Manual concepts extend the existing `KnowledgeConcept` and `CardConcept` graph tables through a small service API plus card-scoped route handlers. Analytics is isolated behind a tiny optional client/server helper so the app continues to build and test when PostHog environment variables are absent.

**Tech Stack:** Next.js App Router, React client components, Prisma, Zod, node:test, PostHog JS client.

---

## File Structure

- Modify `src/lib/services/knowledge-graph/service.ts`: export manual concept helpers that reuse the existing canonical matching rules and return serialized card concepts.
- Create `src/lib/services/knowledge-graph/manual-concepts.test.ts`: database-backed tests for add, canonical reuse, remove, source marking, deleted-card immutability, and user scoping.
- Create `src/app/api/cards/[id]/concepts/route.ts`: `POST` endpoint for adding a concept to a card owned by the current user.
- Create `src/app/api/cards/[id]/concepts/[conceptId]/route.ts`: `DELETE` endpoint for removing only the `CardConcept` link from a card owned by the current user.
- Create `src/app/api/cards/[id]/concepts/route.test.ts`: source-level route tests for auth, user scoping, validation, and service calls.
- Modify `src/lib/language.ts`: add Chinese and English copy for concept input, add/remove buttons, loading states, and errors.
- Modify `src/components/card-editor.tsx`: make concept chips editable with add/remove controls and refreshed local concept state.
- Modify `src/components/card-editor.test.ts`: assert the editor includes the new concept state, endpoint calls, and localized labels.
- Modify `package.json` and lockfile: add `posthog-js`.
- Create `src/lib/analytics/events.ts`: shared event names, safe metadata allow-listing, domain extraction, and optional server-side PostHog capture through the `/capture/` API.
- Create `src/lib/analytics/posthog-provider.tsx`: client-side PostHog initialization, pageview tracking, and signed-in user identification.
- Create `src/lib/analytics/events.test.ts`: unit tests for disabled analytics, safe metadata filtering, and domain-only URL handling.
- Modify `src/app/layout.tsx`: mount the analytics provider once around the app shell and pass safe signed-in user identity.
- Modify `src/app/api/auth/register/route.ts` and `src/app/api/auth/login/route.ts`: capture `user_registered` and `user_logged_in`.
- Modify ingestion/card routes and editor save flow: capture `material_submitted`, `link_ingestion_started`, `link_ingestion_failed`, `card_generated`, `card_saved`, `knowledge_concept_added`, and `knowledge_concept_removed`.
- Update `.env.example` if present: document `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

## Task 1: Manual Concept Service

**Files:**
- Modify: `src/lib/services/knowledge-graph/service.ts`
- Create: `src/lib/services/knowledge-graph/manual-concepts.test.ts`

- [ ] **Step 1: Write failing service tests**

Create `src/lib/services/knowledge-graph/manual-concepts.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { addManualCardConcept, removeManualCardConcept } from "./service";

test("addManualCardConcept creates a user concept and card link with source user", async () => {
  const user = await prisma.user.create({ data: { email: `manual-${Date.now()}@example.test`, passwordHash: "test" } });
  const card = await prisma.card.create({ data: baseCardData(user.id, "Manual RAG") });

  try {
    const concepts = await addManualCardConcept({ userId: user.id, cardId: card.id, name: "  RAG  " });
    const stored = await prisma.knowledgeConcept.findMany({ where: { userId: user.id } });
    const link = await prisma.cardConcept.findUnique({ where: { cardId_conceptId: { cardId: card.id, conceptId: concepts[0].id } } });

    assert.equal(concepts.length, 1);
    assert.equal(concepts[0].name, "RAG");
    assert.equal(stored.length, 1);
    assert.equal(stored[0].canonicalName, "RAG");
    assert.equal(link?.source, "user");
    assert.equal(link?.relevance, "medium");
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
});

test("addManualCardConcept reuses canonical concept names and aliases", async () => {
  const user = await prisma.user.create({ data: { email: `manual-alias-${Date.now()}@example.test`, passwordHash: "test" } });
  const card = await prisma.card.create({ data: baseCardData(user.id, "Alias RAG") });
  const existing = await prisma.knowledgeConcept.create({
    data: { userId: user.id, canonicalName: "RAG", aliases: ["Retrieval-Augmented Generation"] }
  });

  try {
    const concepts = await addManualCardConcept({
      userId: user.id,
      cardId: card.id,
      name: " retrieval-augmented generation "
    });
    const allConcepts = await prisma.knowledgeConcept.findMany({ where: { userId: user.id } });

    assert.equal(concepts.length, 1);
    assert.equal(concepts[0].id, existing.id);
    assert.equal(concepts[0].name, "RAG");
    assert.equal(allConcepts.length, 1);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
});

test("removeManualCardConcept deletes only the card concept link", async () => {
  const user = await prisma.user.create({ data: { email: `manual-remove-${Date.now()}@example.test`, passwordHash: "test" } });
  const card = await prisma.card.create({ data: baseCardData(user.id, "Remove RAG") });

  try {
    const added = await addManualCardConcept({ userId: user.id, cardId: card.id, name: "RAG" });
    const concepts = await removeManualCardConcept({ userId: user.id, cardId: card.id, conceptId: added[0].id });
    const remainingConcept = await prisma.knowledgeConcept.findUnique({ where: { id: added[0].id } });
    const remainingLink = await prisma.cardConcept.findUnique({
      where: { cardId_conceptId: { cardId: card.id, conceptId: added[0].id } }
    });

    assert.equal(concepts.length, 0);
    assert.ok(remainingConcept);
    assert.equal(remainingLink, null);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
});

test("manual concept helpers reject other users and deleted cards", async () => {
  const owner = await prisma.user.create({ data: { email: `manual-owner-${Date.now()}@example.test`, passwordHash: "test" } });
  const other = await prisma.user.create({ data: { email: `manual-other-${Date.now()}@example.test`, passwordHash: "test" } });
  const card = await prisma.card.create({ data: baseCardData(owner.id, "Private Card") });
  const deleted = await prisma.card.create({ data: { ...baseCardData(owner.id, "Deleted Card"), status: "deleted" } });

  try {
    await assert.rejects(
      () => addManualCardConcept({ userId: other.id, cardId: card.id, name: "RAG" }),
      /CARD_NOT_FOUND/
    );
    await assert.rejects(
      () => addManualCardConcept({ userId: owner.id, cardId: deleted.id, name: "RAG" }),
      /CARD_NOT_FOUND/
    );
  } finally {
    await prisma.user.delete({ where: { id: owner.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: other.id } }).catch(() => {});
  }
});

function baseCardData(userId: string, title: string) {
  return {
    userId,
    title,
    summary: "测试卡片",
    keyPoints: ["观点：测试"],
    actionItems: [],
    tags: [],
    category: "测试",
    cardType: "general_summary",
    perspective: "general",
    sourceType: "text" as const,
    aiTemplateId: "content_view"
  };
}
```

- [ ] **Step 2: Run the focused failing tests**

Run:

```bash
npm test -- src/lib/services/knowledge-graph/manual-concepts.test.ts
```

Expected: FAIL because `addManualCardConcept` and `removeManualCardConcept` are not exported.

- [ ] **Step 3: Implement the service helpers**

Modify `src/lib/services/knowledge-graph/service.ts` by adding exported helpers below `persistCardKnowledgeGraph` and reusing existing private functions:

```ts
export class ManualConceptError extends Error {
  constructor(public code: "CARD_NOT_FOUND" | "INVALID_CONCEPT_NAME", message = code) {
    super(message);
  }
}

export async function addManualCardConcept(input: { userId: string; cardId: string; name: string }) {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name || name.length > 80) throw new ManualConceptError("INVALID_CONCEPT_NAME");
  await assertWritableCard(input.userId, input.cardId);
  const conceptMap = await upsertConcepts(input.userId, [{ name, relevance: "medium" }]);
  const concept = conceptMap.get(name);
  if (!concept) throw new ManualConceptError("INVALID_CONCEPT_NAME");
  await prisma.cardConcept.upsert({
    where: { cardId_conceptId: { cardId: input.cardId, conceptId: concept.id } },
    update: { relevance: "medium", evidence: null, source: "user" },
    create: { cardId: input.cardId, conceptId: concept.id, relevance: "medium", evidence: null, source: "user" }
  });
  return listCardKnowledgeConcepts(input.userId, input.cardId);
}

export async function removeManualCardConcept(input: { userId: string; cardId: string; conceptId: string }) {
  await assertWritableCard(input.userId, input.cardId);
  await prisma.cardConcept.deleteMany({
    where: {
      cardId: input.cardId,
      conceptId: input.conceptId,
      card: { userId: input.userId, status: { not: "deleted" } },
      concept: { userId: input.userId }
    }
  });
  return listCardKnowledgeConcepts(input.userId, input.cardId);
}

export async function listCardKnowledgeConcepts(userId: string, cardId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId, status: { not: "deleted" } },
    include: {
      cardConcepts: {
        include: { concept: true },
        orderBy: [{ relevance: "desc" }, { concept: { canonicalName: "asc" } }]
      }
    }
  });
  if (!card) throw new ManualConceptError("CARD_NOT_FOUND");
  return card.cardConcepts.map((item) => ({
    id: item.concept.id,
    name: item.concept.canonicalName,
    description: item.concept.description,
    relevance: item.relevance,
    evidence: item.evidence
  }));
}

async function assertWritableCard(userId: string, cardId: string) {
  const card = await prisma.card.findFirst({ where: { id: cardId, userId, status: { not: "deleted" } }, select: { id: true } });
  if (!card) throw new ManualConceptError("CARD_NOT_FOUND");
}
```

- [ ] **Step 4: Run the service tests**

Run:

```bash
npm test -- src/lib/services/knowledge-graph/manual-concepts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the service layer**

Run:

```bash
git add src/lib/services/knowledge-graph/service.ts src/lib/services/knowledge-graph/manual-concepts.test.ts
git commit -m "feat: add manual knowledge concept service"
```

## Task 2: Card Concept API Routes

**Files:**
- Create: `src/app/api/cards/[id]/concepts/route.ts`
- Create: `src/app/api/cards/[id]/concepts/[conceptId]/route.ts`
- Create: `src/app/api/cards/[id]/concepts/route.test.ts`

- [ ] **Step 1: Write source-level API route tests**

Create `src/app/api/cards/[id]/concepts/route.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("card concept POST route authenticates validates and delegates to manual service", () => {
  const source = fs.readFileSync("src/app/api/cards/[id]/concepts/route.ts", "utf8");
  assert.ok(source.includes("getCurrentUser"));
  assert.ok(source.includes("z.object"));
  assert.ok(source.includes("name"));
  assert.ok(source.includes(".max(80)"));
  assert.ok(source.includes("addManualCardConcept"));
  assert.ok(source.includes("ManualConceptError"));
  assert.ok(source.includes("concepts"));
});

test("card concept DELETE route authenticates and removes only the card concept link", () => {
  const source = fs.readFileSync("src/app/api/cards/[id]/concepts/[conceptId]/route.ts", "utf8");
  assert.ok(source.includes("getCurrentUser"));
  assert.ok(source.includes("removeManualCardConcept"));
  assert.ok(source.includes("params.conceptId"));
  assert.ok(source.includes("ManualConceptError"));
  assert.ok(source.includes("concepts"));
});
```

- [ ] **Step 2: Run the focused failing route tests**

Run:

```bash
npm test -- src/app/api/cards/[id]/concepts/route.test.ts
```

Expected: FAIL because the route files do not exist.

- [ ] **Step 3: Implement the POST route**

Create `src/app/api/cards/[id]/concepts/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { addManualCardConcept, ManualConceptError } from "@/lib/services/knowledge-graph/service";

const conceptInputSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const parsed = conceptInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "知识点不能为空，且不能超过 80 个字符" }, { status: 400 });
  try {
    const concepts = await addManualCardConcept({ userId: user.id, cardId: params.id, name: parsed.data.name });
    return NextResponse.json({ concepts });
  } catch (error) {
    if (error instanceof ManualConceptError) {
      const status = error.code === "CARD_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: status === 404 ? "未找到" : "知识点不合法" }, { status });
    }
    throw error;
  }
}
```

- [ ] **Step 4: Implement the DELETE route**

Create `src/app/api/cards/[id]/concepts/[conceptId]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ManualConceptError, removeManualCardConcept } from "@/lib/services/knowledge-graph/service";

export async function DELETE(_: Request, { params }: { params: { id: string; conceptId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const concepts = await removeManualCardConcept({ userId: user.id, cardId: params.id, conceptId: params.conceptId });
    return NextResponse.json({ concepts });
  } catch (error) {
    if (error instanceof ManualConceptError) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }
    throw error;
  }
}
```

- [ ] **Step 5: Run route and service tests**

Run:

```bash
npm test -- src/app/api/cards/[id]/concepts/route.test.ts src/lib/services/knowledge-graph/manual-concepts.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the API routes**

Run:

```bash
git add src/app/api/cards/[id]/concepts src/lib/services/knowledge-graph/manual-concepts.test.ts
git commit -m "feat: add card concept endpoints"
```

## Task 3: Editable Concept UI

**Files:**
- Modify: `src/lib/language.ts`
- Modify: `src/components/card-editor.tsx`
- Modify: `src/components/card-editor.test.ts`

- [ ] **Step 1: Add failing editor tests**

Append assertions to `src/components/card-editor.test.ts`:

```ts
test("card editor lets users add and remove knowledge concepts", () => {
  const source = fs.readFileSync("src/components/card-editor.tsx", "utf8");
  assert.ok(source.includes("setConcepts"));
  assert.ok(source.includes("conceptInput"));
  assert.ok(source.includes(`/api/cards/${card.id}/concepts`));
  assert.ok(source.includes("method: \"POST\""));
  assert.ok(source.includes("method: \"DELETE\""));
  assert.ok(source.includes("copy.card.addKnowledgeConcept"));
  assert.ok(source.includes("copy.card.removeKnowledgeConcept"));
});
```

Append language assertions to `src/lib/language.test.ts`:

```ts
test("card concept editing copy exists in both languages", () => {
  assert.equal(uiCopy.zh.card.addKnowledgeConcept, "添加知识点");
  assert.equal(uiCopy.en.card.addKnowledgeConcept, "Add concept");
  assert.ok(uiCopy.zh.card.removeKnowledgeConcept);
  assert.ok(uiCopy.en.card.removeKnowledgeConcept);
});
```

- [ ] **Step 2: Run focused failing UI tests**

Run:

```bash
npm test -- src/components/card-editor.test.ts src/lib/language.test.ts
```

Expected: FAIL because the editor and language copy do not yet contain the new controls.

- [ ] **Step 3: Add localized copy**

Modify the `card` copy objects in `src/lib/language.ts`:

```ts
addKnowledgeConcept: "添加知识点",
addingKnowledgeConcept: "添加中...",
removeKnowledgeConcept: "移除知识点",
knowledgeConceptInputPlaceholder: "输入词语或短语",
knowledgeConceptAddFailed: "知识点添加失败，请稍后重试。",
knowledgeConceptRemoveFailed: "知识点移除失败，请稍后重试。",
```

For English:

```ts
addKnowledgeConcept: "Add concept",
addingKnowledgeConcept: "Adding...",
removeKnowledgeConcept: "Remove concept",
knowledgeConceptInputPlaceholder: "Enter a word or phrase",
knowledgeConceptAddFailed: "Could not add the concept. Try again.",
knowledgeConceptRemoveFailed: "Could not remove the concept. Try again.",
```

- [ ] **Step 4: Implement editable concept state and handlers**

Modify `src/components/card-editor.tsx`:

```ts
const [concepts, setConcepts] = useState(card.knowledgeConcepts ?? []);
const [conceptInput, setConceptInput] = useState("");
const [conceptError, setConceptError] = useState("");
const [isAddingConcept, setIsAddingConcept] = useState(false);
const [removingConceptId, setRemovingConceptId] = useState<string | null>(null);

async function addConcept() {
  const name = conceptInput.trim();
  if (!name || isAddingConcept) return;
  setConceptError("");
  setIsAddingConcept(true);
  try {
    const response = await fetch(`/api/cards/${card.id}/concepts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error ?? cardCopy.knowledgeConceptAddFailed);
    setConcepts(body.concepts ?? []);
    setConceptInput("");
    router.refresh();
  } catch {
    setConceptError(cardCopy.knowledgeConceptAddFailed);
  } finally {
    setIsAddingConcept(false);
  }
}

async function removeConcept(conceptId: string) {
  if (removingConceptId) return;
  setConceptError("");
  setRemovingConceptId(conceptId);
  try {
    const response = await fetch(`/api/cards/${card.id}/concepts/${conceptId}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error ?? cardCopy.knowledgeConceptRemoveFailed);
    setConcepts(body.concepts ?? []);
    router.refresh();
  } catch {
    setConceptError(cardCopy.knowledgeConceptRemoveFailed);
  } finally {
    setRemovingConceptId(null);
  }
}
```

Replace the read-only concept chip block with:

```tsx
<div className="space-y-2 text-sm">
  <div className="font-medium text-[#d8d2c6]">{copy.card.knowledgeConcepts}</div>
  <div className="rounded-md border border-[#354039] bg-[#101412] p-3">
    {concepts.length ? (
      <div className="mb-3 flex flex-wrap gap-2">
        {concepts.map((concept) => (
          <span key={concept.id} title={concept.evidence ?? concept.description ?? concept.name} className="inline-flex items-center gap-2 rounded-md border border-[#354039] bg-[#171d1a] px-2.5 py-1.5 text-xs text-[#d8d2c6]">
            <span>{concept.name}</span>
            <button
              type="button"
              aria-label={`${cardCopy.removeKnowledgeConcept}: ${concept.name}`}
              disabled={removingConceptId === concept.id}
              onClick={() => removeConcept(concept.id)}
              className="text-[#929c94] hover:text-[#f0c8c8] disabled:opacity-50"
            >
              x
            </button>
          </span>
        ))}
      </div>
    ) : (
      <p className="mb-3 text-sm text-[#7f897f]">{cardCopy.noKnowledgeConcepts}</p>
    )}
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        className={fieldClassName}
        value={conceptInput}
        maxLength={80}
        placeholder={cardCopy.knowledgeConceptInputPlaceholder}
        onChange={(event) => setConceptInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addConcept();
          }
        }}
      />
      <Button type="button" disabled={isAddingConcept || !conceptInput.trim()} onClick={addConcept} className="bg-[#d9e7c6] text-[#172018] hover:bg-[#c7dab0]">
        {isAddingConcept ? cardCopy.addingKnowledgeConcept : cardCopy.addKnowledgeConcept}
      </Button>
    </div>
    {conceptError ? <p className="mt-2 text-xs text-[#e7a09a]">{conceptError}</p> : null}
  </div>
</div>
```

- [ ] **Step 5: Run UI tests**

Run:

```bash
npm test -- src/components/card-editor.test.ts src/lib/language.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit editable concept UI**

Run:

```bash
git add src/components/card-editor.tsx src/components/card-editor.test.ts src/lib/language.ts src/lib/language.test.ts
git commit -m "feat: make card concepts editable"
```

## Task 4: PostHog Foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/analytics/events.ts`
- Create: `src/lib/analytics/events.test.ts`
- Create: `src/lib/analytics/posthog-provider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Install PostHog client**

Run:

```bash
npm install posthog-js
```

Expected: `package.json` and `package-lock.json` include `posthog-js`.

- [ ] **Step 2: Write analytics helper tests**

Create `src/lib/analytics/events.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildPostHogCapturePayload, safeAnalyticsProperties, domainFromUrl, isAnalyticsEnabled } from "./events";

test("analytics is disabled without a public PostHog key", () => {
  const previous = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  assert.equal(isAnalyticsEnabled(), false);
  if (previous) process.env.NEXT_PUBLIC_POSTHOG_KEY = previous;
});

test("safeAnalyticsProperties keeps only allowed metadata", () => {
  assert.deepEqual(
    safeAnalyticsProperties({
      sourceType: "link",
      templateId: "content_view",
      domain: "mp.weixin.qq.com",
      status: "failed",
      failureCode: "FETCH_FAILED",
      stage: "extracting",
      conceptSource: "user",
      rawUrl: "https://mp.weixin.qq.com/private",
      text: "private article",
      password: "secret"
    }),
    {
      sourceType: "link",
      templateId: "content_view",
      domain: "mp.weixin.qq.com",
      status: "failed",
      failureCode: "FETCH_FAILED",
      stage: "extracting",
      conceptSource: "user"
    }
  );
});

test("domainFromUrl returns host only", () => {
  assert.equal(domainFromUrl("https://mp.weixin.qq.com/s/private-path?token=secret"), "mp.weixin.qq.com");
  assert.equal(domainFromUrl("not a url"), undefined);
});

test("buildPostHogCapturePayload contains key event distinct id and safe properties only", () => {
  const payload = buildPostHogCapturePayload({
    apiKey: "phc_test",
    userId: "user-1",
    event: "knowledge_concept_added",
    properties: { conceptSource: "user", text: "private" }
  });
  assert.equal(payload.api_key, "phc_test");
  assert.equal(payload.event, "knowledge_concept_added");
  assert.equal(payload.distinct_id, "user-1");
  assert.deepEqual(payload.properties, { conceptSource: "user" });
});
```

- [ ] **Step 3: Run focused failing analytics tests**

Run:

```bash
npm test -- src/lib/analytics/events.test.ts
```

Expected: FAIL because `events.ts` does not exist.

- [ ] **Step 4: Implement analytics event helpers**

Create `src/lib/analytics/events.ts`:

```ts
export type AnalyticsEventName =
  | "user_registered"
  | "user_logged_in"
  | "material_submitted"
  | "link_ingestion_started"
  | "link_ingestion_failed"
  | "card_generated"
  | "card_saved"
  | "knowledge_concept_added"
  | "knowledge_concept_removed";

const allowedPropertyKeys = new Set(["sourceType", "templateId", "domain", "status", "failureCode", "stage", "conceptSource"]);

export function isAnalyticsEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function safeAnalyticsProperties(input: Record<string, unknown> = {}) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowedPropertyKeys.has(key)) continue;
    if (typeof value !== "string" || !value.trim()) continue;
    result[key] = value.trim().slice(0, 120);
  }
  return result;
}

export function domainFromUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

export function buildPostHogCapturePayload(input: {
  apiKey: string;
  userId?: string;
  event: AnalyticsEventName;
  properties?: Record<string, unknown>;
}) {
  return {
    api_key: input.apiKey,
    event: input.event,
    distinct_id: input.userId ?? "anonymous",
    properties: safeAnalyticsProperties(input.properties)
  };
}
```

- [ ] **Step 5: Implement client provider**

Create `src/lib/analytics/posthog-provider.tsx`:

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { Suspense, useEffect } from "react";

function PostHogPageviewTracker({ user }: { user?: { id: string; email?: string | null; createdAt?: string | null } | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false,
        autocapture: false,
        disable_session_recording: true
      });
    }
    if (user?.id) {
      posthog.identify(user.id, { email: user.email ?? undefined, createdAt: user.createdAt ?? undefined });
    }
    const query = searchParams?.toString();
    posthog.capture("$pageview", { $current_url: query ? `${pathname}?${query}` : pathname });
  }, [pathname, searchParams, user?.id, user?.email, user?.createdAt]);

  return null;
}

export function PostHogProvider({ children, user }: { children: React.ReactNode; user?: { id: string; email?: string | null; createdAt?: string | null } | null }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageviewTracker user={user} />
      </Suspense>
      {children}
    </>
  );
}
```

- [ ] **Step 6: Mount provider and document env vars**

Modify `src/app/layout.tsx` so the root layout reads safe identity and wraps children:

```tsx
import { PostHogProvider } from "@/lib/analytics/posthog-provider";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLanguage = headers().get("x-atlora-locale") === "en" ? "en" : "zh";
  const user = await getCurrentUser();
  const analyticsUser = user ? { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() } : null;

  return (
    <html lang={initialLanguage === "en" ? "en" : "zh-CN"}>
      <body>
        <LanguageProvider initialLanguage={initialLanguage}>
          <PostHogProvider user={analyticsUser}>{children}</PostHogProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
```

Append to `.env.example`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

- [ ] **Step 7: Run analytics tests and typecheck**

Run:

```bash
npm test -- src/lib/analytics/events.test.ts
npx tsc --noEmit
```

Expected: both pass.

- [ ] **Step 8: Commit PostHog foundation**

Run:

```bash
git add package.json package-lock.json src/lib/analytics src/app/layout.tsx .env.example
git commit -m "feat: add optional PostHog analytics foundation"
```

## Task 5: Analytics Event Wiring

**Files:**
- Modify: `src/lib/analytics/events.ts`
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `src/app/api/ingestions/text/route.ts`
- Modify: `src/app/api/ingestions/image/route.ts`
- Modify: `src/app/api/ingestions/link/route.ts`
- Modify: `src/app/api/cards/[id]/route.ts`
- Modify: `src/app/api/cards/[id]/save/route.ts`
- Modify: `src/app/api/cards/[id]/concepts/route.ts`
- Modify: `src/app/api/cards/[id]/concepts/[conceptId]/route.ts`
- Create: `src/lib/analytics/wiring.test.ts`

- [ ] **Step 1: Write source-level wiring tests**

Create `src/lib/analytics/wiring.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("auth routes capture registration and login events", () => {
  assert.ok(fs.readFileSync("src/app/api/auth/register/route.ts", "utf8").includes("user_registered"));
  assert.ok(fs.readFileSync("src/app/api/auth/login/route.ts", "utf8").includes("user_logged_in"));
});

test("ingestion routes capture safe material and link events", () => {
  const text = fs.readFileSync("src/app/api/ingestions/text/route.ts", "utf8");
  const image = fs.readFileSync("src/app/api/ingestions/image/route.ts", "utf8");
  const link = fs.readFileSync("src/app/api/ingestions/link/route.ts", "utf8");
  assert.ok(text.includes("material_submitted"));
  assert.ok(image.includes("material_submitted"));
  assert.ok(link.includes("material_submitted"));
  assert.ok(link.includes("link_ingestion_started"));
  assert.ok(link.includes("link_ingestion_failed"));
  assert.ok(link.includes("domainFromUrl"));
});

test("card save and concept routes capture card and manual concept events", () => {
  assert.ok(fs.readFileSync("src/app/api/cards/[id]/route.ts", "utf8").includes("card_saved"));
  assert.ok(fs.readFileSync("src/app/api/cards/[id]/save/route.ts", "utf8").includes("card_saved"));
  assert.ok(fs.readFileSync("src/app/api/cards/[id]/concepts/route.ts", "utf8").includes("knowledge_concept_added"));
  assert.ok(fs.readFileSync("src/app/api/cards/[id]/concepts/[conceptId]/route.ts", "utf8").includes("knowledge_concept_removed"));
});
```

- [ ] **Step 2: Run failing wiring tests**

Run:

```bash
npm test -- src/lib/analytics/wiring.test.ts
```

Expected: FAIL because route files do not capture the events yet.

- [ ] **Step 3: Add server capture helper**

Extend `src/lib/analytics/events.ts`:

```ts
export async function captureServerEvent(input: {
  userId?: string;
  event: AnalyticsEventName;
  properties?: Record<string, unknown>;
}) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
  const payload = buildPostHogCapturePayload({
    apiKey,
    userId: input.userId,
    event: input.event,
    properties: input.properties
  });
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("[analytics] capture failed", error);
  }
}
```

Use the public project key for server capture too, but only send allow-listed metadata:

- [ ] **Step 4: Wire auth events**

In `src/app/api/auth/register/route.ts`, import and call after user creation/session:

```ts
import { captureServerEvent } from "@/lib/analytics/events";

await captureServerEvent({ userId: user.id, event: "user_registered" });
```

In `src/app/api/auth/login/route.ts`, import and call after `createSession(user.id)`:

```ts
import { captureServerEvent } from "@/lib/analytics/events";

await captureServerEvent({ userId: user.id, event: "user_logged_in" });
```

- [ ] **Step 5: Wire ingestion events with safe metadata**

In text and image ingestion routes, call after validation and before/after successful card generation:

```ts
await captureServerEvent({
  userId: user.id,
  event: "material_submitted",
  properties: { sourceType: "text", templateId: parsed.data.templateId ?? "auto" }
});
```

Use `sourceType: "image"` in the image route.

In `src/app/api/ingestions/link/route.ts`, call:

```ts
await captureServerEvent({
  userId: user.id,
  event: "material_submitted",
  properties: { sourceType: "link", templateId: parsed.data.templateId ?? "auto", domain: domainFromUrl(parsed.data.url) }
});
await captureServerEvent({
  userId: user.id,
  event: "link_ingestion_started",
  properties: { sourceType: "link", templateId, domain: domainFromUrl(parsed.data.url), status: "received", stage: "queued" }
});
```

In link error branches, call:

```ts
await captureServerEvent({
  userId: user.id,
  event: "link_ingestion_failed",
  properties: { sourceType: "link", templateId, domain: domainFromUrl(parsed.data.url), status: "failed", failureCode: "QUEUE_UNAVAILABLE", stage: "failed" }
});
```

After synchronous successful card generation in text, image, and non-WeChat link routes, call:

```ts
await captureServerEvent({
  userId: user.id,
  event: "card_generated",
  properties: { sourceType: "text", templateId: card.aiTemplateId ?? "unknown", status: "completed" }
});
```

Use the correct source type in each route.

- [ ] **Step 6: Wire card save and concept events**

In `src/app/api/cards/[id]/route.ts`, after a successful PATCH:

```ts
await captureServerEvent({ userId: user.id, event: "card_saved" });
```

In `src/app/api/cards/[id]/save/route.ts`, after the draft save update succeeds:

```ts
await captureServerEvent({ userId: user.id, event: "card_saved" });
```

In the concept POST route, after `addManualCardConcept` succeeds:

```ts
await captureServerEvent({
  userId: user.id,
  event: "knowledge_concept_added",
  properties: { conceptSource: "user" }
});
```

In the concept DELETE route, after `removeManualCardConcept` succeeds:

```ts
await captureServerEvent({
  userId: user.id,
  event: "knowledge_concept_removed",
  properties: { conceptSource: "user" }
});
```

- [ ] **Step 7: Run analytics tests**

Run:

```bash
npm test -- src/lib/analytics/events.test.ts src/lib/analytics/wiring.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit event wiring**

Run:

```bash
git add src/lib/analytics src/app/api/auth src/app/api/ingestions src/app/api/cards
git commit -m "feat: track core product events"
```

## Task 6: Full Verification And Production Readiness

**Files:**
- Check: all files modified by Tasks 1-5

- [ ] **Step 1: Run the full automated suite**

Run:

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all pass without `NEXT_PUBLIC_POSTHOG_KEY`.

- [ ] **Step 2: Run local smoke QA**

Run:

```bash
npm run dev
```

Open the local app and verify:

- A saved card edit page shows existing concepts.
- Entering `RAG` and pressing Enter adds a chip.
- Adding `rag` again reuses the same concept and does not create a duplicate chip.
- Removing the chip removes it from that card.
- Refreshing the card page preserves the latest concept list.
- Creating a future card still has access to the manually added concept through existing graph context.
- Public and signed-in routes load normally with PostHog env vars absent.

- [ ] **Step 3: Inspect privacy-sensitive analytics paths**

Run:

```bash
rg -n "captureServerEvent|posthog.capture|rawUrl|text|password|sourceUrl" src/lib/analytics src/app src/components
```

Expected:

- No analytics call sends article body, generated card body, password, image content, full `rawUrl`, or full `sourceUrl`.
- Link analytics uses `domainFromUrl(...)`, not the full URL.
- Manual concept analytics sends only `conceptSource: "user"`, not the concept text.

- [ ] **Step 4: Commit any verification fixes**

If any fix was required during verification, commit it:

```bash
git add <fixed-files>
git commit -m "fix: harden manual concepts analytics flow"
```

Skip this step if no fixes were required.

- [ ] **Step 5: Final status summary**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
```

Expected: working tree clean, branch ahead only by intentional commits.

## Self-Review Checklist

- Manual concept add uses existing canonical matching through `upsertConcepts`.
- Manual concept remove deletes only `CardConcept`, not `KnowledgeConcept`.
- Manual links use `source = "user"`.
- All concept operations require current user and card ownership.
- Deleted cards remain immutable for concept add/remove.
- `CardEditor` works for both normal edit and draft confirmation pages because both use the same component.
- No concept candidate library, merge UI, relation editor, or standalone concept page is included.
- PostHog is optional and disabled when `NEXT_PUBLIC_POSTHOG_KEY` is absent.
- Session Replay and autocapture are disabled.
- Analytics events avoid article text, generated card text, password, image contents, full URL, and manual concept text.
- Full suite includes `npm test`, `npx tsc --noEmit`, and `npm run build`.
