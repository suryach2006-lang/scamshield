import React from 'react';
import { Newspaper, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function NewsEvidenceSection({ newsEvidence }) {
  if (!newsEvidence || !newsEvidence.searchPerformed) {
    return (
      <div className="evidence-column">
        <div className="section-title-wrap">
          <h4>
            <Newspaper size={18} color="var(--primary)" /> Google News Intel
          </h4>
        </div>
        <div className="shield-card" style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          News search was skipped or not performed for this query.
        </div>
      </div>
    );
  }

  const { articles, flaggedAlerts, alertsFound, query } = newsEvidence;

  return (
    <div className="evidence-column">
      <div className="section-title-wrap">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.05rem', color: '#ffffff' }}>
          <Newspaper size={18} color="var(--primary)" /> News & Fraud Intel
        </h4>
        {alertsFound ? (
          <span className="badge badge-critical">
            <AlertTriangle size={12} /> {flaggedAlerts?.length || 1} Scam Report{flaggedAlerts?.length > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="badge badge-low">
            <CheckCircle2 size={12} /> No Fraud News
          </span>
        )}
      </div>

      {query && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Query: {query}
        </div>
      )}

      {/* Flagged Alerts Highlight */}
      {flaggedAlerts && flaggedAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--risk-critical)', textTransform: 'uppercase' }}>
            Flagged Advisory / Scam Reports:
          </span>
          {flaggedAlerts.slice(0, 2).map((item, idx) => (
            <div
              key={`alert-${idx}`}
              className="evidence-item-card"
              style={{ backgroundColor: 'var(--risk-critical-bg)', borderColor: 'var(--risk-critical-border)' }}
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="evidence-item-title"
                style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}
              >
                <span>{item.title}</span>
                <ExternalLink size={13} style={{ flexShrink: 0 }} />
              </a>
              <div className="evidence-item-meta" style={{ color: '#f87171' }}>
                <span>{item.source}</span>
                {item.date && <span>&bull; {item.date}</span>}
              </div>
              {item.snippet && <p className="evidence-item-snippet" style={{ color: '#fecaca' }}>{item.snippet}</p>}
            </div>
          ))}
        </div>
      )}

      {/* General News Articles */}
      {articles && articles.length > 0 ? (
        articles.slice(0, 3).map((item, idx) => (
          <div key={`news-${idx}`} className="evidence-item-card">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="evidence-item-title"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
            >
              <span>{item.title}</span>
              <ExternalLink size={14} style={{ flexShrink: 0 }} />
            </a>
            <div className="evidence-item-meta">
              <span>{item.source}</span>
              {item.date && <span>&bull; {item.date}</span>}
            </div>
            {item.snippet && <p className="evidence-item-snippet">{item.snippet}</p>}
          </div>
        ))
      ) : (
        <div className="shield-card" style={{ padding: '0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          No public fraud advisories or negative recruitment reports found in Google News.
        </div>
      )}
    </div>
  );
}
