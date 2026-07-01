# Manual Knowledge Concepts And Product Analytics

## Goal

Give Atlora two missing product-feedback loops:

- Let users correct and add the knowledge concepts that belong to a card.
- Let the product owner see whether users register, submit material, generate cards, save cards, and use manual concepts.

These are related but should remain separate implementation units. Manual concepts change the core knowledge graph. Analytics records user behavior around that core flow.

## Product Principles

Manual concepts should strengthen the graph, not become a second tag system.

PostHog should explain behavior and conversion, not store private user content. It should record event metadata, not article text, generated card text, or full user-entered knowledge concepts.

The first version should stay small. Do not build a full admin dashboard, a graph editor, concept merge UI, or custom analytics warehouse in this phase.

## Part 1: Manual Knowledge Concepts

### User Behavior

On the card edit and draft confirmation pages, the existing knowledge concept section becomes editable.

Users can:

- See the current knowledge concepts for the card.
- Add a concept by typing a word or short phrase.
- Remove a concept from the current card.

Adding a concept immediately writes to the user's private global knowledge concept library. "Global" means global inside that user's account, not shared across all Atlora users.

Removing a concept only removes the `CardConcept` link for that card. It does not delete the `KnowledgeConcept` record from the user's library, because other cards or future cards may still use it.

### Data Semantics

Manual concepts use the existing graph tables:

- `KnowledgeConcept` stores the user's canonical concept node.
- `CardConcept` links the card to the concept.
- `CardConcept.source = user` marks manual user input.

Manual concepts should be available to future AI generation through the existing `graphContext` flow. When a user adds `RAG` manually, future card generation should see `RAG` as an existing concept candidate and prefer reusing it.

### Duplicate Handling

Manual input must use the same canonical matching rules as AI-generated concepts.

When the user enters a concept:

1. Trim and normalize the name.
2. Compare it with the user's existing active `KnowledgeConcept` names and aliases.
3. Reuse the existing concept if a canonical match exists.
4. Create a new `KnowledgeConcept` only if no match exists.
5. Upsert the `CardConcept` link.

The first version does not need semantic embedding matching. Cross-language or semantic duplicates such as `RAG` and `检索增强生成` may still need aliases or later merge tools. This is acceptable for the first version.

### API

Add a card-scoped concept endpoint rather than overloading the existing generic card patch endpoint.

Suggested endpoints:

- `POST /api/cards/:id/concepts`
- `DELETE /api/cards/:id/concepts/:conceptId`

`POST` accepts:

```json
{
  "name": "RAG"
}
```

It returns the refreshed concept list for the card.

`DELETE` removes only that card's concept association and returns the refreshed concept list or `{ "ok": true }`.

Both endpoints must:

- Require the current authenticated user.
- Scope all card and concept operations to that user.
- Reject empty or overly long concept names.
- Keep deleted cards immutable.

### UI

In `CardEditor`, replace the read-only concept chip block with editable chips.

The first version should use a simple input:

- Placeholder: `添加知识点`
- Press Enter or click an add button to add.
- Each chip has a small remove button.
- Adding and removing should show a disabled/loading state on the affected control.

Autocomplete can wait. A first version without suggestions is enough if the backend canonical matching is reliable for exact names and aliases.

### Out Of Scope

Do not include:

- Candidate concepts.
- Public or shared concept libraries.
- Manual concept relation editing.
- Concept merge/split UI.
- A standalone knowledge concept library page.
- Bulk historical backfill.

## Part 2: PostHog Product Analytics

### Goal

Use PostHog to understand real user behavior:

- Public page visits.
- Registration and login conversion.
- Material submission.
- Link ingestion success and failure.
- Card save behavior.
- Manual concept usage.

PostHog is not the source of truth for billing, cards, or user content. The database remains the source of truth for users, cards, usage ledgers, and knowledge graph records.

### Environment

Add these public environment variables:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

If the key is absent, analytics should be disabled without errors.

### Identity

After authentication, identify signed-in users by `user.id`.

Allowed user properties:

- `email`
- `createdAt`
- `preferredLanguage` if available later

Do not record password data, article text, card text, image contents, or full private notes.

### Events

Start with a small event vocabulary:

- `user_registered`
- `user_logged_in`
- `material_submitted`
- `link_ingestion_started`
- `link_ingestion_failed`
- `card_generated`
- `card_saved`
- `knowledge_concept_added`
- `knowledge_concept_removed`

Recommended event properties:

- `sourceType`
- `templateId`
- `domain`
- `status`
- `failureCode`
- `stage`
- `conceptSource`

Avoid sending full URLs for private links. For links, send domain and source type only.

### Pageviews

Enable pageview tracking for public and signed-in routes.

The app should not double-count pageviews during client-side navigation. Use the PostHog Next.js integration pattern or a small client provider that listens to route changes once.

### Privacy And Cost Controls

Do not enable Session Replay in the first version.

Do not capture text inputs automatically.

Keep event count small. The initial target is fewer than 20 custom events.

PostHog should be optional in all environments. Local development and tests should pass without PostHog environment variables.

## Implementation Order

1. Manual concepts.
2. PostHog minimal analytics.

Manual concepts come first because they change the core product behavior. Analytics follows so the new behavior can be measured after it ships.

## Testing

Manual concepts:

- Adding a new concept creates a `KnowledgeConcept` for the current user and links it to the card.
- Adding a matching concept reuses the existing canonical concept.
- Removing a concept removes only `CardConcept`.
- Manual links use `source = user`.
- Other users cannot add or remove concepts on a card they do not own.
- Card edit pages serialize and render editable concepts.

Analytics:

- PostHog provider is disabled when env vars are missing.
- Auth and key workflows call event helpers with safe metadata.
- Event helper filters or avoids private text fields.
- Existing tests and production build pass without PostHog env vars.

## Success Criteria

- A user can manually add a knowledge concept to a card and see it persist after refresh.
- The manually added concept appears in the user's future graph context for AI generation.
- Removing a concept from one card does not delete the global concept node.
- PostHog can show a basic funnel from visit to registration to material submission to card save.
- No article body, generated card body, password, or full private URL is sent to PostHog.
