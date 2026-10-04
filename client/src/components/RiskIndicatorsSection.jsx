import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldCheck, Quote, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const SEVERITY_CONFIG = {
  CRITICAL: {
    className: 'critical',
    badgeClass: 'badge-critical',
    icon: AlertTriangle,
    label: 'Critical Flag'
  },
  HIGH: {
    className: 'high',
    badgeClass: 'badge-high',
    icon: AlertCircle,
    label: 'High Risk'
  },
  MEDIUM: {
    className: 'medium',
    badgeClass: 'badge-medium',
    icon: AlertCircle,
    label: 'Moderate Warning'
  },
  LOW: {
    className: 'low',
    badgeClass: 'badge-low',
    icon: Info,
    label: 'Minor Observation'
  }
};

export default function RiskIndicatorsSection({ indicators }) {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (idx) => {
    setExpandedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (!indicators || indicators.length === 0) {
    return (
      <section className="dashboard-section">
        <div className="section-title-wrap">
          <h3>
            <ShieldCheck size={20} color="var(--risk-low)" />
            Detected Warning Indicators (0)
          </h3>
        </div>
        <div className="shield-card" style={{ textAlign: 'center', padding: '1.75rem' }}>
          <p style={{ color: 'var(--risk-low)', fontWeight: 600 }}>
            No prominent warning indicators were identified based on the provided inputs.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Always verify that communication originates from authenticated corporate domains.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="section-title-wrap">
        <div>
          <h3>
            <AlertTriangle size={20} color="var(--risk-high)" />
            Detected Warning Indicators ({indicators.length})
          </h3>
          <p className="section-subtitle">
            Deterministic rule-based signals cross-referenced against employer input and search evidence.
          </p>
        </div>
      </div>

      <div className="indicators-list">
        {indicators.map((ind, index) => {
          const config = SEVERITY_CONFIG[ind.severity] || SEVERITY_CONFIG.MEDIUM;
          const SeverityIcon = config.icon;
          const isExpanded = !!expandedItems[index];
          const hasEvidence = !!ind.evidence && (
            ind.evidence.matchedText ||
            ind.evidence.articleTitle ||
            ind.evidence.verifiedCorporateDomain
          );

          return (
            <div key={ind.id || index} className={`indicator-card ${config.className}`}>
              <div className="indicator-top">
                <div className="indicator-title-wrap">
                  <SeverityIcon size={18} color={`var(--risk-${config.className})`} className="indicator-icon" />
                  <h4 className="indicator-title">{ind.title}</h4>
                </div>

                <div className="indicator-badges-group">
                  <span className={`badge ${config.badgeClass}`}>{config.label}</span>
                  {ind.type && (
                    <span className="badge badge-info" style={{ opacity: 0.85 }}>
                      {ind.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>

              <p className="indicator-explanation">{ind.explanation}</p>

              {/* Evidence Trigger Button & Collapsible Quote */}
              {hasEvidence && (
                <div className="indicator-evidence-section">
                  <button
                    type="button"
                    className="btn-indicator-toggle"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Hide Matched Text' : 'View Matched Evidence'}</span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {isExpanded && (
                    <div className="indicator-evidence-panel">
                      <div className="evidence-panel-header">
                        <Quote size={12} />
                        <span>Source: {ind.evidence.source || 'Listing Input'}</span>
                      </div>

                      {ind.evidence.matchedText && (
                        <div className="evidence-quote">
                          &ldquo;{ind.evidence.matchedText}&rdquo;
                        </div>
                      )}

                      {ind.evidence.articleTitle && (
                        <div className="evidence-quote">
                          <strong>Advisory:</strong> {ind.evidence.articleTitle}
                          {ind.evidence.publisher && <span> ({ind.evidence.publisher})</span>}
                          {ind.evidence.sourceUrl && (
                            <div style={{ marginTop: '0.35rem' }}>
                              <a
                                href={ind.evidence.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="evidence-inline-link"
                              >
                                View Report Article <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {ind.evidence.verifiedCorporateDomain && (
                        <div className="evidence-quote">
                          <strong>Domain Discrepancy:</strong> Verified domain is{' '}
                          <code>{ind.evidence.verifiedCorporateDomain}</code> vs contact domain{' '}
                          <code>{ind.evidence.recruiterDomain}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
