/**
 * Unit Tests for ScamShield Analysis Rules & Normalizer
 * Uses Node.js native test runner (node:test) and assertions (node:assert).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { normalizeInput } = require('../services/analysis/normalizer');
const { defaultEngine, RuleEngine } = require('../services/analysis/ruleEngine');
const { analyzeJobListing } = require('../services/analysis');
const upfrontPaymentRule = require('../services/analysis/rules/upfrontPaymentRule');
const employmentPaymentRule = require('../services/analysis/rules/employmentPaymentRule');
const sensitiveFinancialRule = require('../services/analysis/rules/sensitiveFinancialRule');
const unrealisticCompensationRule = require('../services/analysis/rules/unrealisticCompensationRule');
const contactChannelRule = require('../services/analysis/rules/contactChannelRule');
const domainMismatchRule = require('../services/analysis/rules/domainMismatchRule');
const urgencyGuaranteedRule = require('../services/analysis/rules/urgencyGuaranteedRule');
const taskScamRule = require('../services/analysis/rules/taskScamRule');
const suspiciousUrlRule = require('../services/analysis/rules/suspiciousUrlRule');
const missingVerificationRule = require('../services/analysis/rules/missingVerificationRule');

describe('Input Normalizer', () => {
  it('should normalize both camelCase and snake_case inputs', () => {
    const raw = {
      job_title: 'Junior Analyst',
      company_name: 'Acme Global',
      job_description: 'Assist in financial analysis.',
      job_url: 'https://acme.example.com/jobs/123',
      salary: '$60,000 / year',
      location: 'New York, NY',
      recruiter_contact: 'recruiting@acme.example.com'
    };

    const norm = normalizeInput(raw);
    assert.equal(norm.jobTitle, 'Junior Analyst');
    assert.equal(norm.companyName, 'Acme Global');
    assert.equal(norm.jobDescription, 'Assist in financial analysis.');
    assert.equal(norm.urlDetails.hostname, 'acme.example.com');
    assert.equal(norm.recruiterContact.emails.length, 1);
    assert.equal(norm.recruiterContact.emails[0], 'recruiting@acme.example.com');
  });

  it('should extract Telegram handles, WhatsApp links, and phone numbers', () => {
    const raw = {
      jobTitle: 'Remote Assistant',
      jobDescription: 'Direct queries to t.me/recruiter_desk or message +91 9876543210. Wa.me/919876543210'
    };

    const norm = normalizeInput(raw);
    assert.ok(norm.recruiterContact.telegramHandles.includes('recruiter_desk'));
    assert.ok(norm.recruiterContact.whatsappContacts.includes('919876543210'));
    assert.ok(norm.recruiterContact.phones.length > 0);
  });
});

describe('Deterministic Analysis Rules', () => {
  describe('Upfront Payment Rule', () => {
    it('should flag registration fee request with evidence', () => {
      const input = normalizeInput({
        jobDescription: 'Selected candidates must deposit a registration fee of ₹1500 before onboarding kit dispatch.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'UPFRONT_PAYMENT_FEE');
      assert.equal(result.indicators[0].severity, 'CRITICAL');
      assert.ok(result.indicators[0].evidence.matchedText.includes('registration fee'));
      assert.equal(result.indicators[0].evidence.source, 'user_input.jobDescription');
    });

    it('should flag training deposit and kit charges', () => {
      const input = normalizeInput({
        jobDescription: 'Mandatory laptop deposit of $200 required prior to first day.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'UPFRONT_PAYMENT_FEE');
    });

    it('should not flag standard job descriptions without upfront fees', () => {
      const input = normalizeInput({
        jobDescription: 'We offer competitive pay, health insurance, and 401(k) matching. No application charges apply.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 0);
    });

    it('should not flag explicit denials such as "No application fee or payment to individual recruiters is required"', () => {
      const input = normalizeInput({
        jobDescription: 'Join our enterprise development practice. No application fee or payment to individual recruiters is required at any time.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 0);
    });

    it('should not flag legitimate enterprise disclaimers denying recruitment fees', () => {
      const input = normalizeInput({
        jobDescription: 'Infosys does not charge any application fee or registration charges at any stage of recruitment. Neither Infosys nor its partners ask for money.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 0);
    });

    it('should not flag mere mentions of fees without an actual payment demand', () => {
      const input = normalizeInput({
        jobDescription: 'Comprehensive benefits package includes tuition reimbursement, coverage for professional certification fees, and gym membership.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 0);
    });

    it('should flag genuine demands such as "Candidates must pay a ₹2,500 registration fee before receiving the offer letter"', () => {
      const input = normalizeInput({
        jobDescription: 'Candidates must pay a ₹2,500 registration fee before receiving the offer letter.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'UPFRONT_PAYMENT_FEE');
      assert.equal(result.indicators[0].severity, 'CRITICAL');
      assert.ok(result.indicators[0].evidence.matchedText.includes('registration fee'));
    });

    it('should flag genuine demands such as "Mandatory laptop deposit of $200 required prior to the first day"', () => {
      const input = normalizeInput({
        jobDescription: 'Mandatory laptop deposit of $200 required prior to the first day.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'UPFRONT_PAYMENT_FEE');
      assert.ok(result.indicators[0].evidence.matchedText.includes('laptop deposit'));
    });

    it('should handle negation in one clause without suppressing a separate genuine demand elsewhere', () => {
      const input = normalizeInput({
        jobDescription: 'We are an ethical employer. No application fee or payment to individual recruiters is required. However, candidates must pay a ₹2,500 registration fee before receiving the offer letter.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'UPFRONT_PAYMENT_FEE');
      assert.ok(result.indicators[0].evidence.matchedText.includes('registration fee'));
      assert.ok(!result.indicators[0].evidence.matchedText.includes('No application fee'));
    });

    it('should not flag comma-delimited lists of fees when explicitly negated', () => {
      const input = normalizeInput({
        jobDescription: 'Our company charges no application fee, registration fee, or training charge from candidates.'
      });

      const result = upfrontPaymentRule.evaluate(input);
      assert.equal(result.indicators.length, 0);
    });
  });

  describe('Employment Payment Rule', () => {
    it('should flag wallet recharge and prepaid task demands', () => {
      const input = normalizeInput({
        jobDescription: 'Candidates must top-up wallet balance to unlock tasks and earn high commission upon depositing funds.'
      });

      const result = employmentPaymentRule.evaluate(input);
      assert.ok(result.indicators.length >= 1);
      assert.equal(result.indicators[0].id, 'EMPLOYMENT_PAYMENT_REQUIRED');
      assert.equal(result.indicators[0].severity, 'CRITICAL');
    });
  });

  describe('Sensitive Financial Info Rule', () => {
    it('should flag requests for net banking password and OTP', () => {
      const input = normalizeInput({
        jobDescription: 'For payroll verification, share the OTP and net banking password with the coordinator.'
      });

      const result = sensitiveFinancialRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'SENSITIVE_FINANCIAL_INFO');
      assert.equal(result.indicators[0].severity, 'CRITICAL');
      assert.ok(result.indicators[0].evidence.matchedText.includes('password') || result.indicators[0].evidence.matchedText.includes('OTP'));
    });

    it('should flag blank cheque and remote desktop requests', () => {
      const input = normalizeInput({
        jobDescription: 'Install AnyDesk on your mobile and provide a signed blank cheque.'
      });

      const result = sensitiveFinancialRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'SENSITIVE_FINANCIAL_INFO');
    });
  });

  describe('Unrealistic Compensation Rule', () => {
    it('should flag exorbitant daily income claims for simple roles', () => {
      const input = normalizeInput({
        jobTitle: 'Data Entry Operator',
        jobDescription: 'Simple copy paste work. Earn up to ₹8,000 per day working only 1-2 hours a day guaranteed daily payout.'
      });

      const result = unrealisticCompensationRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'UNREALISTIC_COMPENSATION');
      assert.equal(result.indicators[0].severity, 'HIGH');
    });
  });

  describe('Contact Channel Rule', () => {
    it('should flag recruitment conducted exclusively via Telegram', () => {
      const input = normalizeInput({
        companyName: 'Global Enterprises',
        recruiterContact: 'Contact HR via Telegram @hiring_agent_desk, no calls accepted.'
      });

      const result = contactChannelRule.evaluate(input);
      assert.ok(result.indicators.some((i) => i.id === 'ANONYMOUS_MESSAGING_CHANNEL'));
    });

    it('should flag corporate recruiters using free public webmail', () => {
      const input = normalizeInput({
        companyName: 'Infosys Limited',
        recruiterContact: 'recruiter.infosys.jobs@gmail.com'
      });

      const result = contactChannelRule.evaluate(input);
      assert.ok(result.indicators.some((i) => i.id === 'PUBLIC_WEBMAIL_RECRUITER'));
      assert.ok(result.missingSignals.some((s) => s.signal === 'NO_VERIFIABLE_CORPORATE_EMAIL'));
    });
  });

  describe('Domain Mismatch Rule', () => {
    it('should flag contact domain mismatch with claimed employer', () => {
      const input = normalizeInput({
        companyName: 'Microsoft Corporation',
        recruiterContact: 'hr@random-hiring-firm-123.com'
      });

      const result = domainMismatchRule.evaluate(input);
      assert.ok(result.indicators.some((i) => i.id === 'CONTACT_DOMAIN_MISMATCH'));
    });

    it('should flag suspicious TLDs on application portal', () => {
      const input = normalizeInput({
        companyName: 'Amazon',
        jobUrl: 'https://amazon-recruitment-portal.xyz/apply'
      });

      const result = domainMismatchRule.evaluate(input);
      assert.ok(result.indicators.some((i) => i.id === 'SUSPICIOUS_TLD_PORTAL'));
    });
  });

  describe('Guaranteed Selection & Urgency Rule', () => {
    it('should flag direct joining without interview claims', () => {
      const input = normalizeInput({
        jobDescription: 'Direct joining without interview. 100% selection guaranteed, immediate appointment letter within 2 hours.'
      });

      const result = urgencyGuaranteedRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'URGENT_UNVERIFIED_OFFER');
      assert.equal(result.indicators[0].severity, 'HIGH');
    });
  });

  describe('Task-Based Scam Rule', () => {
    it('should flag YouTube video liking and Google map rating schemes', () => {
      const input = normalizeInput({
        jobTitle: 'Part-time Reviewer',
        jobDescription: 'Like YouTube videos and earn ₹50 per like. Rate hotels and restaurants on Google maps for commission.'
      });

      const result = taskScamRule.evaluate(input);
      assert.equal(result.indicators.length, 1);
      assert.equal(result.indicators[0].id, 'TASK_BASED_SCAM_PATTERN');
      assert.equal(result.indicators[0].severity, 'HIGH');
    });
  });

  describe('Suspicious URL Rule', () => {
    it('should flag URL shorteners hiding the destination', () => {
      const input = normalizeInput({
        jobUrl: 'https://bit.ly/secret-job-apply'
      });

      const result = suspiciousUrlRule.evaluate(input);
      assert.ok(result.indicators.some((i) => i.id === 'URL_SHORTENER_MASKING'));
    });

    it('should flag direct chat links as job URLs', () => {
      const input = normalizeInput({
        jobUrl: 'https://t.me/apply_direct_hr'
      });

      const result = suspiciousUrlRule.evaluate(input);
      assert.ok(result.indicators.some((i) => i.id === 'DIRECT_CHAT_APPLICATION_URL'));
    });
  });

  describe('Missing Verification Signals Rule', () => {
    it('should flag generic employer identities', () => {
      const input = normalizeInput({
        companyName: 'Reputed MNC',
        jobDescription: 'Looking for developers.'
      });

      const result = missingVerificationRule.evaluate(input);
      assert.ok(result.indicators.some((i) => i.id === 'GENERIC_EMPLOYER_NAME'));
      assert.ok(result.missingSignals.some((s) => s.signal === 'UNIDENTIFIED_LEGAL_ENTITY'));
    });
  });
});

describe('Rule Engine & Analysis Service Integration', () => {
  it('should allow registering dynamic custom rules', () => {
    const customEngine = new RuleEngine();
    const customRule = {
      id: 'CUSTOM_TEST_RULE',
      name: 'Custom Test Rule',
      evaluate: (input) => {
        if (input.jobTitle.includes('SpecialTest')) {
          return {
            indicators: [
              {
                id: 'CUSTOM_TEST_RULE',
                type: 'CUSTOM',
                severity: 'LOW',
                title: 'Custom Test Triggered',
                explanation: 'A custom rule executed successfully.',
                evidence: { title: input.jobTitle }
              }
            ]
          };
        }
        return { indicators: [] };
      }
    };

    customEngine.registerRule(customRule);
    assert.ok(customEngine.getRegisteredRuleIds().includes('CUSTOM_TEST_RULE'));

    const evalResult = customEngine.executeRules(normalizeInput({ jobTitle: 'SpecialTest Engineer' }));
    assert.ok(evalResult.indicators.some((i) => i.id === 'CUSTOM_TEST_RULE'));
  });

  it('should distinguish the four core elements in analysis result', async () => {
    const payload = {
      jobTitle: 'Data Entry Assistant',
      companyName: 'Quick Cash Corp',
      jobDescription: 'Pay ₹2000 registration fee. Earn ₹5000 daily with 1 hour work. Send OTP for verification.',
      recruiterContact: 'hr-desk@gmail.com',
      jobUrl: 'https://bit.ly/quickcash-apply'
    };

    // Execute with skipWebSearch=true for isolated deterministic test
    const result = await analyzeJobListing(payload, { enableWebSearch: false });

    // 1. User-provided information
    assert.ok(result.userProvided);
    assert.equal(result.userProvided.jobTitle, 'Data Entry Assistant');
    assert.equal(result.userProvided.companyName, 'Quick Cash Corp');

    // 2. Web evidence
    assert.ok(result.webEvidence);
    assert.equal(typeof result.webEvidence.searchPerformed, 'boolean');

    // 3. Detected warning indicators
    assert.ok(Array.isArray(result.warningIndicators));
    assert.ok(result.warningIndicators.length >= 3);
    assert.ok(result.warningIndicators.some((i) => i.id === 'UPFRONT_PAYMENT_FEE'));
    assert.ok(result.warningIndicators.some((i) => i.id === 'SENSITIVE_FINANCIAL_INFO'));
    assert.ok(result.warningIndicators.some((i) => i.id === 'UNREALISTIC_COMPENSATION'));

    // Verify indicator fields
    const upfront = result.warningIndicators.find((i) => i.id === 'UPFRONT_PAYMENT_FEE');
    assert.equal(upfront.severity, 'CRITICAL');
    assert.ok(upfront.type);
    assert.ok(upfront.explanation);
    assert.ok(upfront.evidence);
    assert.ok(upfront.evidence.matchedText);

    // 4. Missing verification signals
    assert.ok(Array.isArray(result.missingVerificationSignals));

    // Summary assertions: No arbitrary percentages, evidence-based assessment
    assert.ok(result.summary);
    assert.equal(result.summary.assessment, 'HIGH_RISK');
    assert.ok(result.summary.indicatorCounts.critical >= 2);
    assert.ok(result.summary.disclaimer);
    assert.equal(result.summary.percentage, undefined); // Ensure NO arbitrary AI scam percentage
  });
});
