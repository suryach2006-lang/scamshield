/**
 * ScamShield Modular Rule Engine
 * Coordinates execution of deterministic detection rules, aggregates indicators,
 * and computes evidence-based risk assessment.
 */

const { SEVERITY, ASSESSMENT, STANDARD_DISCLAIMER, DEFAULT_RECOMMENDED_ACTIONS } = require('./constants');

// Default registered rules
const upfrontPaymentRule = require('./rules/upfrontPaymentRule');
const employmentPaymentRule = require('./rules/employmentPaymentRule');
const sensitiveFinancialRule = require('./rules/sensitiveFinancialRule');
const unrealisticCompensationRule = require('./rules/unrealisticCompensationRule');
const contactChannelRule = require('./rules/contactChannelRule');
const domainMismatchRule = require('./rules/domainMismatchRule');
const urgencyGuaranteedRule = require('./rules/urgencyGuaranteedRule');
const taskScamRule = require('./rules/taskScamRule');
const suspiciousUrlRule = require('./rules/suspiciousUrlRule');
const missingVerificationRule = require('./rules/missingVerificationRule');

class RuleEngine {
  constructor() {
    this.rules = [];
    // Register default core rules
    this.registerRule(upfrontPaymentRule);
    this.registerRule(employmentPaymentRule);
    this.registerRule(sensitiveFinancialRule);
    this.registerRule(unrealisticCompensationRule);
    this.registerRule(contactChannelRule);
    this.registerRule(domainMismatchRule);
    this.registerRule(urgencyGuaranteedRule);
    this.registerRule(taskScamRule);
    this.registerRule(suspiciousUrlRule);
    this.registerRule(missingVerificationRule);
  }

  /**
   * Registers a new analysis rule into the engine.
   * Enables seamless extensibility for future rules.
   *
   * @param {Object} rule
   * @param {string} rule.id
   * @param {string} rule.name
   * @param {Function} rule.evaluate
   */
  registerRule(rule) {
    if (!rule || typeof rule.id !== 'string' || typeof rule.evaluate !== 'function') {
      throw new Error('A valid rule must have a string "id" and an "evaluate" function.');
    }
    // Prevent duplicate registrations
    const existingIndex = this.rules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  /**
   * Returns list of currently registered rule IDs.
   * @returns {string[]}
   */
  getRegisteredRuleIds() {
    return this.rules.map((r) => r.id);
  }

  /**
   * Executes all registered rules against normalized input.
   *
   * @param {Object} normalizedInput
   * @param {Object} [context]
   * @returns {{ indicators: Array, missingSignals: Array }}
   */
  executeRules(normalizedInput, context = {}) {
    const allIndicators = [];
    const allMissingSignals = [];
    const seenIndicatorIds = new Set();
    const seenSignalIds = new Set();

    for (const rule of this.rules) {
      try {
        const result = rule.evaluate(normalizedInput, context);
        if (result && Array.isArray(result.indicators)) {
          for (const ind of result.indicators) {
            if (!seenIndicatorIds.has(ind.id)) {
              seenIndicatorIds.add(ind.id);
              allIndicators.push(ind);
            }
          }
        }
        if (result && Array.isArray(result.missingSignals)) {
          for (const sig of result.missingSignals) {
            if (!seenSignalIds.has(sig.signal)) {
              seenSignalIds.add(sig.signal);
              allMissingSignals.push(sig);
            }
          }
        }
      } catch (err) {
        // Individual rule failure should not crash the engine
        allIndicators.push({
          id: `RULE_ERROR_${rule.id}`,
          type: 'SYSTEM_EVALUATION_ERROR',
          severity: SEVERITY.LOW,
          title: `Evaluation Note for ${rule.name}`,
          explanation: `Automated rule evaluation experienced a partial issue: ${err.message}`,
          evidence: { ruleId: rule.id }
        });
      }
    }

    return {
      indicators: allIndicators,
      missingSignals: allMissingSignals
    };
  }

  /**
   * Calculates overall risk assessment without arbitrary percentages.
   *
   * @param {Array} indicators
   * @param {Object} normalizedInput
   * @returns {Object} Structured risk summary
   */
  calculateAssessment(indicators, normalizedInput) {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: indicators.length
    };

    indicators.forEach((ind) => {
      const sev = ind && ind.severity ? String(ind.severity).trim().toLowerCase() : 'low';
      if (counts[sev] !== undefined) {
        counts[sev] += 1;
      }
    });

    const isNearlyEmpty =
      !normalizedInput.jobTitle &&
      !normalizedInput.companyName &&
      !normalizedInput.jobDescription &&
      !normalizedInput.jobUrl &&
      !(normalizedInput.recruiterContact && normalizedInput.recruiterContact.raw);

    let assessment = ASSESSMENT.LOW_RISK;
    let headline = 'No prominent warning indicators were identified based on the provided inputs.';

    if (isNearlyEmpty) {
      assessment = ASSESSMENT.INSUFFICIENT_DATA;
      headline = 'Insufficient listing details provided to conduct an evidence-based risk assessment.';
    } else if (counts.critical > 0) {
      assessment = ASSESSMENT.HIGH_RISK;
      headline = `Critical warning indicator detected (${counts.critical} critical signal${counts.critical > 1 ? 's' : ''}). High caution strongly advised.`;
    } else if (counts.high >= 2) {
      assessment = ASSESSMENT.HIGH_RISK;
      headline = `Multiple high-severity risk indicators identified (${counts.high} high signals). Exercise strict diligence.`;
    } else if (counts.high === 1) {
      assessment = ASSESSMENT.ELEVATED_RISK;
      headline = 'Elevated risk indicator detected. Detailed verification recommended before proceeding.';
    } else if (counts.medium > 0) {
      assessment = ASSESSMENT.MODERATE_RISK;
      headline = 'Moderate risk or unverified identity indicators present in the job details.';
    }

    // Dynamic tailored recommendations based on detected indicators
    const recommendations = [...DEFAULT_RECOMMENDED_ACTIONS];
    if (counts.critical > 0) {
      recommendations.unshift('Cease communication immediately if asked for money, passwords, or remote device access.');
    }
    if (indicators.some((i) => i.id === 'ANONYMOUS_MESSAGING_CHANNEL')) {
      recommendations.push('Request an official invitation through an enterprise email address or recognized ATS.');
    }

    return {
      assessment,
      headline,
      indicatorCounts: counts,
      disclaimer: STANDARD_DISCLAIMER,
      recommendations: [...new Set(recommendations)]
    };
  }
}

// Export singleton instance and class
const defaultEngine = new RuleEngine();

module.exports = {
  RuleEngine,
  defaultEngine
};
