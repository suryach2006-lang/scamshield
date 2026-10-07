import React from 'react';
import { ArrowLeft, Building2, MapPin, Clock, RotateCcw } from 'lucide-react';
import SummaryCard from './SummaryCard';
import RiskIndicatorsSection from './RiskIndicatorsSection';
import EvidenceHub from './EvidenceHub';
import VerificationSignalsSection from './VerificationSignalsSection';
import RecommendationsCard from './RecommendationsCard';

const formatAnalyzedTime = (isoString) => {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime())
      ? 'Just now'
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
};

export default function ResultsView({ results, onNewAnalysis }) {
  if (!results) return null;

  const input = results.input || results.userProvided || {};
  const metadata = results.metadata || {};
  const summary = results.summary || {};
  const riskIndicators = results.riskIndicators || results.warningIndicators || [];
  const verificationSignals = results.verificationSignals || {
    verifiedSignals: [],
    missingSignals: results.missingVerificationSignals || []
  };

  const jobTitle = input.jobTitle || 'Job Offer';
  const companyName = input.companyName || 'Target Employer';

  // Safely formatted date
  const analyzedDate = formatAnalyzedTime(metadata.analyzedAt);


  return (
    <main className="results-view" id="results-view">
      {/* Top Navigation & Context Bar */}
      <div className="results-top-toolbar">
        <button
          type="button"
          className="btn-new-analysis"
          onClick={onNewAnalysis}
          title="Return to the Job Inspection form"
        >
          <ArrowLeft size={16} />
          <span>New Analysis</span>
        </button>

        <div className="results-toolbar-meta">
          <div className="toolbar-target-pill">
            <Building2 size={14} className="toolbar-icon" />
            <span className="toolbar-job-name">{jobTitle}</span>
            <span className="toolbar-separator">&bull;</span>
            <span className="toolbar-company-name">{companyName}</span>
            {input.location && (
              <>
                <span className="toolbar-separator">&bull;</span>
                <span className="toolbar-location"><MapPin size={12} /> {input.location}</span>
              </>
            )}
          </div>

          <div className="toolbar-timing-pill">
            <Clock size={12} />
            <span>Analyzed at {analyzedDate}</span>
            {metadata.serpApiRequestsMade !== undefined && (
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                {metadata.serpApiRequestsMade} SerpApi Searches
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1. Overall Executive Assessment Summary */}
      <SummaryCard
        summary={summary}
        input={input}
        metadata={metadata}
      />

      {/* 2. Detected Warning Indicators */}
      <RiskIndicatorsSection
        indicators={riskIndicators}
      />

      {/* 3. SerpApi Multi-Engine Search Intelligence Evidence (Compact & Expandable) */}
      <EvidenceHub
        webEvidence={results.webEvidence}
        jobEvidence={results.jobEvidence}
        newsEvidence={results.newsEvidence}
      />

      {/* 4. Employer Verification Signals (Compact & Expandable) */}
      <VerificationSignalsSection
        verificationSignals={verificationSignals}
      />

      {/* 5. Recommended Candidate Actions */}
      {summary.recommendations && (
        <RecommendationsCard recommendations={summary.recommendations} />
      )}

      {/* Bottom Action Footer */}
      <div className="results-bottom-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onNewAnalysis}
        >
          <RotateCcw size={16} />
          <span>Analyze Another Job Listing</span>
        </button>
      </div>
    </main>
  );
}
