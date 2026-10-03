/**
 * Rule: Task-Based & Click Fraud Scam Signals
 * Flags common modern task-fraud schemes such as liking YouTube videos,
 * rating Google maps/hotels, or app reviews for daily payments.
 */

const { SEVERITY, INDICATOR_TYPES } = require('../constants');
const { findMatchesWithContext } = require('../textMatcher');

const TASK_SCAM_PATTERNS = [
  { pattern: /\b(?:like|subscribe|watch)\s+(?:to\s+)?(?:youtube\s+videos?|channels?|videos?)\s+(?:and\s+earn|for\s+money|for\s+cash)\b/gi, label: 'like YouTube video tasks' },
  { pattern: /\b(?:rate|review)\s+(?:hotels?|restaurants?|google\s+maps?|travel\s+sites?)\s+(?:and\s+get\s+paid|for\s+commission|to\s+earn)\b/gi, label: 'rating/review tasks for money' },
  { pattern: /\b(?:like\s+and\s+send\s+screenshot|screenshot\s+proof\s+for\s+payment)\b/gi, label: 'screenshot proof tasks' },
  { pattern: /\b(?:merchant|e-commerce|shopping)\s+(?:order\s+brushing|rating\s+task|product\s+rating\s+job)\b/gi, label: 'brushing / rating tasks' },
  { pattern: /\b(?:crypto|usdt)\s+(?:recharge|task|trading\s+job|investment\s+task)\b/gi, label: 'crypto task scheme' }
];

module.exports = {
  id: 'TASK_BASED_SCAM_PATTERN',
  name: 'Task & Click Fraud Pattern Rule',

  evaluate: (input) => {
    const indicators = [];
    const fieldsToInspect = [
      { name: 'jobDescription', text: input.jobDescription },
      { name: 'jobTitle', text: input.jobTitle }
    ];

    for (const field of fieldsToInspect) {
      if (!field.text) continue;

      const matches = findMatchesWithContext(field.text, TASK_SCAM_PATTERNS, 50);

      if (matches.length > 0) {
        const primaryMatch = matches[0];
        const uniquePhrases = [...new Set(matches.map((m) => m.matchedPhrase))].slice(0, 3);

        indicators.push({
          id: 'TASK_BASED_SCAM_PATTERN',
          type: INDICATOR_TYPES.TASK_BASED_SCAM_PATTERN,
          severity: SEVERITY.HIGH,
          title: 'Task-Based Manipulation or Click-Fraud Work Pattern',
          explanation:
            'Positions offering compensation for liking YouTube videos, rating Google Maps locations, or submitting screenshots are typical of advance-fee task scams, where participants are eventually trapped into depositing money to withdraw fake earnings.',
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
