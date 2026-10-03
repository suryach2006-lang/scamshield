/**
 * Rule: Upfront Payment & Registration Fee Solicitation
 * Flags demands for upfront payments, application fees, training fees,
 * security deposits, or kit charges.
 */

const { SEVERITY, INDICATOR_TYPES } = require('../constants');
const { findMatchesWithContext } = require('../textMatcher');

const UPFRONT_PAYMENT_PATTERNS = [
  { pattern: /\b(?:registration|registering)\s+fee(?:s)?\b/gi, label: 'registration fee' },
  { pattern: /\b(?:application|processing)\s+fee(?:s)?\b/gi, label: 'application/processing fee' },
  { pattern: /\b(?:refundable\s+)?security\s+deposit\b/gi, label: 'security deposit' },
  { pattern: /\b(?:training|certification)\s+(?:fee|cost|charge|charges|amount)\b/gi, label: 'training fee' },
  { pattern: /\b(?:laptop|equipment|tool|kit|uniform|id\s+card|badge)\s+(?:deposit|fee|charge|cost)\b/gi, label: 'equipment/kit fee' },
  { pattern: /\b(?:courier|shipping|delivery)\s+(?:fee|charge|cost)\s+(?:for\s+kit|for\s+laptop|to\s+receive)\b/gi, label: 'delivery fee for kit' },
  { pattern: /\b(?:interview|examination|exam|slot\s+booking)\s+fee(?:s)?\b/gi, label: 'interview or exam fee' },
  { pattern: /\bpay\s+(?:rs\.?|inr|₹|\$|usd|eur|£)\s*\d+/gi, label: 'direct payment request' },
  { pattern: /\b(?:deposit|transfer|send)\s+(?:rs\.?|inr|₹|\$)\s*\d+\s+(?:for|to|before)\b/gi, label: 'transfer money before joining' },
  { pattern: /\bnominal\s+(?:fee|charge|deposit)\s+(?:of\s+rs|of\s+₹|of\s+\$|\d+)\b/gi, label: 'nominal fee request' }
];

module.exports = {
  id: 'UPFRONT_PAYMENT_FEE',
  name: 'Upfront Payment & Registration Fee Rule',

  evaluate: (input) => {
    const indicators = [];
    const fieldsToInspect = [
      { name: 'jobDescription', text: input.jobDescription },
      { name: 'recruiterContact', text: input.recruiterContact.raw },
      { name: 'salary', text: input.salary.raw }
    ];

    for (const field of fieldsToInspect) {
      if (!field.text) continue;

      const matches = findMatchesWithContext(field.text, UPFRONT_PAYMENT_PATTERNS, 50);

      if (matches.length > 0) {
        // Pick primary match and unique phrases
        const primaryMatch = matches[0];
        const uniquePhrases = [...new Set(matches.map((m) => m.matchedPhrase))].slice(0, 3);

        indicators.push({
          id: 'UPFRONT_PAYMENT_FEE',
          type: INDICATOR_TYPES.FINANCIAL_SOLICITATION,
          severity: SEVERITY.CRITICAL,
          title: 'Upfront Fee or Security Deposit Demanded',
          explanation:
            'Legitimate employers and established recruitment agencies do not ask applicants to pay registration fees, application charges, training costs, or equipment security deposits.',
          evidence: {
            source: `user_input.${field.name}`,
            field: field.name,
            matchedText: primaryMatch.snippet,
            detectedPhrases: uniquePhrases
          }
        });

        // Avoid duplicate indicators for the same rule across multiple fields
        break;
      }
    }

    return { indicators };
  }
};
