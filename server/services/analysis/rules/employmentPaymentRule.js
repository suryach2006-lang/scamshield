/**
 * Rule: Money Demanded to Obtain Employment or Unlock Work
 * Flags requests requiring applicants to invest funds, recharge wallets,
 * or pay to receive offer letters / work assignments.
 */

const { SEVERITY, INDICATOR_TYPES } = require('../constants');
const { findMatchesWithContext } = require('../textMatcher');

const EMPLOYMENT_PAYMENT_PATTERNS = [
  { pattern: /\b(?:pay|deposit)\s+(?:money\s+)?(?:to\s+start|before\s+starting|to\s+begin|to\s+unlock)\s+(?:the\s+)?(?:work|job|tasks?)\b/gi, label: 'pay to start or unlock work' },
  { pattern: /\b(?:initial|small|minimum)\s+investment\s+(?:required|needed|of)\b/gi, label: 'investment required for job' },
  { pattern: /\b(?:recharge|top[\s-]?up|deposit\s+funds\s+into)\s+(?:your\s+)?(?:account|wallet|balance)\s+(?:to\s+unlock|to\s+receive|to\s+start)\b/gi, label: 'wallet recharge to unlock tasks' },
  { pattern: /\b(?:pay|deposit|transfer|fee|charge)\b[^.]{0,50}\b(?:to\s+unlock|before\s+unlocking)\s+(?:the\s+)?(?:job|work|tasks?|assignments?)\b/gi, label: 'pay to unlock job' },
  { pattern: /\bto\s+unlock\s+(?:the\s+)?(?:job|work|tasks?|assignments?)\b/gi, label: 'unlock job requirement' },
  { pattern: /\bprepaid\s+task(?:s)?\b/gi, label: 'prepaid task requirement' },
  { pattern: /\b(?:pay|transfer|deposit)\s+(?:amount|fee|money)\s+(?:to\s+get|to\s+release|for\s+the)\s+(?:offer\s+letter|appointment\s+letter|contract)\b/gi, label: 'payment for offer letter' },
  { pattern: /\bearn\s+(?:high\s+)?commission\s+(?:by|after|upon)\s+(?:depositing|investing|recharging)\b/gi, label: 'commission upon deposit' }
];

module.exports = {
  id: 'EMPLOYMENT_PAYMENT_REQUIRED',
  name: 'Employment Payment Requirement Rule',

  evaluate: (input) => {
    const indicators = [];
    const fieldsToInspect = [
      { name: 'jobDescription', text: input.jobDescription },
      { name: 'recruiterContact', text: input.recruiterContact.raw }
    ];

    for (const field of fieldsToInspect) {
      if (!field.text) continue;

      const matches = findMatchesWithContext(field.text, EMPLOYMENT_PAYMENT_PATTERNS, 50);

      if (matches.length > 0) {
        const primaryMatch = matches[0];
        const uniquePhrases = [...new Set(matches.map((m) => m.matchedPhrase))].slice(0, 3);

        indicators.push({
          id: 'EMPLOYMENT_PAYMENT_REQUIRED',
          type: INDICATOR_TYPES.EMPLOYMENT_PAYMENT_REQUIRED,
          severity: SEVERITY.CRITICAL,
          title: 'Payment or Investment Required to Obtain Work',
          explanation:
            'Demanding candidates invest money, recharge an app wallet, or pay to release an appointment letter is characteristic of advance-fee and task-deposit employment schemes.',
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
