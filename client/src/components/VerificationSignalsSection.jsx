import React, { useState } from 'react';
import { ShieldCheck, Check, AlertCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export default function VerificationSignalsSection({ verificationSignals }) {
  const [expandedVerified, setExpandedVerified] = useState(false);
  const [expandedMissing, setExpandedMissing] = useState(false);

  if (!verificationSignals) return null;

  const verified = verificationSignals.verifiedSignals || [];
  const missing = verificationSignals.missingSignals || [];

  return (
    <section className="dashboard-section verification-signals-section">
      <div className="section-title-wrap">
        <div>
          <h3>
            <ShieldCheck size={20} color="var(--primary)" />
            Employer Verification Signals
          </h3>
          <p className="section-subtitle">
            Authenticity audit comparing provided employer claims against corroborated third-party records.
          </p>
        </div>
      </div>

      <div className="signals-split-grid">
        {/* Verified Signals Column */}
        <div className="compact-signals-panel verified-panel">
          <div className="signals-panel-header">
            <div className="signals-panel-title">
              <Check size={16} className="text-success" />
              <span>Verified Signals ({verified.length})</span>
            </div>
            <span className="badge badge-low">{verified.length} Confirmed</span>
          </div>

          <p className="signals-panel-summary">
            {verified.length > 0
              ? `${verified.length} positive corporate authenticity marker(s) corroborated via external records.`
              : 'No external third-party verification records were corroborated for this listing.'}
          </p>

          {/* Quick Signal Tags */}
          {verified.length > 0 && (
            <div className="signals-tag-list">
              {verified.map((sig, idx) => (
                <span key={idx} className="signal-mini-tag verified">
                  ✓ {sig.title || sig.signal}
                </span>
              ))}
            </div>
          )}

          {verified.length > 0 && (
            <button
              type="button"
              className="btn-signals-toggle"
              onClick={() => setExpandedVerified((prev) => !prev)}
              aria-expanded={expandedVerified}
            >
              <span>{expandedVerified ? 'Hide Details' : `View ${verified.length} Verified Details`}</span>
              {expandedVerified ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {expandedVerified && verified.length > 0 && (
            <div className="signals-expanded-list">
              {verified.map((sig, idx) => (
                <div key={idx} className="signal-card verified">
                  <div className="signal-card-title">
                    <span>{sig.title || sig.signal}</span>
                    <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>
                      Verified
                    </span>
                  </div>
                  <p className="signal-card-desc">{sig.description}</p>
                  {sig.sourceUrl && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <a
                        href={sig.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="evidence-inline-link"
                      >
                        Source Record <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing Signals Column */}
        <div className="compact-signals-panel missing-panel">
          <div className="signals-panel-header">
            <div className="signals-panel-title">
              <AlertCircle size={16} className="text-warning" />
              <span>Missing Signals ({missing.length})</span>
            </div>
            <span className="badge badge-medium">{missing.length} Unverified</span>
          </div>

          <p className="signals-panel-summary">
            {missing.length > 0
              ? `${missing.length} standard corporate authenticity or contact verification requirement(s) missing.`
              : 'All standard identity and contact verification signals were provided and verified.'}
          </p>

          {/* Quick Signal Tags */}
          {missing.length > 0 && (
            <div className="signals-tag-list">
              {missing.map((sig, idx) => {
                const label = sig.title || (typeof sig.signal === 'string' ? sig.signal.replace(/_/g, ' ') : 'Unverified Signal');
                return (
                  <span key={idx} className="signal-mini-tag missing">
                    ⚠ {label}
                  </span>
                );
              })}
            </div>
          )}

          {missing.length > 0 && (
            <button
              type="button"
              className="btn-signals-toggle"
              onClick={() => setExpandedMissing((prev) => !prev)}
              aria-expanded={expandedMissing}
            >
              <span>{expandedMissing ? 'Hide Details' : `View ${missing.length} Missing Details`}</span>
              {expandedMissing ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {expandedMissing && missing.length > 0 && (
            <div className="signals-expanded-list">
              {missing.map((sig, idx) => {
                const label = sig.title || (typeof sig.signal === 'string' ? sig.signal.replace(/_/g, ' ') : 'Unverified Signal');
                return (
                  <div key={idx} className="signal-card missing">
                    <div className="signal-card-title">
                      <span>{label}</span>
                      {sig.importance && (
                        <span
                          className={`badge ${
                            sig.importance === 'HIGH' ? 'badge-high' : 'badge-medium'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {sig.importance} Priority
                        </span>
                      )}
                    </div>
                    <p className="signal-card-desc">{sig.description}</p>
                  </div>
                );
              })}

            </div>
          )}
        </div>
      </div>
    </section>
  );
}
