# Atlora Knowledge Concept Graph

## Goal

Turn Atlora cards from isolated summaries into a reusable knowledge network.

The product goal is not to generate more text inside each card. The goal is to let every card contribute to a durable set of knowledge concepts, and to use those concepts and their relationships to surface the cards most worth revisiting and citing.

The first version should support the core path:

- Extract high-value knowledge concepts from each generated card.
- Reuse existing concepts and tags instead of creating near-duplicate names.
- Store relationships between concepts as first-class graph edges.
- Use concepts and edges to explain related cards in the card detail experience.

## Product Positioning

This feature fits Atlora's original "knowledge starfield" positioning. Current observation views answer which lens a card is useful for, such as investing, market research, tools, personal growth, news, knowledge, or viral articles. Knowledge concepts answer what durable ideas the card contributes to.

Observation views and knowledge concepts are complementary:

- Observation view: the usage context of a card.
- Tag: a lightweight filter label.
- Knowledge concept: a stable, reusable node in the user's knowledge graph.
- Concept relationship: a typed edge that explains how two concepts relate.

The first version should be private to each user. The schema can reserve room for future shared or public concepts, but the product should not begin with a global graph. User-private graphs avoid early quality, moderation, and ownership problems while the extraction and reuse rules are still being proven.

## Concept Standard

A generated concept should be accepted only when it passes the durable-value test:

- It is worth explaining independently.
- It may appear in at least 10 future cards.
- It can likely connect to at least two other concepts.
- It has long-term value rather than being only a time-sensitive fact.
- It can serve as a future search, aggregation, comparison, or explanation node.

Concepts are usually words or short phrases. They should be more durable and more specific than broad tags, but not so specific that they only describe one source.

Good examples:

- RAG
- Context Window
- AI Agent
- Vector Database
- Discounted Cash Flow
- Product-Led Growth

Weak examples:

- AI
- Good Article
- GPT-4o June 2026 Release Detail
- Things To Remember

## Tags

Tags should also become canonicalized entities instead of unstructured strings.

Tags remain useful for broad filtering and quick grouping, but they should not carry graph semantics. A tag can be "AI Tools". A concept can be "Tool Calling". A concept relationship can be "Tool Calling part_of Agent".

The tag generation rule is:

- Reuse an existing tag when the meaning is the same.
- Create a new tag only when it is meaningfully distinct.
- Keep tags short, broad, and useful for filtering.

## Data Model

The existing `Card` table continues to store the generated card summary and source metadata.

Add these logical entities:

### Tag

Canonical user tag.

Core fields:

- `id`
- `userId`
- `name`
- `aliases`
- `createdAt`
- `updatedAt`

### CardTag

Join table between a card and a canonical tag.

Core fields:

- `cardId`
- `tagId`
- `source`: `ai`, `user`, or `system`

### KnowledgeConcept

Canonical user knowledge concept.

Core fields:

- `id`
- `userId`
- `canonicalName`
- `aliases`
- `description`
- `status`: `active`, `merged`, or `hidden`
- `mergedIntoId`
- `createdAt`
- `updatedAt`

### CardConcept

Join table between a card and a concept.

Core fields:

- `cardId`
- `conceptId`
- `relevance`: `high`, `medium`, or `low`
- `evidence`
- `source`: `ai`, `user`, or `system`

### ConceptRelation

Typed relationship between two concepts.

Core fields:

- `id`
- `userId`
- `sourceConceptId`
- `relationType`
- `targetConceptId`
- `confidence`
- `status`: `active`, `rejected`, or `merged`
- `createdAt`
- `updatedAt`

### ConceptRelationEvidence

Evidence that a card supports a concept relationship.

Core fields:

- `relationId`
- `cardId`
- `evidence`
- `source`: `ai`, `user`, or `system`

The graph edge belongs between concepts, not between cards. Cards are evidence for edges. This avoids creating duplicate relation records every time two concepts appear together in a new card.

## First-Version Relation Types

Do not support the full relation taxonomy in the first version. Too many relation types will make AI output inconsistent and cleanup expensive.

Start with this controlled set:

- `is_a`
- `part_of`
- `uses`
- `depends_on`
- `implemented_by`
- `based_on`
- `solves`
- `improves`
- `replaces`
- `similar_to`
- `alternative_to`
- `belongs_to`
- `created_by`
- `developed_by`
- `competes_with`
- `applies_to`
- `related_to`

`related_to` is the fallback and should be used only when no more specific relation is justified.

Defer relation types such as `input_to`, `output_of`, `next_step`, and broader workflow edges until there is enough technical-process content to prove that workflow relations are valuable in practice.

## Generation Flow

Card generation should produce structured candidates:

- Card summary fields.
- Candidate tags.
- Candidate knowledge concepts.
- Candidate concept relationships.

Before creating tags or concepts, the system should read a bounded list of existing user tags and concepts. The model should be asked to either reuse an existing entity by id or propose a new candidate.

The pipeline should then:

1. Validate the generated card output.
2. Canonicalize candidate tags against existing tags and aliases.
3. Canonicalize candidate concepts against existing concepts and aliases.
4. Create only the genuinely new tags and concepts.
5. Attach the card to canonical tags through `CardTag`.
6. Attach the card to canonical concepts through `CardConcept`.
7. Upsert concept relationships by `(userId, sourceConceptId, relationType, targetConceptId)`.
8. Attach the card as relationship evidence through `ConceptRelationEvidence`.

For the first version, canonicalization can be AI-assisted with deterministic guardrails:

- Existing names and aliases are passed into the generation prompt.
- The model must choose an existing id when the meaning is the same.
- New concept candidates must include a short reason explaining why they are distinct.
- Server validation rejects empty names, very long names, and duplicate canonical names.

## UI Experience

The first product surface should be card-level, not a graph visualization.

Card detail should show:

- Knowledge concepts on this card.
- Related cards explained through shared concepts or concept relationships.
- A short reason for each related card, such as "Shares RAG" or "Connected through RAG solves Hallucination".

Dashboard search can later include concept names, aliases, and canonical tags. The first implementation does not need a full graph explorer.

## Backfill And Existing Cards

Do not automatically backfill every historical card in the first release.

Start with new cards only. Add a manual or batch backfill later after the extraction rules have been validated with fresh cards. This keeps rollout cost low and avoids generating a large amount of low-quality graph data before the canonicalization behavior is proven.

## Cost And Risk

The main cost is not database migration. The main cost is graph hygiene.

Risks:

- Near-duplicate concepts such as "AI Agent", "Agent", and "智能体".
- Relation overproduction, especially generic `related_to` edges.
- Relation-type confusion when too many types are available.
- Noisy tags if tag and concept boundaries are not enforced.
- Expensive backfills before prompt quality is proven.

Cost controls:

- Keep first-version relation types limited.
- Keep concept extraction capped, such as 3-7 concepts per card.
- Keep relation extraction capped, such as 0-5 relations per card.
- Prefer no edge over a weak edge.
- Do not backfill automatically.
- Keep concepts user-private first.

## Testing And Validation

Add tests for:

- AI card schema accepts concepts and relationships.
- Existing tags are reused when names or aliases match.
- Existing concepts are reused when names or aliases match.
- Duplicate relation edges are upserted rather than recreated.
- Relationship evidence can accumulate across multiple cards.
- Card detail serialization includes concepts and related-card explanations.
- Legacy cards without concepts still render normally.

Manual validation should check:

- New card generation creates only durable concepts.
- Existing concepts are reused across repeated related cards.
- Related cards are explainable to the user.
- The UI does not confuse tags, views, and knowledge concepts.

## Out Of Scope For First Version

- Public or global knowledge graph.
- Full graph visualization.
- Automatic historical backfill.
- User-facing concept merge/split UI.
- All relation types from the complete taxonomy.
- Cross-user concept deduplication.
- Automated multi-hop reasoning across the graph.

## Open Decision

The recommended first version is user-private concepts with schema room for future shared scope. If Atlora later needs a public graph, concepts can gain a `scope` field and shared concepts can be introduced after private graph quality is proven.
