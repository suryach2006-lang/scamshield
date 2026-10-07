import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function RecommendationsCard({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="recommendations-card">
      <div className="recommendations-title">
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
