/**
 * Text Matcher Helper for Evidence Extraction.
 * Accurately locates matched patterns and extracts surrounding text snippets
 * without altering or hallucinating evidence.
 */

/**
 * Finds all matches of patterns against target text and returns evidence snippets.
 * @param {string} text - Source text to inspect
 * @param {Array<{ pattern: RegExp, label?: string }>} patterns - Array of regex patterns
 * @param {number} [contextLength=60] - Number of characters of surrounding context to include
 * @returns {Array<{ matchedPhrase: string, snippet: string, patternIndex: number }>}
 */
const findMatchesWithContext = (text, patterns, contextLength = 60) => {
  if (!text || typeof text !== 'string') return [];

  const results = [];
  const lowerText = text;

  patterns.forEach((item, index) => {
    const regex = item.pattern;
    // Reset regex if global
    regex.lastIndex = 0;

    let match;
    // If not global, execute once; if global, loop
    if (regex.global) {
      while ((match = regex.exec(lowerText)) !== null) {
        const start = Math.max(0, match.index - contextLength);
        const end = Math.min(lowerText.length, match.index + match[0].length + contextLength);
        const prefix = start > 0 ? '...' : '';
        const suffix = end < lowerText.length ? '...' : '';
        const snippet = `${prefix}${text.slice(start, end).trim()}${suffix}`;

        results.push({
          matchedPhrase: match[0],
          snippet,
          patternIndex: index,
          label: item.label
        });
      }
    } else {
      match = regex.exec(lowerText);
      if (match) {
        const start = Math.max(0, match.index - contextLength);
        const end = Math.min(lowerText.length, match.index + match[0].length + contextLength);
        const prefix = start > 0 ? '...' : '';
        const suffix = end < lowerText.length ? '...' : '';
        const snippet = `${prefix}${text.slice(start, end).trim()}${suffix}`;

        results.push({
          matchedPhrase: match[0],
          snippet,
          patternIndex: index,
          label: item.label
        });
      }
    }
  });

  return results;
};

/**
 * Extract clean single snippet or null.
 * @param {string} text
 * @param {RegExp} pattern
 * @returns {{ matchedPhrase: string, snippet: string } | null}
 */
const findFirstMatch = (text, pattern) => {
  if (!text || typeof text !== 'string') return null;
  const matches = findMatchesWithContext(text, [{ pattern }], 60);
  return matches.length > 0 ? matches[0] : null;
};

module.exports = {
  findMatchesWithContext,
  findFirstMatch
};
