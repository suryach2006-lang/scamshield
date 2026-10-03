import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function RecommendationsCard({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="recommendations-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontSize: '1.05rem', fontWeight: 700 }}>
        <ShieldCheck size={20} color="var(--primary)" />
        Recommended Candidate Actions
      </div>

      <ul className="recommendations-list">
        {recommendations.map((rec, index) => (
          <li key={index}>
            <span className="rec-bullet">&bull;</span>
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
