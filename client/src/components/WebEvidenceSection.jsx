import React from 'react';
import { Globe, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WebEvidenceSection({ webEvidence }) {
  if (!webEvidence || !webEvidence.searchPerformed) {
    return (
      <div className="evidence-column">
        <div className="section-title-wrap">
          <h4>
            <Globe size={18} color="var(--primary)" /> Company Web Verification
          </h4>
        </div>
        <div className="shield-card" style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Web search was skipped or not performed for this query.
        </div>
      </div>
    );
  }

  const { knowledgeGraph, topResults, officialDomain, query, status } = webEvidence;

  return (
    <div className="evidence-column">
      <div className="section-title-wrap">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.05rem', color: '#ffffff' }}>
          <Globe size={18} color="var(--primary)" /> Company Web Presence
        </h4>
        {officialDomain ? (
          <span className="badge badge-low">
            <CheckCircle2 size={12} /> {officialDomain}
          </span>
        ) : (
          <span className="badge badge-medium">
            <AlertCircle size={12} /> Unverified Domain
          </span>
        )}
      </div>

      {query && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Query: {query}
        </div>
      )}

      {/* Google Knowledge Graph Card */}
      {knowledgeGraph && (
        <div className="evidence-item-card" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="evidence-item-title">{knowledgeGraph.title}</div>
            {knowledgeGraph.type && (
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                {knowledgeGraph.type}
              </span>
            )}
          </div>
          {knowledgeGraph.description && (
            <p className="evidence-item-snippet">{knowledgeGraph.description}</p>
          )}
          {knowledgeGraph.website && (
            <a
              href={knowledgeGraph.website}
              target="_blank"
              rel="noopener noreferrer"
              className="evidence-item-meta"
              style={{ color: 'var(--primary)' }}
            >
              <ExternalLink size={13} /> Official Website: {knowledgeGraph.website}
            </a>
          )}
        </div>
      )}

      {/* Top Search Results */}
      {topResults && topResults.length > 0 ? (
        topResults.slice(0, 3).map((item, idx) => (
          <div key={idx} className="evidence-item-card">
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
              {item.displayedLink || item.link}
            </div>
            {item.snippet && <p className="evidence-item-snippet">{item.snippet}</p>}
          </div>
        ))
      ) : (
        <div className="shield-card" style={{ padding: '0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          No prominent web results returned for this query.
        </div>
      )}
    </div>
  );
}
