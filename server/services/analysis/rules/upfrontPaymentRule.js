/**
 * Rule: Upfront Payment & Registration Fee Solicitation
 * Flags demands for upfront payments, application fees, training fees,
 * security deposits, or kit charges.
 *
 * Distinguishes genuine payment demands from explicit denials (e.g.,
 * "No application fee is required") and benign non-demand fee mentions.
 */

const { SEVERITY, INDICATOR_TYPES } = require('../constants');

const UPFRONT_PAYMENT_PATTERNS = [
  { pattern: /\b(?:registration|registering)\s+fee(?:s)?\b/gi, label: 'registration fee' },
  { pattern: /\b(?:application|processing)\s+fee(?:s)?\b/gi, label: 'application/processing fee' },
  { pattern: /\b(?:refundable\s+)?security\s+deposit\b/gi, label: 'security deposit' },
  { pattern: /\b(?:training|certification)\s+(?:fee|cost|charge|charges|amount)\b/gi, label: 'training fee' },
  { pattern: /\b(?:laptop|equipment|tool|kit|uniform|id\s+card|badge)\s+(?:deposit|fee|charge|cost)\b/gi, label: 'equipment/kit fee' },
  { pattern: /\b(?:courier|shipping|delivery)\s+(?:fee|charge|cost)\s+(?:for\s+kit|for\s+laptop|to\s+receive)\b/gi, label: 'delivery fee for kit', isInherentlyDemand: true },
  { pattern: /\b(?:interview|examination|exam|slot\s+booking)\s+fee(?:s)?\b/gi, label: 'interview or exam fee' },
  { pattern: /\bpay\s+(?:rs\.?|inr|₹|\$|usd|eur|£)\s*\d+/gi, label: 'direct payment request', isInherentlyDemand: true },
  { pattern: /\b(?:deposit|transfer|send)\s+(?:rs\.?|inr|₹|\$)\s*\d+\s+(?:for|to|before)\b/gi, label: 'transfer money before joining', isInherentlyDemand: true },
  { pattern: /\bnominal\s+(?:fee|charge|deposit)\s+(?:of\s+rs|of\s+₹|of\s+\$|\d+)\b/gi, label: 'nominal fee request', isInherentlyDemand: true }
];

// Patterns that identify explicit denials / negations of fees within a clause
const EXPLICIT_DENIAL_PATTERNS = [
  /\bno\s+(?:application|registration|registering|processing|recruitment|upfront|hidden|interview|exam|slot|training|kit|laptop|equipment|further|additional|other)?\s*(?:fee|fees|deposit|deposits|charge|charges|cost|costs|amount|money|payment|payments)\b/i,
  /\b(?:fee|fees|charges?|deposits?|payments?)\s+(?:is|are|will\s+be)?\s*(?:not|never|neither)\s+(?:required|charged|collected|asked|solicited|needed|taken|demanded|applicable)\b/i,
  /\b(?:do|does|did|will|shall|would|can|could|may|might)\s+not\s+(?:charge|ask|demand|require|collect|take|solicit|request|accept)\b/i,
  /\b(?:never|not)\s+(?:charges?|asks?|demands?|requires?|collects?|takes?|solicits?|requests?|accepts?)\s+(?:for|to\s+pay|any)?\b/i,
  /\b(?:never|not|do\s+not|does\s+not|will\s+not)\s+(?:ask|require|demand)\s+(?:candidates|applicants|anyone|you|them|job\s*seekers)?\s*(?:for|to\s+pay|to\s+deposit|to\s+transfer|any)\b/i,
  /\bneither\s+[\w\s,]+\s+nor\s+[\w\s,]+\s+(?:charges?|asks?|requires?|collects?|demands?)\b/i,
  /\bnot\s+(?:authorized|permitted)\s+to\s+(?:collect|charge|ask|demand|receive)\b/i,
  /\bwithout\s+(?:paying\s+)?(?:any\s+)?(?:fee|fees|charge|charges|cost|costs|payment|deposit)\b/i,
  /\bfree\s+of\s+(?:charge|cost|fees?)\b/i,
  /\bat\s+no\s+(?:cost|charge|fee)\b/i,
  /\b(?:100%|completely|totally|entirely)?\s*free\s+(?:recruitment|application|hiring|process)\b/i,
  /\bzero\s+(?:application|registration)?\s*(?:fee|fees|charges?|cost)\b/i,
  /\b(?:not|never)\s+required\s+to\s+(?:pay|deposit|transfer|send|submit)\b/i
];

// Patterns that confirm a payment demand or obligation in a non-negated clause
const DEMAND_INDICATOR_PATTERNS = [
  /\b(?:must|shall|have\s+to|has\s+to|need\s+to|required\s+to)\s+(?:pay|deposit|transfer|send|submit|wire|remit|provide)\b/i,
  /\b(?:pay|deposit|transfer|send|submit|remit)\s+(?:a|an|the|this|any)?\s*(?:registration|application|processing|security|training|laptop|equipment|kit|interview|slot|courier)?\s*(?:fee|deposit|charge|charges|cost)/i,
  /\b(?:candidates?|applicants?|new\s+hires?|selected\s+candidates?)\s+(?:must|shall|need\s+to|have\s+to|has\s+to|are\s+required\s+to)\s+(?:pay|deposit|transfer|send|submit|bear)/i,
  /\bpay(?:ment)?\s+(?:is\s+)?(?:mandatory|compulsory|required)\b/i,
  /\b(?:mandatory|compulsory|required|payable|applicable|to\s+be\s+paid)\b/i,
  /\b(?:refundable|non[\s-]?refundable)\s+(?:registration|application|security|laptop|training|kit)?\s*(?:deposit|fee|charge)/i,
  /\bnominal\s+(?:registration|application|security)?\s*(?:deposit|fee|charge)/i,
  /(?:rs\.?|inr|₹|\$|usd|eur|£)\s*\d+/i,
  /\b\d+\s*(?:rs|inr|rupees|dollars|bucks)\b/i,
  /\b(?:fee|deposit|charge|charges|cost)\s*(?:of|is|:)\s*(?:rs\.?|inr|₹|\$)?\s*\d+/i,
  /\b(?:prior\s+to|before)\s+(?:the\s+)?(?:first\s+day|offer|onboarding|dispatch|joining|starting|interview|receiving)/i,
  /\b(?:before|to)\s+receive\s+(?:the\s+)?(?:offer|kit|laptop|letter)/i,
  /\b(?:for|to\s+receive|to\s+dispatch)\s+(?:the\s+)?(?:typing\s+software|software\s+kit|onboarding\s+kit|kit|laptop)\b/i
];

/**
 * Splits text into clauses separated by sentence terminators or contrastive transitions.
 * Does not split on list commas (e.g., "fee, deposit, or charge").
 *
 * @param {string} text
 * @returns {Array<{ text: string, start: number, end: number }>}
 */
const splitIntoClauses = (text) => {
  if (!text || typeof text !== 'string') return [];

  const clauses = [];
  const delimiterRegex = /(?:[.!?]+(?:\s+|\r?\n+|$)|[\r\n]+|;+|,\s*(?:but|however|yet|nevertheless|nonetheless|although|though|except\s+that)\b|\b(?:but|however|yet|nevertheless|nonetheless|although|though|except\s+that)\b)/gi;

  let lastIndex = 0;
  let match;

  while ((match = delimiterRegex.exec(text)) !== null) {
    const clauseText = text.slice(lastIndex, match.index).trim();
    if (clauseText.length > 0) {
      clauses.push({
        text: clauseText,
        start: lastIndex,
        end: match.index
      });
    }
    lastIndex = delimiterRegex.lastIndex;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining.length > 0) {
    clauses.push({
      text: remaining,
      start: lastIndex,
      end: text.length
    });
  }

  return clauses;
};

/**
 * Checks if a clause contains an explicit denial/negation of fees.
 * @param {string} clauseText
 * @returns {boolean}
 */
const isExplicitDenial = (clauseText) => {
  return EXPLICIT_DENIAL_PATTERNS.some((pat) => pat.test(clauseText));
};

/**
 * Checks if a clause supports an actual payment demand.
 * @param {string} clauseText
 * @param {boolean} isInherentlyDemand
 * @returns {boolean}
 */
const isPaymentDemand = (clauseText, isInherentlyDemand) => {
  if (isInherentlyDemand) return true;
  return DEMAND_INDICATOR_PATTERNS.some((pat) => pat.test(clauseText));
};

module.exports = {
  id: 'UPFRONT_PAYMENT_FEE',
  name: 'Upfront Payment & Registration Fee Rule',

  evaluate: (input) => {
    const indicators = [];
    const fieldsToInspect = [
      { name: 'jobDescription', text: input.jobDescription },
      { name: 'recruiterContact', text: input.recruiterContact ? input.recruiterContact.raw : '' },
      { name: 'salary', text: input.salary ? input.salary.raw : '' }
    ];

    for (const field of fieldsToInspect) {
      if (!field.text) continue;

      const clauses = splitIntoClauses(field.text);
      const verifiedMatches = [];

      for (const clause of clauses) {
        // Skip clauses that explicitly deny or negate upfront fees
        if (isExplicitDenial(clause.text)) {
          continue;
        }

        // Search for upfront payment patterns in this non-negated clause
        for (const item of UPFRONT_PAYMENT_PATTERNS) {
          const regex = item.pattern;
          regex.lastIndex = 0;
          let match;

          while ((match = regex.exec(clause.text)) !== null) {
            // Verify this clause actually supports a payment demand
            if (isPaymentDemand(clause.text, item.isInherentlyDemand)) {
              const absIndex = field.text.indexOf(match[0], clause.start);
              const snippetStart = Math.max(0, absIndex - 40);
              const snippetEnd = Math.min(field.text.length, absIndex + match[0].length + 40);
              const prefix = snippetStart > 0 ? '...' : '';
              const suffix = snippetEnd < field.text.length ? '...' : '';
              const snippet = `${prefix}${field.text.slice(snippetStart, snippetEnd).trim()}${suffix}`;

              verifiedMatches.push({
                matchedPhrase: match[0],
                snippet,
                label: item.label
              });
            }

            if (!regex.global) break;
          }
        }
      }

      if (verifiedMatches.length > 0) {
        // Pick primary match and unique phrases
        const primaryMatch = verifiedMatches[0];
        const uniquePhrases = [...new Set(verifiedMatches.map((m) => m.matchedPhrase))].slice(0, 3);

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

