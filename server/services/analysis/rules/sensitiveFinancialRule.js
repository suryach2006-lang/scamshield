/**
 * Rule: Sensitive Financial & Credential Solicitation
 * Flags requests for bank passwords, OTPs, UPI PINs, CVVs,
 * signed blank cheques, or remote desktop access.
 */

const { SEVERITY, INDICATOR_TYPES } = require('../constants');
const { findMatchesWithContext } = require('../textMatcher');

const SENSITIVE_FINANCIAL_PATTERNS = [
  { pattern: /\b(?:bank\s+account\s+|net\s*banking\s+|internet\s*banking\s+)?password(?:s)?\b/gi, label: 'banking password request' },
  { pattern: /\b(?:atm|upi|card|debit\s+card|credit\s+card)\s+pin\b/gi, label: 'PIN code request' },
  { pattern: /\bcvv(?:\s+code|\s+number)?\b/gi, label: 'CVV request' },
  { pattern: /\b(?:share|send|provide|tell)\s+(?:the\s+)?(?:otp|one[\s-]?time\s+password|verification\s+code)\b/gi, label: 'OTP solicitation' },
  { pattern: /\b(?:signed\s+)?blank\s+cheque(?:s)?\b/gi, label: 'blank cheque request' },
  { pattern: /\b(?:install|download)\s+(?:anydesk|teamviewer|rustdesk|quicksupport)\b/gi, label: 'remote desktop access tool' },
  { pattern: /\bcredit\s+card\s+(?:limit|statement|front\s+and\s+back)\b/gi, label: 'credit card data request' }
];

module.exports = {
  id: 'SENSITIVE_FINANCIAL_INFO',
  name: 'Sensitive Financial Information Solicitation Rule',

  evaluate: (input) => {
    const indicators = [];
    const fieldsToInspect = [
      { name: 'jobDescription', text: input.jobDescription },
      { name: 'recruiterContact', text: input.recruiterContact.raw }
    ];

    for (const field of fieldsToInspect) {
      if (!field.text) continue;

      const matches = findMatchesWithContext(field.text, SENSITIVE_FINANCIAL_PATTERNS, 50);

      if (matches.length > 0) {
        const primaryMatch = matches[0];
        const uniquePhrases = [...new Set(matches.map((m) => m.matchedPhrase))].slice(0, 3);

        indicators.push({
          id: 'SENSITIVE_FINANCIAL_INFO',
          type: INDICATOR_TYPES.SENSITIVE_DATA_SOLICITATION,
          severity: SEVERITY.CRITICAL,
          title: 'Request for Sensitive Financial Credentials or Remote Control',
          explanation:
            'Employers never request bank passwords, UPI PINs, CVV codes, SMS OTPs, signed blank cheques, or remote screen-sharing tools (AnyDesk/TeamViewer) during recruitment.',
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
