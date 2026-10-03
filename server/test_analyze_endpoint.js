/**
 * Verification script to test live POST /api/analyze endpoint with multiple scenarios.
 */

const runTests = async () => {
  const endpoint = 'http://127.0.0.1:5000/api/analyze';

  console.log('========================================================');
  console.log('Testing ScamShield Analysis API Endpoint: POST /api/analyze');
  console.log('========================================================\n');

  // Scenario 1: Advance-fee scam with registration fee & Telegram recruiter
  console.log('--- [Test 1] Testing Advance-Fee & Anonymous Messaging Listing ---');
  const payload1 = {
    jobTitle: 'Data Entry Assistant',
    companyName: 'Apex Data Services',
    jobDescription: 'Simple copy paste work. Earn up to ₹6,000 per day working only 1-2 hours a day. Candidate must pay a refundable registration fee of ₹1,500 for the kit. Contact HR via Telegram @apex_hr_official.',
    salary: '₹6,000 / day',
    recruiterContact: 'Contact on Telegram @apex_hr_official or apexrecruiter@gmail.com',
    skipWebSearch: true
  };

  const res1 = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload1)
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Assessment:', data1.data.summary.assessment);
  console.log('Headline:', data1.data.summary.headline);
  console.log('Indicator Counts:', data1.data.summary.indicatorCounts);
  console.log('Detected Indicators:');
  data1.data.warningIndicators.forEach((ind) => {
    console.log(` - [${ind.severity}] [${ind.type}] ${ind.title}`);
    console.log(`   Evidence: "${ind.evidence.matchedText || JSON.stringify(ind.evidence)}"`);
  });
  console.log('Missing Verification Signals:');
  data1.data.missingVerificationSignals.forEach((sig) => {
    console.log(` - [${sig.importance}] ${sig.signal}: ${sig.description}`);
  });
  console.log('\n');

  // Scenario 2: Task scam (YouTube likes, wallet recharge)
  console.log('--- [Test 2] Testing Task Scam & Wallet Top-up Listing ---');
  const payload2 = {
    jobTitle: 'YouTube Rating Specialist',
    companyName: 'Global Video Network',
    jobDescription: 'Like YouTube videos and earn ₹50 per like. Candidates must top-up wallet balance to unlock tasks and earn high commission upon depositing.',
    skipWebSearch: true
  };

  const res2 = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload2)
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Assessment:', data2.data.summary.assessment);
  console.log('Detected Indicators:', data2.data.warningIndicators.map((i) => `${i.id} (${i.severity})`));
  console.log('\n');

  // Scenario 3: Credential & Financial data harvesting
  console.log('--- [Test 3] Testing Sensitive Credential Harvesting ---');
  const payload3 = {
    jobTitle: 'Online Account Executive',
    companyName: 'Fast Hire Services',
    jobDescription: 'Install AnyDesk on your mobile and share the OTP and net banking password with the coordinator for identity verification.',
    skipWebSearch: true
  };

  const res3 = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload3)
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status);
  console.log('Assessment:', data3.data.summary.assessment);
  console.log('Detected Indicators:', data3.data.warningIndicators.map((i) => `${i.id} (${i.severity})`));
  console.log('\n');

  // Scenario 4: Legitimate Corporate Position
  console.log('--- [Test 4] Testing Legitimate Professional Listing ---');
  const payload4 = {
    jobTitle: 'Senior Full Stack Engineer',
    companyName: 'Acme Software Labs',
    jobDescription: 'We are seeking an experienced Full Stack Engineer with expertise in Node.js, React, and cloud systems. You will lead development of high-throughput web APIs and microservices.',
    location: 'Bangalore, India',
    salary: '₹28,00,000 - ₹35,00,000 per year',
    jobUrl: 'https://careers.acme-software.com/positions/dev-101',
    recruiterContact: 'careers@acme-software.com',
    skipWebSearch: true
  };

  const res4 = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload4)
  });
  const data4 = await res4.json();
  console.log('Status:', res4.status);
  console.log('Assessment:', data4.data.summary.assessment);
  console.log('Warning Indicators Count:', data4.data.warningIndicators.length);
  console.log('Indicator Counts:', data4.data.summary.indicatorCounts);
  console.log('\n');

  // Scenario 5: Validation Error (Empty Payload)
  console.log('--- [Test 5] Testing Empty Payload (Validation Error) ---');
  const res5 = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const data5 = await res5.json();
  console.log('Status:', res5.status);
  console.log('Error Code:', data5.error.code);
  console.log('Error Message:', data5.error.message);
  console.log('\n');

  console.log('========================================================');
  console.log('All Scenarios Tested Successfully!');
  console.log('========================================================');
};

runTests().catch(console.error);
