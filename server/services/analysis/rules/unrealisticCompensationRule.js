/**
 * Rule: Unrealistic Compensation Claims
 * Flags exaggerated daily/hourly income promises, especially for low-skill,
 * minimal-effort roles (e.g., data entry, video liking, copy-paste).
 */

const { SEVERITY, INDICATOR_TYPES } = require('../constants');
const { findMatchesWithContext } = require('../textMatcher');

const UNREALISTIC_PAY_PATTERNS = [
  { pattern: /\bearn\s+(?:up\s+to\s+)?(?:rs\.?|inr|₹|\$)\s*[0-9,]{4,}\s*(?:per\s+day|\/day|daily)/gi, label: 'exorbitant daily earnings' },
  { pattern: /\b(?:daily\s+income|daily\s+earning|daily\s+payout)\s*(?:of\s+)?(?:rs\.?|inr|₹|\$)?\s*[0-9,]{4,}/gi, label: 'daily payout claim' },
  { pattern: /\b(?:earn|make)\s+[0-9,]{4,}\s*(?:to|-)\s*[0-9,]{4,}\s*(?:daily|per\s+day)/gi, label: 'daily earning range' },
  { pattern: /\bwork\s+(?:only\s+)?(?:1|2|1-2|half)\s*(?:hour|hr)s?\s*(?:a\s+day|daily)?\s*(?:and|to)\s*earn\b/gi, label: 'minimal hours high earnings' },
  { pattern: /\b(?:guaranteed|instant)\s+(?:daily\s+|monthly\s+|weekly\s+)?(?:payout|income|salary|cash|earnings?)\b/gi, label: 'guaranteed payout or income' },
  { pattern: /\b(?:no\s+experience|no\s+skills?|no\s+qualification)\s+(?:needed|required)[^.]{1,60}(?:₹|\$|rs\.?)\s*[0-9,]{5,}/gi, label: 'high pay zero experience' },
  { pattern: /(?:₹|\$|rs\.?)\s*[0-9,]{4,}[^.]{0,60}(?:no\s+experience|no\s+skills?|no\s+qualification)\s+(?:needed|required)/gi, label: 'high pay zero experience' },
  { pattern: /\b(?:guaranteed\s+)?income\s+(?:of\s+)?(?:rs\.?|inr|₹|\$)?\s*[0-9,]{4,}[^.]{0,60}(?:no\s+experience|no\s+skills?|no\s+qualification)/gi, label: 'guaranteed income with zero experience' }
];

// Low skill roles that scam campaigns frequently target with fake high compensation
const LOW_SKILL_KEYWORDS = [
  'data entry',
  'typing',
  'copy paste',
  'form filling',
  'sms sending',
  'captcha',
  'watching videos',
  'like and subscribe'
];

module.exports = {
  id: 'UNREALISTIC_COMPENSATION',
  name: 'Unrealistic Compensation Claims Rule',

  evaluate: (input) => {
    const indicators = [];
    const fieldsToInspect = [
      { name: 'salary', text: input.salary.display },
      { name: 'jobDescription', text: input.jobDescription },
      { name: 'jobTitle', text: input.jobTitle }
    ];

    let detectedMatch = null;
    let detectedField = '';

    for (const field of fieldsToInspect) {
      if (!field.text) continue;
      const matches = findMatchesWithContext(field.text, UNREALISTIC_PAY_PATTERNS, 50);
      if (matches.length > 0) {
        detectedMatch = matches[0];
        detectedField = field.name;
        break;
      }
    }

    // Check if low skill role has exorbitant stated compensation
    const titleAndDesc = `${input.jobTitle} ${input.jobDescription}`.toLowerCase();
    const isLowSkillRole = LOW_SKILL_KEYWORDS.some((kw) => titleAndDesc.includes(kw));

    if (detectedMatch) {
      indicators.push({
        id: 'UNREALISTIC_COMPENSATION',
        type: INDICATOR_TYPES.UNREALISTIC_COMPENSATION,
        severity: SEVERITY.HIGH,
        title: 'Unrealistic or Disproportionate Compensation Claim',
        explanation:
          'Promising exaggerated daily earnings or guaranteed instant payouts for minimal hours of low-skill work is a recognized tactic used to bait candidates into advance-fee or task scams.',
        evidence: {
          source: `user_input.${detectedField}`,
          field: detectedField,
          matchedText: detectedMatch.snippet,
          detectedPhrases: [detectedMatch.matchedPhrase],
          context: isLowSkillRole ? 'Stated role is a simple/entry task with disproportionate pay' : 'Compensation significantly exceeds labor market norms'
        }
      });
    }

    return { indicators };
  }
};
