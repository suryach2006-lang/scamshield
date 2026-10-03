/**
 * Rule: Missing Verification Signals Rule
 * Identifies gaps where legitimate employment listings typically provide verifiable
 * employer credentials, legal registration, or formal job terms.
 */

const { SEVERITY, INDICATOR_TYPES } = require('../constants');

const GENERIC_COMPANY_TERMS = [
  'reputed mnc',
  'leading mnc',
  'top mnc',
  'confidential client',
  'confidential company',
  'top client',
  'leading company',
  'reputed it firm',
  'urgent requirement client',
  'direct company',
  'hiring client',
  'private company'
];

module.exports = {
  id: 'MISSING_VERIFICATION_SIGNALS',
  name: 'Verification Completeness Rule',

  evaluate: (input) => {
    const indicators = [];
    const missingSignals = [];

    // 1. Evaluate Company Name presence and specificity
    if (!input.companyName) {
      missingSignals.push({
        signal: 'MISSING_EMPLOYER_NAME',
        category: 'COMPANY_VERIFICATION',
        description: 'No company or organization name was provided, preventing official business verification.',
        importance: 'HIGH'
      });
    } else {
      const lowerCompany = input.companyName.toLowerCase();
      const isGeneric = GENERIC_COMPANY_TERMS.some((term) => lowerCompany === term || lowerCompany.includes(term));

      if (isGeneric) {
        indicators.push({
          id: 'GENERIC_EMPLOYER_NAME',
          type: INDICATOR_TYPES.IDENTITY_VERIFICATION,
          severity: SEVERITY.MEDIUM,
          title: 'Generic or Masked Employer Identity',
          explanation:
            `The company name "${input.companyName}" is generic and conceals the authentic legal entity responsible for hiring.`,
          evidence: {
            source: 'user_input.companyName',
            companyName: input.companyName
          }
        });

        missingSignals.push({
          signal: 'UNIDENTIFIED_LEGAL_ENTITY',
          category: 'COMPANY_VERIFICATION',
          description: 'The stated employer name is a generic placeholder rather than a registered legal entity.',
          importance: 'HIGH'
        });
      }
    }

    // 2. Evaluate Recruiter / Point of Contact Information
    const hasEmail = input.recruiterContact.emails.length > 0;
    const hasPhone = input.recruiterContact.phones.length > 0;
    const hasTelegram = input.recruiterContact.telegramHandles.length > 0;

    if (!hasEmail && !hasPhone && !hasTelegram && !input.recruiterContact.raw) {
      missingSignals.push({
        signal: 'NO_DIRECT_CONTACT_PERSON',
        category: 'RECRUITER_VERIFICATION',
        description: 'No verified contact person, corporate email, or recruiter identifier was provided.',
        importance: 'MEDIUM'
      });
    }

    // 3. Location specificity
    if (!input.location) {
      missingSignals.push({
        signal: 'UNSPECIFIED_OFFICE_LOCATION',
        category: 'PHYSICAL_VERIFICATION',
        description: 'Listing lacks any physical office location, regional hub, or registered jurisdiction.',
        importance: 'LOW'
      });
    }

    // 4. Job description depth
    if (!input.jobDescription || input.jobDescription.length < 50) {
      missingSignals.push({
        signal: 'SPARSE_ROLE_DESCRIPTION',
        category: 'JOB_SPECIFICATION',
        description: 'Job description is extremely brief or lacks detailed responsibilities, skills, and qualifications.',
        importance: 'LOW'
      });
    }

    return { indicators, missingSignals };
  }
};
