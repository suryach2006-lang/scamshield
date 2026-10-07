import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, Info, Building2, MapPin } from 'lucide-react';

const ASSESSMENT_CONFIG = {
  HIGH_RISK: {
    label: 'High Risk Detected',
    className: 'critical',
    badgeClass: 'badge-critical',
    icon: AlertTriangle
  },
  ELEVATED_RISK: {
    label: 'Elevated Risk',
    className: 'elevated',
    badgeClass: 'badge-high',
    icon: AlertCircle
  },
  MODERATE_RISK: {
    label: 'Moderate Risk',
    className: 'moderate',
    badgeClass: 'badge-medium',
    icon: AlertCircle
  },
  LOW_RISK: {
    label: 'Low Risk Identified',
    className: 'low',
    badgeClass: 'badge-low',
    icon: CheckCircle2
  },
  INSUFFICIENT_DATA: {
    label: 'Insufficient Data',
    className: 'moderate',
    badgeClass: 'badge-info',
    icon: HelpCircle
  }
};

export default function SummaryCard({ summary, input, metadata }) {
  if (!summary) return null;

  const assessmentKey = summary.assessment || 'MODERATE_RISK';
  const config = ASSESSMENT_CONFIG[assessmentKey] || ASSESSMENT_CONFIG.MODERATE_RISK;
  const AssessmentIcon = config.icon;
  const counts = summary.indicatorCounts || { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

  return (
    <div className={`summary-card ${config.className}`}>
      <div className="summary-top">
        <div className="assessment-pill-group">
          <span className={`assessment-badge-large ${config.badgeClass}`}>
            <AssessmentIcon size={18} />
            {config.label}
          </span>
          {metadata?.serpApiRequestsMade !== undefined && (
            <span className="badge badge-info" title="SerpApi searches performed">
              {metadata.serpApiRequestsMade} SerpApi Searches
            </span>
          )}
        </div>

        {/* Input Details Pill */}
        {(input?.companyName || input?.jobTitle) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {input.companyName && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Building2 size={14} color="var(--primary)" /> {input.companyName}
              </span>
            )}
            {input.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="var(--primary)" /> {input.location}
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="summary-headline">{summary.headline}</h3>
      </div>

      {/* Indicator Tallies (Evidence-Based Metrics, Not Fake Percentages) */}
      <div className="tally-grid">
        <div className="tally-item">
          <div className="tally-num" style={{ color: 'var(--risk-critical)' }}>
            {counts.critical}
          </div>
          <div className="tally-label">Critical Red Flags</div>
        </div>
        <div className="tally-item">
          <div className="tally-num" style={{ color: 'var(--risk-high)' }}>
            {counts.high}
          </div>
          <div className="tally-label">High Severity</div>
        </div>
        <div className="tally-item">
          <div className="tally-num" style={{ color: 'var(--risk-medium)' }}>
            {counts.medium}
          </div>
          <div className="tally-label">Moderate Warnings</div>
        </div>
        <div className="tally-item">
          <div className="tally-num" style={{ color: 'var(--risk-low)' }}>
            {counts.low}
          </div>
          <div className="tally-label">Minor Observations</div>
        </div>
      </div>

      {/* Standard Disclaimer */}
      {summary.disclaimer && (
        <p className="disclaimer-text">
          <Info size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'text-top' }} />
          {summary.disclaimer}
        </p>
      )}
    </div>
  );
}
