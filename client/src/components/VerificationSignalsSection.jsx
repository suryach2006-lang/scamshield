import React from 'react';
import { ShieldCheck, HelpCircle, Check, AlertCircle, Info } from 'lucide-react';

export default function VerificationSignalsSection({ verificationSignals }) {
  if (!verificationSignals) return null;

  const verified = verificationSignals.verifiedSignals || [];
  const missing = verificationSignals.missingSignals || [];

  return (
    <section className="dashboard-section">
      <div className="section-title-wrap">
        <h3>
          <ShieldCheck size={20} color="var(--primary)" />
          Employer Verification Signals
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Identity and authenticity audit
        </span>
      </div>

      <div className="signals-split-grid">
        {/* Verified Signals Column */}
        <div className="signals-column">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--risk-low)' }}>
            <Check size={16} /> Verified Authenticity Signals ({verified.length})
          </div>

          {verified.length > 0 ? (
            verified.map((sig, idx) => (
              <div key={idx} className="signal-card verified">
                <div className="signal-card-title">
                  <span>{sig.title || sig.signal}</span>
                  <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>
                    Verified
                  </span>
                </div>
                <p className="signal-card-desc">{sig.description}</p>
                {sig.sourceUrl && (
                  <div style={{ marginTop: '0.2rem' }}>
                    <a href={sig.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem' }}>
                      Source Record &rarr;
                    </a>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="shield-card" style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No positive third-party verification records were corroborated for this listing.
            </div>
          )}
        </div>

        {/* Missing Signals Column */}
        <div className="signals-column">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--risk-medium)' }}>
            <AlertCircle size={16} /> Missing Verification Signals ({missing.length})
          </div>

          {missing.length > 0 ? (
            missing.map((sig, idx) => (
              <div key={idx} className="signal-card missing">
                <div className="signal-card-title">
                  <span>{sig.title || sig.signal.replace(/_/g, ' ')}</span>
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
            ))
          ) : (
            <div className="shield-card" style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              All standard identity and contact verification signals were provided and verified.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
