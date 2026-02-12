/**
 * Lightweight fuzzy search matcher.
 * Returns a score (0 = no match, higher = better match).
 * Supports:
 *  - Exact substring match (highest score)
 *  - Word-start matching ("cl" matches "Claude")
 *  - Character-sequence matching ("mdjrn" matches "Midjourney")
 */
export function fuzzyMatch(query: string, text: string): number {
  if (!query || !text) return 0;

  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact substring → highest score
  if (t.includes(q)) {
    // Bonus for matching at the start
    const startBonus = t.startsWith(q) ? 20 : 0;
    return 100 + startBonus;
  }

  // Word-start matching: check if query chars match start of consecutive words
  const words = t.split(/\s+/);
  let wordMatchCount = 0;
  let qIdx = 0;
  for (const word of words) {
    if (qIdx < q.length && word.startsWith(q[qIdx])) {
      wordMatchCount++;
      qIdx++;
    }
  }
  if (qIdx === q.length && wordMatchCount > 1) {
    return 60 + wordMatchCount * 5;
  }

  // Sequential character matching (fuzzy)
  let score = 0;
  let qi = 0;
  let prevMatchIdx = -2;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10;
      // Bonus for consecutive matches
      if (ti === prevMatchIdx + 1) score += 5;
      // Bonus for matching at word boundary
      if (ti === 0 || /\s/.test(t[ti - 1])) score += 3;
      prevMatchIdx = ti;
      qi++;
    }
  }

  // All query chars must be found in order
  if (qi < q.length) return 0;

  // Penalize long gaps between matches
  const coverage = q.length / t.length;
  score = score * (0.5 + coverage * 0.5);

  return Math.max(1, Math.round(score));
}

/**
 * Fuzzy search across multiple fields.
 * Returns the highest score from any field.
 */
export function fuzzySearchFields(
  query: string,
  fields: (string | undefined | null)[]
): number {
  let best = 0;
  for (const field of fields) {
    if (field) {
      const score = fuzzyMatch(query, field);
      if (score > best) best = score;
    }
  }
  return best;
}
