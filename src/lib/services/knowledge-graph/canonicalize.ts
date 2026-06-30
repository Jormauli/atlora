export interface CanonicalMatchInput {
  id: string;
  name: string;
  aliases?: string[];
}

export function normalizeEntityName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function uniqueCleanList(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value.trim();
    if (!cleaned) continue;
    const key = normalizeEntityName(cleaned);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}

export function findCanonicalMatch(value: string, existing: CanonicalMatchInput[]) {
  const normalized = normalizeEntityName(value);
  return existing.find((item) => {
    if (normalizeEntityName(item.name) === normalized) return true;
    return (item.aliases ?? []).some((alias) => normalizeEntityName(alias) === normalized);
  });
}
