export const conceptRelationTypes = [
  "is_a",
  "part_of",
  "uses",
  "depends_on",
  "implemented_by",
  "based_on",
  "solves",
  "improves",
  "replaces",
  "similar_to",
  "alternative_to",
  "belongs_to",
  "created_by",
  "developed_by",
  "competes_with",
  "applies_to",
  "related_to"
] as const;

export type ConceptRelationType = typeof conceptRelationTypes[number];
export type ConceptRelevanceValue = "high" | "medium" | "low";

export interface KnowledgeConceptCandidate {
  id?: string;
  name: string;
  aliases?: string[];
  description?: string | null;
  relevance?: ConceptRelevanceValue;
  evidence?: string | null;
  reason?: string | null;
}

export interface ConceptRelationCandidate {
  source: string;
  relation_type: ConceptRelationType;
  target: string;
  evidence?: string | null;
  confidence?: number;
}

export interface SerializedKnowledgeConcept {
  id: string;
  name: string;
  description: string | null;
  relevance: ConceptRelevanceValue;
  evidence: string | null;
}

export interface SerializedRelatedCard {
  id: string;
  title: string;
  reason: string;
  relationType: ConceptRelationType | "shared_concept";
  conceptName: string;
  targetConceptName?: string;
}
