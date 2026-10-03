/**
 * Rule: Suspicious Recruitment Contact Channels
 * Flags recruitment relying solely on anonymous chat apps (Telegram, WhatsApp)
 * or public webmail (Gmail, Yahoo) for corporate/commercial positions.
 */

const { SEVERITY, INDICATOR_TYPES, PUBLIC_EMAIL_DOMAINS } = require('../constants');
const { findMatchesWithContext } = require('../textMatcher');

const CHAT_ONLY_RECRUITMENT_PATTERNS = [
  { pattern: /\b(?:contact|message|reach|apply|chat\s+with)\s+(?:hr|recruiter|us|manager)\s+(?:via|on|through)\s+telegram\b/gi, label: 'contact on Telegram' },
  { pattern: /\b(?:telegram|tg)\s*(?::|handle|username|id)?\s*@?[a-zA-Z0-9_]{5,}\b/gi, label: 'Telegram handle recruitment' },
  { pattern: /\b(?:whatsapp|wa)\s*(?:only|message\s+only|chat\s+only)\b/gi, label: 'WhatsApp only instruction' },
  { pattern: /\bno\s+(?:calls?|interviews?|emails?)[,\s]+only\s+(?:whatsapp|telegram)\b/gi, label: 'exclusive messaging instruction' },
  { pattern: /\bt\.me\/[a-zA-Z0-9_]{4,}\b/gi, label: 'Telegram link' }
];

module.exports = {
  id: 'SUSPICIOUS_CONTACT_CHANNEL',
  name: 'Suspicious Contact Channel Rule',

  evaluate: (input) => {
    const indicators = [];
    const missingSignals = [];

    const fullContactText = `${input.recruiterContact.raw} ${input.jobDescription}`;

    // 1. Check for chat-only / Telegram-first recruitment
    const chatMatches = findMatchesWithContext(fullContactText, CHAT_ONLY_RECRUITMENT_PATTERNS, 40);
    const hasTelegramHandles = input.recruiterContact.telegramHandles.length > 0;
    const hasWhatsAppLinks = input.recruiterContact.whatsappContacts.length > 0;

    if (chatMatches.length > 0 || hasTelegramHandles) {
      const primary = chatMatches[0] || { snippet: `Telegram contact: @${input.recruiterContact.telegramHandles[0]}`, matchedPhrase: 'Telegram handle' };

      indicators.push({
        id: 'ANONYMOUS_MESSAGING_CHANNEL',
        type: INDICATOR_TYPES.COMMUNICATION_CHANNEL,
        severity: SEVERITY.HIGH,
        title: 'Recruitment Directed to Anonymous Messaging (Telegram/WhatsApp)',
        explanation:
          'Conducting job interviews and hiring exclusively through anonymous messaging platforms like Telegram or WhatsApp bypasses enterprise identity verification and is a prevalent vehicle for employment fraud.',
        evidence: {
          source: 'user_input.recruiterContact',
          matchedText: primary.snippet,
          detectedHandles: input.recruiterContact.telegramHandles
        }
      });
    }

    // 2. Check for public webmail when claiming to be a company
    const emailDetails = input.recruiterContact.emailDetails;
    const publicWebmailEmails = emailDetails.filter((e) => e.isPublicWebmail);

    if (publicWebmailEmails.length > 0 && input.companyName) {
      const emailList = publicWebmailEmails.map((e) => e.email);
      indicators.push({
        id: 'PUBLIC_WEBMAIL_RECRUITER',
        type: INDICATOR_TYPES.COMMUNICATION_CHANNEL,
        severity: SEVERITY.MEDIUM,
        title: 'Recruiter Uses Free Public Webmail Domain',
        explanation:
          `The recruiter contact uses a free public email provider (${publicWebmailEmails[0].domain}) rather than an authenticated corporate domain belonging to "${input.companyName}".`,
        evidence: {
          source: 'user_input.recruiterContact',
          recruiterEmail: emailList[0],
          claimedCompany: input.companyName,
          publicDomain: publicWebmailEmails[0].domain
        }
      });
    }

    // 3. Missing verification signal if NO corporate email is provided at all
    const corporateEmails = emailDetails.filter((e) => !e.isPublicWebmail);
    if (corporateEmails.length === 0 && input.companyName) {
      missingSignals.push({
        signal: 'NO_VERIFIABLE_CORPORATE_EMAIL',
        category: 'COMMUNICATION_AUTHENTICITY',
        description: `No corporate email domain matching "${input.companyName}" was found in the listing or contact info.`,
        importance: 'HIGH'
      });
    }

    return { indicators, missingSignals };
  }
};
