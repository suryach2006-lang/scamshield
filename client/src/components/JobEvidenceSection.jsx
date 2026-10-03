import React from 'react';
import { Briefcase, ExternalLink, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';

export default function JobEvidenceSection({ jobEvidence }) {
  if (!jobEvidence || !jobEvidence.searchPerformed) {
    return (
      <div className="evidence-column">
        <div className="section-title-wrap">
          <h4>
            <Briefcase size={18} color="var(--primary)" /> Google Jobs Evidence
          </h4>
        </div>
        <div className="shield-card" style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Job search was skipped or not performed for this query.
        </div>
      </div>
    );
  }

  const { listings, corroborationStatus, query, location } = jobEvidence;
  const isCorroborated = corroborationStatus === 'MATCHING_LISTINGS_FOUND';

  return (
    <div className="evidence-column">
      <div className="section-title-wrap">
        <h4>
          <Briefcase size={18} color="var(--primary)" /> Google Jobs Evidence
        </h4>
        {isCorroborated ? (
          <span className="badge badge-low">
            <CheckCircle2 size={12} /> Postings Found
          </span>
        ) : (
          <span className="badge badge-medium">
            <AlertCircle size={12} /> Unlisted in Google Jobs
          </span>
        )}
      </div>

      {query && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Query: {query} {location && `(${location})`}
        </div>
      )}

      {listings && listings.length > 0 ? (
        listings.slice(0, 3).map((job, idx) => (
          <div key={job.id || idx} className="evidence-item-card">
            <div className="evidence-item-title">{job.title}</div>
            <div className="evidence-item-meta">
              <span>{job.companyName}</span>
              {job.location && (
                <span>&bull; <MapPin size={12} style={{ display: 'inline', verticalAlign: 'text-top' }} /> {job.location}</span>
              )}
            </div>

            {job.via && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Syndicated: {job.via}
              </div>
            )}

            {job.applyOptions && job.applyOptions.length > 0 && (
              <div style={{ marginTop: '0.35rem' }}>
                <a
                  href={job.applyOptions[0].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="evidence-item-meta"
                  style={{ color: 'var(--primary)', fontWeight: 600 }}
                >
                  <ExternalLink size={13} /> {job.applyOptions[0].title || 'Apply on Job Portal'}
                </a>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="shield-card" style={{ padding: '0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            No active job postings were indexed in Google Jobs.
          </p>
          <p style={{ marginTop: '0.25rem' }}>
            Note: Search absence alone does not prove fraud, as some positions are unlisted or direct, but candidates should independently verify directly with the employer's HR.
          </p>
        </div>
      )}
    </div>
  );
}
