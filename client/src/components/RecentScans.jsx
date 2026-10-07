import React, { useState, useEffect } from 'react';
import { History, Building2, Briefcase, Calendar, ChevronRight, RotateCw, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getRecentScans, getScanById } from '../api/scamShieldApi';

const ASSESSMENT_BADGES = {
  HIGH_RISK: {
    label: 'High Risk',
    className: 'badge-critical',
    icon: AlertTriangle
  },
  ELEVATED_RISK: {
    label: 'Elevated Risk',
    className: 'badge-high',
    icon: AlertCircle
  },
  MODERATE_RISK: {
    label: 'Moderate Warning',
    className: 'badge-medium',
    icon: AlertCircle
  },
  LOW_RISK: {
    label: 'Low Risk',
    className: 'badge-low',
    icon: CheckCircle2
  },
  INSUFFICIENT_DATA: {
    label: 'Info',
    className: 'badge-info',
    icon: AlertCircle
  }
};

export default function RecentScans({ onOpenScan, refreshTrigger }) {
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingScanId, setOpeningScanId] = useState(null);

  const fetchScans = async () => {
    setIsLoading(true);
    try {
      const data = await getRecentScans(10);
      setScans(data || []);
    } catch {
      setScans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getRecentScans(10)
      .then((data) => {
        if (isMounted) setScans(data || []);
      })
      .catch(() => {
        if (isMounted) setScans([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {

      isMounted = false;
    };
  }, [refreshTrigger]);

  const handleCardClick = async (scanId) => {
    if (openingScanId) return;
    setOpeningScanId(scanId);
    try {
      const fullScan = await getScanById(scanId);
      if (fullScan) {
        onOpenScan(fullScan);
      }
    } catch (err) {
      console.error('Failed to open scan:', err);
      setOpeningScanId(null);
    }
  };


  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <section className="recent-scans-section">
      <div className="recent-scans-header">
        <div className="recent-scans-title-group">
          <History size={18} className="recent-scans-icon" />
          <h3>Recent Scan History</h3>
          <span className="recent-scans-counter">
            {scans.length} {scans.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <button
          type="button"
          className="btn-refresh-scans"
          onClick={fetchScans}
          disabled={isLoading}
          title="Refresh recent scans list"
        >
          <RotateCw size={13} className={isLoading ? 'spin-fast' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading && scans.length === 0 ? (
        <div className="recent-scans-loading">
          <span className="recent-scans-loading-text">Loading previous analyses...</span>
        </div>
      ) : scans.length === 0 ? (
        <div className="recent-scans-empty">
          <p>No previous scans found in MongoDB.</p>
          <span>Submit a job listing above to save and view your first investigation report.</span>
        </div>
      ) : (
        <div className="recent-scans-grid">
          {scans.map((scan) => {
            const input = scan.input || {};
            const summary = scan.results?.summary || {};
            const assessmentKey = summary.assessment || 'MODERATE_RISK';
            const badge = ASSESSMENT_BADGES[assessmentKey] || ASSESSMENT_BADGES.MODERATE_RISK;
            const BadgeIcon = badge.icon;
            const isOpening = openingScanId === scan._id;

            const company = input.companyName || 'Target Employer';
            const title = input.jobTitle || 'Job Offer';

            return (
              <div
                key={scan._id}
                className={`recent-scan-card ${isOpening ? 'is-opening' : ''}`}
                onClick={() => handleCardClick(scan._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(scan._id);
                  }
                }}
              >
                <div className="recent-scan-top">
                  <span className={`badge ${badge.className}`}>
                    <BadgeIcon size={11} /> {badge.label}
                  </span>

                  <span className="recent-scan-date">
                    <Calendar size={11} /> {formatDate(scan.createdAt)}
                  </span>
                </div>

                <div className="recent-scan-body">
                  <h4 className="recent-scan-job" title={title}>
                    <Briefcase size={13} /> {title}
                  </h4>
                  <p className="recent-scan-company" title={company}>
                    <Building2 size={13} /> {company}
                  </p>
                </div>

                <div className="recent-scan-footer">
                  <span className="btn-open-scan-link">
                    {isOpening ? 'Opening Report...' : 'Open Report'}
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
