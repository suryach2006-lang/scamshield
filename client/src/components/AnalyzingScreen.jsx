import React, { useState, useEffect } from 'react';
import { Globe, Briefcase, Newspaper, ShieldAlert, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

const ANALYSIS_STAGES = [
  {
    id: 'web',
    title: 'Company Web Presence',
    description: 'Verifying official website, domain authenticity & Google Knowledge Graph',
    icon: Globe,
    targetPercent: 28
  },
  {
    id: 'jobs',
    title: 'Google Jobs Search',
    description: 'Corroborating active syndicated listings & employer post history',
    icon: Briefcase,
    targetPercent: 56
  },
  {
    id: 'news',
    title: 'News & Fraud Intelligence',
    description: 'Scanning public news reports, police FIRs & recruitment scam warnings',
    icon: Newspaper,
    targetPercent: 82
  },
  {
    id: 'rules',
    title: 'Evidence Synthesis & Risk Rules',
    description: 'Cross-referencing signals against deterministic recruitment warning rules',
    icon: ShieldAlert,
    targetPercent: 95
  }
];

export default function AnalyzingScreen({ formData, onCancel }) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  useEffect(() => {
    // Stage 1 starts immediately
    const stageTimers = [
      setTimeout(() => {
        setActiveStageIndex(1);
        setProgressPercent(42);
      }, 1800),
      setTimeout(() => {
        setActiveStageIndex(2);
        setProgressPercent(70);
      }, 3800),
      setTimeout(() => {
        setActiveStageIndex(3);
        setProgressPercent(90);
      }, 6200)
    ];

    // Smooth incremental progress ticker between stages
    const ticker = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 92) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    return () => {
      stageTimers.forEach(clearTimeout);
      clearInterval(ticker);
    };
  }, []);

  const jobTitle = formData?.jobTitle || 'Job Listing';
  const companyName = formData?.companyName || 'Target Employer';

  return (
    <div className="analyzing-container" role="status" aria-live="polite">
      <div className="analyzing-card">
        {/* Radar Icon & Header */}
        <div className="analyzing-header">
          <div className="analyzing-icon-pulse">
            <Loader2 size={32} className="spin-slow" />
          </div>
          <div className="analyzing-title-wrap">
            <h2>Investigating Recruitment Offer</h2>
            <p className="analyzing-target-info">
              Analyzing <span className="highlight-pill">{jobTitle}</span> at <strong className="highlight-company">{companyName}</strong>
            </p>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="progress-section">
          <div className="progress-label-row">
            <span className="progress-status-text">
              {ANALYSIS_STAGES[activeStageIndex]?.title}...
            </span>
            <span className="progress-percentage">{Math.min(progressPercent, 95)}%</span>
          </div>

          <div className="progress-track" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent} role="progressbar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sequence of Analysis Stages */}
        <div className="analyzing-stages-list">
          {ANALYSIS_STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const isCompleted = index < activeStageIndex;
            const isActive = index === activeStageIndex;
            const isPending = index > activeStageIndex;

            return (
              <div
                key={stage.id}
                className={`analyzing-stage-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
              >
                <div className="stage-status-indicator">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="stage-icon-done" />
                  ) : isActive ? (
                    <div className="stage-spinner-wrap">
                      <Loader2 size={16} className="spin-fast" />
                    </div>
                  ) : (
                    <div className="stage-dot-pending" />
                  )}
                </div>

                <div className="stage-content">
                  <div className="stage-title-row">
                    <span className="stage-title">
                      <StageIcon size={14} className="stage-title-icon" />
                      {stage.title}
                    </span>
                    {isCompleted && <span className="stage-tag-done">Corroborated</span>}
                    {isActive && <span className="stage-tag-active">Investigating</span>}
                  </div>
                  <p className="stage-desc">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note & Cancel Option */}
        <div className="analyzing-footer">
          <span className="analyzing-note">
            Corroborating search intelligence via SerpApi. Never relies on arbitrary percentages.
          </span>
          {onCancel && (
            <button
              type="button"
              className="btn-secondary btn-cancel-analysis"
              onClick={onCancel}
              title="Return to form"
            >
              <ArrowLeft size={13} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
