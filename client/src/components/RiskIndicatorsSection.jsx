import React from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldCheck, Quote } from 'lucide-react';

const SEVERITY_CONFIG = {
  CRITICAL: {
    className: 'critical',
    badgeClass: 'badge-critical',
    icon: AlertTriangle,
    label: 'Critical'
  },
  HIGH: {
    className: 'high',
    badgeClass: 'badge-high',
    icon: AlertCircle,
    label: 'High Severity'
  },
  MEDIUM: {
    className: 'medium',
    badgeClass: 'badge-medium',
    icon: AlertCircle,
    label: 'Medium'
  },
  LOW: {
    className: 'low',
    badgeClass: 'badge-low',
    icon: Info,
    label: 'Low Severity'
  }
};

export default function RiskIndicatorsSection({ indicators }) {
  if (!indicators || indicators.length === 0) {
    return (
      <section className="dashboard-section">
        <div className="section-title-wrap">
          <h3>
            <ShieldCheck size={20} color="var(--risk-low)" />
            Detected Warning Indicators (0)
          </h3>
        </div>
        <div className="shield-card" style={{ textAlign: 'center', padding: '2rem' }}>
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
        <h3>
          <AlertTriangle size={20} color="var(--risk-high)" />
          Detected Warning Indicators ({indicators.length})
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Deterministic evidence-based signals
        </span>
      </div>

      <div className="indicators-list">
        {indicators.map((ind, index) => {
          const config = SEVERITY_CONFIG[ind.severity] || SEVERITY_CONFIG.MEDIUM;
          const SeverityIcon = config.icon;

          return (
            <div key={ind.id || index} className={`indicator-card ${config.className}`}>
              <div className="indicator-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SeverityIcon size={18} color={`var(--risk-${config.className})`} />
                  <h4 className="indicator-title">{ind.title}</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${config.badgeClass}`}>{config.label}</span>
                  {ind.type && (
                    <span className="badge badge-info" style={{ opacity: 0.85 }}>
                      {ind.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>

              <p className="indicator-explanation">{ind.explanation}</p>

              {/* Supporting Evidence Block */}
              {ind.evidence && (
                <div style={{ marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <Quote size={12} />
                    <span>Supporting Evidence ({ind.evidence.source || 'Listing input'}):</span>
                  </div>

                  {ind.evidence.matchedText && (
                    <div className="evidence-quote">
                      "{ind.evidence.matchedText}"
                    </div>
                  )}

                  {ind.evidence.articleTitle && (
                    <div className="evidence-quote">
                      <strong>Headline:</strong> {ind.evidence.articleTitle}
                      {ind.evidence.publisher && <span> ({ind.evidence.publisher})</span>}
                      {ind.evidence.sourceUrl && (
                        <div>
                          <a href={ind.evidence.sourceUrl} target="_blank" rel="noopener noreferrer">
                            View Report Article &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {ind.evidence.verifiedCorporateDomain && (
                    <div className="evidence-quote">
                      Domain Discrepancy: Verified domain is <strong>{ind.evidence.verifiedCorporateDomain}</strong> vs contact domain <strong>{ind.evidence.recruiterDomain}</strong>
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
