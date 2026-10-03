/**
 * SerpApi Live Integration Verification Script
 * Tests the ScamShield analysis engine across 3 distinct real-world scenarios:
 * 1. Legitimate Enterprise Listing (Tata Consultancy Services)
 * 2. Unregistered Advance-Fee Scam Listing (Apex Data Solutions)
 * 3. Brand Impersonation & Task Fraud Scheme (Wipro spoof with .xyz domain)
 *
 * Confirms exact response JSON schema and logs the SerpApi search request budget.
 */

const { analyzeJobListing } = require('./services/analysis');

const runLiveTests = async () => {
  console.log('================================================================');
  console.log('ScamShield - SerpApi Live Multi-Engine Integration Tests');
  console.log('================================================================\n');

  // --- Example 1: Legitimate Enterprise Company ---
  console.log('>>> [Example 1] Legitimate Enterprise Listing: Tata Consultancy Services');
  const example1 = {
    companyName: 'Tata Consultancy Services',
    jobTitle: 'Senior Cloud Solutions Architect',
    location: 'Bangalore, India',
    jobDescription:
      'We are looking for a Senior Cloud Solutions Architect to join our enterprise cloud practice. The candidate will design scalable cloud platforms using AWS and Azure, containerized microservices, and Terraform. Requires a Bachelor degree and at least 5 years of relevant cloud architecture experience.',
    jobUrl: 'https://www.tcs.com/careers',
    recruiterContact: 'careers@tcs.com',
    salary: '₹28,00,000 - ₹40,00,000 per annum'
  };

  const t1Start = Date.now();
  const res1 = await analyzeJobListing(example1, { enableWebSearch: true });
  const t1Duration = Date.now() - t1Start;

  console.log('Execution Time:', `${t1Duration}ms`);
  console.log('SerpApi Requests Made:', res1.metadata.serpApiRequestsMade);
  console.log('Risk Assessment:', res1.summary.assessment);
  console.log('Risk Headline:', res1.summary.headline);
  console.log('Web Evidence Status:', res1.webEvidence.status);
  console.log('Web Knowledge Graph:', res1.webEvidence.knowledgeGraph ? res1.webEvidence.knowledgeGraph.title : 'None');
  console.log('Official Domain Identified:', res1.webEvidence.officialDomain);
  console.log('Job Evidence Corroboration:', res1.jobEvidence.corroborationStatus);
  console.log('Job Listings Found on Google Jobs:', res1.jobEvidence.matchedListingsCount);
  if (res1.jobEvidence.listings.length > 0) {
    console.log('Sample Job from Google Jobs:', `"${res1.jobEvidence.listings[0].title}" via ${res1.jobEvidence.listings[0].via}`);
  }
  console.log('News Evidence Articles Found:', res1.newsEvidence.resultCount);
  console.log('News Fraud Alerts Found:', res1.newsEvidence.alertsFound);
  console.log('Risk Indicators Count:', res1.riskIndicators.length);
  console.log('Verified Signals:', res1.verificationSignals.verifiedSignals.map((s) => s.signal));
  console.log('Missing Signals:', res1.verificationSignals.missingSignals.map((s) => s.signal));
  console.log('----------------------------------------------------------------\n');

  // --- Example 2: Advance-Fee / Unregistered Scam Listing ---
  console.log('>>> [Example 2] Advance-Fee & Unregistered Scam: Apex Data Solutions');
  const example2 = {
    companyName: 'Apex Data Solutions',
    jobTitle: 'Home Based Data Entry Operator',
    location: 'Remote',
    jobDescription:
      'Immediate joining without any interview! Simple copy paste and typing work from home. Earn ₹6,000 to ₹8,000 daily with only 1-2 hours work guaranteed daily payout. Candidate must pay a refundable registration fee of ₹1,500 for the typing software kit before starting.',
    recruiterContact: 'Contact HR via Telegram @apex_data_hire or apexwork@gmail.com',
    salary: '₹6,000 / day'
  };

  const t2Start = Date.now();
  const res2 = await analyzeJobListing(example2, { enableWebSearch: true });
  const t2Duration = Date.now() - t2Start;

  console.log('Execution Time:', `${t2Duration}ms`);
  console.log('SerpApi Requests Made:', res2.metadata.serpApiRequestsMade);
  console.log('Risk Assessment:', res2.summary.assessment);
  console.log('Risk Headline:', res2.summary.headline);
  console.log('Web Evidence Status:', res2.webEvidence.status);
  console.log('Official Domain Identified:', res2.webEvidence.officialDomain || 'None (Unverified)');
  console.log('Job Evidence Corroboration:', res2.jobEvidence.corroborationStatus);
  console.log('Job Listings Found on Google Jobs:', res2.jobEvidence.matchedListingsCount);
  console.log('News Evidence Articles Found:', res2.newsEvidence.resultCount);
  console.log('Risk Indicators Detected:');
  res2.riskIndicators.forEach((ind) => {
    console.log(` - [${ind.severity}] [${ind.id}] ${ind.title}`);
    console.log(`   Source: ${ind.evidence.source} | Matched: "${ind.evidence.matchedText || JSON.stringify(ind.evidence)}"`);
  });
  console.log('Missing Signals:');
  res2.verificationSignals.missingSignals.forEach((sig) => {
    console.log(` - [${sig.importance}] ${sig.signal}: ${sig.description}`);
  });
  console.log('----------------------------------------------------------------\n');

  // --- Example 3: Brand Impersonation & Task Fraud (Wipro Spoof) ---
  console.log('>>> [Example 3] Brand Impersonation & Task Scam: Wipro Spoof on .xyz Domain');
  const example3 = {
    companyName: 'Wipro',
    jobTitle: 'Part-Time Media Rating Specialist',
    location: 'Hyderabad, India',
    jobDescription:
      'Direct selection guaranteed! Complete daily task orders by liking YouTube videos and rating Google maps for commission. Selected candidates must top-up wallet balance to unlock tasks and earn high commission upon depositing.',
    jobUrl: 'https://wipro-careers-portal.xyz/apply',
    recruiterContact: 'wipro-recruitment-team@gmail.com'
  };

  const t3Start = Date.now();
  const res3 = await analyzeJobListing(example3, { enableWebSearch: true });
  const t3Duration = Date.now() - t3Start;

  console.log('Execution Time:', `${t3Duration}ms`);
  console.log('SerpApi Requests Made:', res3.metadata.serpApiRequestsMade);
  console.log('Risk Assessment:', res3.summary.assessment);
  console.log('Risk Headline:', res3.summary.headline);
  console.log('Web Evidence Official Domain:', res3.webEvidence.officialDomain);
  console.log('Job Evidence Corroboration:', res3.jobEvidence.corroborationStatus);
  console.log('News Evidence Flagged Alerts:', res3.newsEvidence.flaggedAlerts.length);
  if (res3.newsEvidence.flaggedAlerts.length > 0) {
    console.log('Sample News Fraud Alert:', `"${res3.newsEvidence.flaggedAlerts[0].title}" (${res3.newsEvidence.flaggedAlerts[0].source})`);
  }
  console.log('Risk Indicators Detected:');
  res3.riskIndicators.forEach((ind) => {
    console.log(` - [${ind.severity}] [${ind.id}] ${ind.title}`);
  });
  console.log('----------------------------------------------------------------\n');

  console.log('================================================================');
  console.log('JSON Output Verification Checklist:');
  const checkKeys = (obj, name) => {
    const required = ['input', 'webEvidence', 'jobEvidence', 'newsEvidence', 'riskIndicators', 'verificationSignals'];
    const missing = required.filter((k) => obj[k] === undefined);
    if (missing.length === 0) {
      console.log(`✔ [${name}] All 6 required top-level keys present.`);
    } else {
      console.error(`✖ [${name}] Missing keys:`, missing);
    }
  };

  checkKeys(res1, 'Example 1');
  checkKeys(res2, 'Example 2');
  checkKeys(res3, 'Example 3');
  console.log('================================================================');
};

runLiveTests().catch(console.error);
