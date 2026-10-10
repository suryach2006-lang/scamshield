/**
 * Rule: Guaranteed Selection Without Evaluation & Manufactured Urgency
 * Flags claims of direct hiring without interviews, guaranteed selection,
 * or immediate appointment letters.
 */

const { SEVERITY, INDICATOR_TYPES } = require('../constants');
const { findMatchesWithContext } = require('../textMatcher');

const GUARANTEED_SELECTION_PATTERNS = [
  { pattern: /\b(?:direct|instant|immediate)\s+(?:joining|selection|hiring|appointment)\s+(?:without\s+(?:an?\s+|any\s+)?)?(?:interview|test|exam|assessment)\b/gi, label: 'direct/immediate joining without interview' },
  { pattern: /\b(?:100%|guaranteed)\s+(?:selection|job|placement|hiring|income|earnings?|salary|payout)\b/gi, label: 'guaranteed selection or income' },
  { pattern: /\b(?:no\s+interview\s+(?:required|needed|conducted)|without\s+(?:an?\s+|any\s+)?interview)\b/gi, label: 'no interview needed' },
  { pattern: /\bimmediate\s+selection\b/gi, label: 'immediate selection claim' },
  { pattern: /\b(?:immediate|direct)\s+appointment\s+letter\s+(?:within|in)\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)\b/gi, label: 'instant appointment letter' },
  { pattern: /\b(?:only\s+\d+\s+seats?\s+left|limited\s+slots?\s+remaining)[^.]{1,50}(?:hurry|apply\s+fast|pay\s+now)\b/gi, label: 'manufactured scarcity urgency' }
];

module.exports = {
  id: 'URGENT_UNVERIFIED_OFFER',
  name: 'Guaranteed Offer & High-Pressure Urgency Rule',

  evaluate: (input) => {
    const indicators = [];
    const fieldsToInspect = [
      { name: 'jobDescription', text: input.jobDescription },
      { name: 'jobTitle', text: input.jobTitle },
      { name: 'recruiterContact', text: input.recruiterContact.raw }
    ];

    for (const field of fieldsToInspect) {
      if (!field.text) continue;

      const matches = findMatchesWithContext(field.text, GUARANTEED_SELECTION_PATTERNS, 50);

      if (matches.length > 0) {
        const primaryMatch = matches[0];
        const uniquePhrases = [...new Set(matches.map((m) => m.matchedPhrase))].slice(0, 3);

        indicators.push({
          id: 'URGENT_UNVERIFIED_OFFER',
          type: INDICATOR_TYPES.URGENT_UNVERIFIED_OFFER,
          severity: SEVERITY.HIGH,
          title: 'Guaranteed Hiring or Offer Letter Without Formal Interview',
          explanation:
            'Legitimate employers require structured technical or behavioral assessments before issuing offers. Promising 100% guaranteed selection or instant appointment letters without an interview is a standard fraud tactic to solicit fees.',
          evidence: {
            source: `user_input.${field.name}`,
            field: field.name,
            matchedText: primaryMatch.snippet,
            detectedPhrases: uniquePhrases
          }
        });
        break;
      }
    }

    return { indicators };
  }
};
