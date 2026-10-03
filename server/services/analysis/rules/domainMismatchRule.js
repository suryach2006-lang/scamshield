/**
 * Rule: Domain & Entity Identity Mismatch Rule
 * Flags discrepancies between the claimed company brand and the
 * contact email domain or application URL hostname.
 */

const { SEVERITY, INDICATOR_TYPES, SUSPICIOUS_TLDS, PUBLIC_EMAIL_DOMAINS } = require('../constants');

/**
 * Normalizes a company name into core alphanumeric tokens.
 * e.g. "Google LLC" -> ["google"]
 * "Tata Consultancy Services" -> ["tata", "consultancy", "services", "tcs"]
 */
const getCompanyTokens = (companyName) => {
  if (!companyName) return [];
  const clean = companyName
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => !['inc', 'llc', 'ltd', 'limited', 'pvt', 'corp', 'corporation', 'co', 'group', 'the', 'and', '&'].includes(w));
  return clean;
};

module.exports = {
  id: 'DOMAIN_MISMATCH',
  name: 'Domain and Identity Mismatch Rule',

  evaluate: (input) => {
    const indicators = [];
    const missingSignals = [];

    const company = input.companyName;
    if (!company) {
      return { indicators, missingSignals };
    }

    const companyTokens = getCompanyTokens(company);
    const nonPublicEmails = input.recruiterContact.emailDetails.filter((e) => !e.isPublicWebmail);

    // 1. Evaluate contact email domains against company identity
    for (const emailObj of nonPublicEmails) {
      const emailDomain = emailObj.domain.toLowerCase();
      const domainBase = emailDomain.split('.')[0];

      // Check if domain shares any company token
      const hasMatch = companyTokens.some((token) => domainBase.includes(token) || token.includes(domainBase));

      if (!hasMatch && companyTokens.length > 0) {
        indicators.push({
          id: 'CONTACT_DOMAIN_MISMATCH',
          type: INDICATOR_TYPES.DOMAIN_MISMATCH,
          severity: SEVERITY.HIGH,
          title: 'Recruiter Domain Does Not Match Claimed Employer',
          explanation:
            `The recruiter email domain ("${emailDomain}") has no apparent relationship to the stated employer "${company}". Fraudulent listings frequently use third-party domains to impersonate reputable firms.`,
          evidence: {
            source: 'user_input.recruiterContact',
            recruiterEmail: emailObj.email,
            emailDomain,
            claimedCompany: company
          }
        });
      }
    }

    // 2. Evaluate jobUrl domain vs claimed company & check suspicious TLDs
    if (input.urlDetails.valid) {
      const urlHostname = input.urlDetails.hostname;
      const urlTld = input.urlDetails.tld;
      const urlDomainBase = input.urlDetails.domain.split('.')[0];

      // If suspicious TLD is used
      if (SUSPICIOUS_TLDS.has(urlTld)) {
        indicators.push({
          id: 'SUSPICIOUS_TLD_PORTAL',
          type: INDICATOR_TYPES.SUSPICIOUS_URL_STRUCTURE,
          severity: SEVERITY.HIGH,
          title: 'Suspicious Top-Level Domain (TLD) Used for Application',
          explanation:
            `The job application link uses a high-risk TLD (".${urlTld}"), which is disproportionately associated with temporary or phishing infrastructure rather than legitimate corporate career portals.`,
          evidence: {
            source: 'user_input.jobUrl',
            jobUrl: input.jobUrl,
            hostname: urlHostname,
            tld: `.${urlTld}`
          }
        });
      }

      // Check if domain looks like a typosquat or brand-hyphenation combo
      // e.g. "company-careers-login.xyz" or "amazon-verify.top"
      const matchesBrandWithHyphens = companyTokens.some(
        (t) => t.length >= 4 && urlHostname.includes(t) && (urlHostname.includes('-careers') || urlHostname.includes('-jobs') || urlHostname.includes('-portal') || urlHostname.includes('-hr'))
      );

      if (matchesBrandWithHyphens && SUSPICIOUS_TLDS.has(urlTld)) {
        indicators.push({
          id: 'BRAND_IMPERSONATION_URL',
          type: INDICATOR_TYPES.DOMAIN_MISMATCH,
          severity: SEVERITY.HIGH,
          title: 'Potential Brand Impersonation Domain Structure',
          explanation:
            `The domain "${urlHostname}" appears to combine the company's brand name with generic career terms on a low-reputation TLD, a frequent pattern in credential harvesting and fake offer scams.`,
          evidence: {
            source: 'user_input.jobUrl',
            hostname: urlHostname,
            claimedCompany: company
          }
        });
      }
    }

    return { indicators, missingSignals };
  }
};
