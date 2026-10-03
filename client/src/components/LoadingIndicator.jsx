import React, { useState, useEffect } from 'react';
import { Search, Globe, Briefcase, Newspaper, ShieldAlert } from 'lucide-react';

const STEPS = [
  { icon: Globe, text: 'Searching Google Web & Knowledge Graph for corporate credentials...' },
  { icon: Briefcase, text: 'Querying Google Jobs to corroborate active syndicated listings...' },
  { icon: Newspaper, text: 'Scanning Google News for fraud alerts, complaints, and FIRs...' },
  { icon: ShieldAlert, text: 'Running deterministic rules on compensation, fees, and contacts...' }
];

export default function LoadingIndicator() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="loading-box" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <div>
        <h3 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
          Conducting Deep Threat & Web Intelligence Analysis
        </h3>
        <p style={{ color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <StepIcon size={16} />
          {STEPS[currentStep].text}
        </p>
      </div>
      <div className="loading-steps">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Step {currentStep + 1} of {STEPS.length} — Cross-verifying signals without hallucinations
        </span>
      </div>
    </div>
  );
}
