import React, { useState } from 'react';
import {
  Globe,
  Briefcase,
  Newspaper,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  Search
} from 'lucide-react';

export default function EvidenceHub({ webEvidence, jobEvidence, newsEvidence }) {
  // Track which evidence card is expanded: null | 'web' | 'jobs' | 'news'
  // Or allow multiple: we can use an object with boolean flags
  const [expanded, setExpanded] = useState({
    web: false,
    jobs: false,
    news: false
  });

  const toggle = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Helper status for Web Evidence
  const hasWebSearch = webEvidence && webEvidence.searchPerformed;
  const officialDomain = webEvidence?.officialDomain;
  const knowledgeGraph = webEvidence?.knowledgeGraph;
  const webResults = webEvidence?.topResults || [];

  // Helper status for Job Evidence
  const hasJobSearch = jobEvidence && jobEvidence.searchPerformed;
  const isJobCorroborated = jobEvidence?.corroborationStatus === 'MATCHING_LISTINGS_FOUND';
  const jobListings = jobEvidence?.listings || [];

  // Helper status for News Evidence
  const hasNewsSearch = newsEvidence && newsEvidence.searchPerformed;
  const flaggedAlerts = newsEvidence?.flaggedAlerts || [];
  const newsArticles = newsEvidence?.articles || [];
  const hasAlerts = newsEvidence?.alertsFound || flaggedAlerts.length > 0;

  return (
    <section className="dashboard-section evidence-hub-section">
      <div className="section-title-wrap">
        <div>
          <h3>SerpApi Investigation Evidence</h3>
          <p className="section-subtitle">
            Corroborated evidence across Google Web, Google Jobs & Google News. Click &quot;View Evidence&quot; for source records.
          </p>
        </div>
      </div>

      <div className="evidence-summary-layout">
        {/* Row 1: Top 2 Cards (Web & Jobs) */}
        <div className="evidence-grid-top">
          {/* Card 1: Company Web Presence */}
          <div className={`compact-evidence-card ${expanded.web ? 'is-expanded' : ''}`}>
            <div className="compact-card-header">
              <div className="compact-card-title-group">
                <div className="category-icon-box web">
                  <Globe size={18} />
                </div>
                <div>
                  <h4 className="compact-card-title">Company Web Presence</h4>
                  <span className="compact-card-meta">
                    {hasWebSearch ? `${webResults.length} relevant sources` : 'Search not performed'}
                  </span>
                </div>
              </div>

              <div className="compact-status-badge">
                {officialDomain ? (
                  <span className="badge badge-low">
                    <CheckCircle2 size={12} /> {officialDomain}
                  </span>
                ) : hasWebSearch ? (
                  <span className="badge badge-medium">
                    <AlertCircle size={12} /> Unverified Domain
                  </span>
                ) : (
                  <span className="badge badge-info">Skipped</span>
                )}
              </div>
            </div>

            <p className="compact-card-summary">
              {officialDomain
                ? `Official corporate web domain identified (${officialDomain}). Verified via search intelligence.`
                : knowledgeGraph?.title
                ? `Knowledge Graph record located for "${knowledgeGraph.title}".`
                : webResults.length > 0
                ? `${webResults.length} web search results analyzed for corporate credentials.`
                : 'No high-confidence corporate domain found matching the employer query.'}
            </p>

            <div className="compact-card-footer">
              <span className="source-counter-pill">
                {knowledgeGraph ? 'Knowledge Graph + Web' : `${webResults.length} Web Records`}
              </span>

              <button
                type="button"
                className="btn-evidence-action"
                onClick={() => toggle('web')}
                aria-expanded={expanded.web}
              >
                {expanded.web ? (
                  <>
                    <span>Hide Evidence</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>View Evidence</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>

            {/* Expandable Details Container */}
            {expanded.web && (
              <div className="evidence-expanded-panel">
                {webEvidence?.query && (
                  <div className="expanded-query-tag">
                    <Search size={12} /> Query: <code>{webEvidence.query}</code>
                  </div>
                )}

                {/* Google Knowledge Graph Card */}
                {knowledgeGraph && (
                  <div className="detail-item-box kg-box">
                    <div className="detail-box-top">
                      <strong className="detail-box-title">{knowledgeGraph.title}</strong>
                      {knowledgeGraph.type && (
                        <span className="badge badge-info">{knowledgeGraph.type}</span>
                      )}
                    </div>
                    {knowledgeGraph.description && (
                      <p className="detail-box-desc">{knowledgeGraph.description}</p>
                    )}
                    {knowledgeGraph.website && (
                      <div className="detail-link-row">
                        <a
                          href={knowledgeGraph.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-source-link"
                        >
                          <ExternalLink size={13} /> Official Website: {knowledgeGraph.website}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Web Search Results */}
                {webResults.length > 0 ? (
                  <div className="detail-results-list">
                    <span className="detail-group-label">Top Search Results:</span>
                    {webResults.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="detail-item-box">
                        <div className="detail-box-top">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="detail-item-title-link"
                          >
                            <span>{item.title}</span>
                            <ExternalLink size={13} />
                          </a>
                        </div>
                        <span className="detail-box-meta">{item.displayedLink || item.link}</span>
                        {item.snippet && <p className="detail-box-snippet">{item.snippet}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-evidence-text">No top organic search results returned for this query.</p>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Google Jobs */}
          <div className={`compact-evidence-card ${expanded.jobs ? 'is-expanded' : ''}`}>
            <div className="compact-card-header">
              <div className="compact-card-title-group">
                <div className="category-icon-box jobs">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h4 className="compact-card-title">Google Jobs Syndication</h4>
                  <span className="compact-card-meta">
                    {hasJobSearch ? `${jobListings.length} indexed listings` : 'Search not performed'}
                  </span>
                </div>
              </div>

              <div className="compact-status-badge">
                {isJobCorroborated ? (
                  <span className="badge badge-low">
                    <CheckCircle2 size={12} /> Postings Found
                  </span>
                ) : hasJobSearch ? (
                  <span className="badge badge-medium">
                    <AlertCircle size={12} /> Unlisted in Jobs
                  </span>
                ) : (
                  <span className="badge badge-info">Skipped</span>
                )}
              </div>
            </div>

            <p className="compact-card-summary">
              {isJobCorroborated
                ? `${jobListings.length} matching position(s) corroborated in Google Jobs across indexed portals.`
                : hasJobSearch
                ? 'No active listings indexed in Google Jobs matching the title and company.'
                : 'Google Jobs inspection was not triggered for this input.'}
            </p>

            <div className="compact-card-footer">
              <span className="source-counter-pill">
                {jobListings.length > 0 ? `${jobListings.length} Active Positions` : '0 Indexed Postings'}
              </span>

              <button
                type="button"
                className="btn-evidence-action"
                onClick={() => toggle('jobs')}
                aria-expanded={expanded.jobs}
              >
                {expanded.jobs ? (
                  <>
                    <span>Hide Evidence</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>View Evidence</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>

            {/* Expandable Details Container */}
            {expanded.jobs && (
              <div className="evidence-expanded-panel">
                {jobEvidence?.query && (
                  <div className="expanded-query-tag">
                    <Search size={12} /> Query: <code>{jobEvidence.query}</code>{' '}
                    {jobEvidence.location && `(${jobEvidence.location})`}
                  </div>
                )}

                {jobListings.length > 0 ? (
                  <div className="detail-results-list">
                    <span className="detail-group-label">Indexed Job Postings:</span>
                    {jobListings.slice(0, 3).map((job, idx) => (
                      <div key={job.id || idx} className="detail-item-box">
                        <div className="detail-box-top">
                          <strong className="detail-box-title">{job.title}</strong>
                          {job.via && <span className="detail-via-badge">{job.via}</span>}
                        </div>
                        <div className="detail-box-meta">
                          <Building2 size={12} /> {job.companyName}
                          {job.location && (
                            <>
                              &nbsp;&bull;&nbsp;
                              <MapPin size={12} /> {job.location}
                            </>
                          )}
                        </div>

                        {job.applyOptions && job.applyOptions.length > 0 && (
                          <div className="detail-link-row">
                            <a
                              href={job.applyOptions[0].link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-source-link"
                            >
                              <ExternalLink size={13} /> {job.applyOptions[0].title || 'Apply on Job Portal'}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="detail-empty-box">
                    <p><strong>Note:</strong> Search absence alone does not confirm fraudulent intent.</p>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Some legitimate openings are recruited directly or unlisted on public aggregators. Candidates should independently verify via official employer portals.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Wide Card (News & Fraud Intelligence) */}
        <div className={`compact-evidence-card full-width-card ${expanded.news ? 'is-expanded' : ''}`}>
          <div className="compact-card-header">
            <div className="compact-card-title-group">
              <div className={`category-icon-box ${hasAlerts ? 'news-alert' : 'news'}`}>
                <Newspaper size={18} />
              </div>
              <div>
                <h4 className="compact-card-title">News & Fraud Intelligence</h4>
                <span className="compact-card-meta">
                  {hasNewsSearch
                    ? `${flaggedAlerts.length} fraud alerts &bull; ${newsArticles.length} general articles`
                    : 'Search not performed'}
                </span>
              </div>
            </div>

            <div className="compact-status-badge">
              {hasAlerts ? (
                <span className="badge badge-critical">
                  <AlertTriangle size={12} /> {flaggedAlerts.length} Scam Report{flaggedAlerts.length > 1 ? 's' : ''}
                </span>
              ) : hasNewsSearch ? (
                <span className="badge badge-low">
                  <CheckCircle2 size={12} /> No Fraud News Found
                </span>
              ) : (
                <span className="badge badge-info">Skipped</span>
              )}
            </div>
          </div>

          <p className="compact-card-summary">
            {hasAlerts
              ? `Public scam advisories or police/press reports flagged involving "${newsEvidence?.query || 'the employer'}".`
              : hasNewsSearch
              ? 'No public fraud advisories, FIR reports, or recruitment scam news found in Google News.'
              : 'News threat intelligence search was not executed for this input.'}
          </p>

          <div className="compact-card-footer">
            <span className="source-counter-pill">
              {hasAlerts ? `⚠️ ${flaggedAlerts.length} Flagged Advisories` : '✓ Clean News Record'}
            </span>

            <button
              type="button"
              className="btn-evidence-action"
              onClick={() => toggle('news')}
              aria-expanded={expanded.news}
            >
              {expanded.news ? (
                <>
                  <span>Hide Evidence</span>
                  <ChevronUp size={14} />
                </>
              ) : (
                <>
                  <span>View Evidence</span>
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>

          {/* Expandable Details Container */}
          {expanded.news && (
            <div className="evidence-expanded-panel">
              {newsEvidence?.query && (
                <div className="expanded-query-tag">
                  <Search size={12} /> Query: <code>{newsEvidence.query}</code>
                </div>
              )}

              {/* High-priority flagged alerts */}
              {flaggedAlerts.length > 0 && (
                <div className="detail-results-list">
                  <span className="detail-group-label" style={{ color: 'var(--risk-critical)' }}>
                    Flagged Scam / Fraud Advisory Reports:
                  </span>
                  {flaggedAlerts.slice(0, 3).map((item, idx) => (
                    <div key={`alert-${idx}`} className="detail-item-box alert-item-box">
                      <div className="detail-box-top">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="detail-item-title-link alert-title-link"
                        >
                          <span>{item.title}</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      <div className="detail-box-meta" style={{ color: 'var(--risk-critical)' }}>
                        <span>Source: {item.source}</span>
                        {item.date && <span>&bull; {item.date}</span>}
                      </div>
                      {item.snippet && <p className="detail-box-snippet">{item.snippet}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* General News Articles */}
              {newsArticles.length > 0 ? (
                <div className="detail-results-list" style={{ marginTop: flaggedAlerts.length > 0 ? '1rem' : '0' }}>
                  <span className="detail-group-label">General Media & Press Records:</span>
                  {newsArticles.slice(0, 3).map((item, idx) => (
                    <div key={`news-${idx}`} className="detail-item-box">
                      <div className="detail-box-top">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="detail-item-title-link"
                        >
                          <span>{item.title}</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      <div className="detail-box-meta">
                        <span>Source: {item.source}</span>
                        {item.date && <span>&bull; {item.date}</span>}
                      </div>
                      {item.snippet && <p className="detail-box-snippet">{item.snippet}</p>}
                    </div>
                  ))}
                </div>
              ) : flaggedAlerts.length === 0 ? (
                <p className="empty-evidence-text">
                  No public recruitment fraud reports or negative press articles were identified for this company in Google News.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
