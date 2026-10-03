/**
 * Rule: Suspicious URL & Redirection Structures
 * Flags shortened URLs, direct chat links, and abnormal application endpoints.
 */

const { SEVERITY, INDICATOR_TYPES, URL_SHORTENERS, CHAT_REDIRECT_DOMAINS } = require('../constants');

module.exports = {
  id: 'SUSPICIOUS_URL_STRUCTURE',
  name: 'Job Application URL Rule',

  evaluate: (input) => {
    const indicators = [];
    const missingSignals = [];

    if (!input.jobUrl) {
      missingSignals.push({
        signal: 'NO_APPLICATION_URL',
        category: 'APPLICATION_PORTAL',
        description: 'No verified application URL or career portal link was provided.',
        importance: 'MEDIUM'
      });
      return { indicators, missingSignals };
    }

    const { valid, hostname, domain } = input.urlDetails;

    if (!valid) {
      indicators.push({
        id: 'MALFORMED_JOB_URL',
        type: INDICATOR_TYPES.SUSPICIOUS_URL_STRUCTURE,
        severity: SEVERITY.LOW,
        title: 'Malformed or Unresolvable Job Link Provided',
        explanation: 'The provided job application URL could not be parsed as a standard web address.',
        evidence: {
          source: 'user_input.jobUrl',
          providedUrl: input.jobUrl
        }
      });
      return { indicators, missingSignals };
    }

    // Check if URL shortener is used
    if (URL_SHORTENERS.has(domain) || URL_SHORTENERS.has(hostname)) {
      indicators.push({
        id: 'URL_SHORTENER_MASKING',
        type: INDICATOR_TYPES.SUSPICIOUS_URL_STRUCTURE,
        severity: SEVERITY.MEDIUM,
        title: 'URL Shortener Used to Conceal Job Destination',
        explanation:
          `The job application link uses a link shortener service (${hostname}) which obscures the authentic host and destination of the opening.`,
        evidence: {
          source: 'user_input.jobUrl',
          jobUrl: input.jobUrl,
          shortenerService: hostname
        }
      });
    }

    // Check if primary application URL directs straight into Telegram or WhatsApp
    if (CHAT_REDIRECT_DOMAINS.has(domain) || CHAT_REDIRECT_DOMAINS.has(hostname)) {
      indicators.push({
        id: 'DIRECT_CHAT_APPLICATION_URL',
        type: INDICATOR_TYPES.COMMUNICATION_CHANNEL,
        severity: SEVERITY.HIGH,
        title: 'Application URL Redirects Directly to Chat Channel',
        explanation:
          'The primary application URL routes candidates straight into a messaging application instead of a formal web applicant tracking system (ATS) or corporate portal.',
        evidence: {
          source: 'user_input.jobUrl',
          jobUrl: input.jobUrl,
          messagingPlatform: hostname
        }
      });
    }

    return { indicators, missingSignals };
  }
};
