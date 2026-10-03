import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className="error-box" role="alert">
      <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <strong>Analysis Failed</strong>
        <p style={{ margin: '0.2rem 0 0.5rem 0', fontSize: '0.9rem' }}>
          {error.message || 'An unexpected error occurred during listing inspection.'}
        </p>
        {error.code && (
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
            Error Code: {error.code}
          </span>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn-secondary"
          onClick={onRetry}
          style={{ borderColor: 'var(--risk-critical-border)', color: 'var(--risk-critical)', backgroundColor: 'var(--bg-surface)' }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
