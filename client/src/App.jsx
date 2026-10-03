import React, { useState, useRef } from 'react';
import Header from './components/Header';
import JobForm from './components/JobForm';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorAlert from './components/ErrorAlert';
import SummaryCard from './components/SummaryCard';
import RiskIndicatorsSection from './components/RiskIndicatorsSection';
import WebEvidenceSection from './components/WebEvidenceSection';
import JobEvidenceSection from './components/JobEvidenceSection';
import NewsEvidenceSection from './components/NewsEvidenceSection';
import VerificationSignalsSection from './components/VerificationSignalsSection';
import RecommendationsCard from './components/RecommendationsCard';
import { analyzeJob } from './api/scamShieldApi';
import './App.css';

export default function App() {
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobUrl: '',
    jobDescription: '',
    salary: '',
    location: '',
    recruiterContact: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const resultsRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if at least one meaningful field is filled
    const hasInput = Object.values(formData).some((v) => typeof v === 'string' && v.trim().length > 0);
    if (!hasInput) {
      setError({
        message: 'Please provide at least a company name, job title, or job description to analyze.'
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await analyzeJob(formData);
      setResults(data);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />

      <section className="hero-banner">
        <h1>Verify Before You Trust</h1>
        <p>
          ScamShield inspects recruitment offers, verifies corporate identity via SerpApi search intelligence,
          and surfaces evidence-based warning indicators.
        </p>
      </section>

      <JobForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {isLoading && <LoadingIndicator />}

      <ErrorAlert error={error} onRetry={handleSubmit} />

      {/* Results Dashboard */}
      {results && (
        <main ref={resultsRef} className="results-dashboard" id="results">
          {/* 1. Overall Analysis Summary */}
          <SummaryCard
            summary={results.summary}
            input={results.input || results.userProvided}
            metadata={results.metadata}
          />

          {/* 2 & 3. Warning Indicators & Supporting Evidence */}
          <RiskIndicatorsSection
            indicators={results.riskIndicators || results.warningIndicators || []}
          />

          {/* 4, 5, 6, 7. SerpApi Multi-Engine Evidence & Source Links */}
          <section className="dashboard-section">
            <div className="section-title-wrap">
              <h3>SerpApi Search Intelligence Evidence</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Corroborated across Google Web, Google Jobs & Google News
              </span>
            </div>

            <div className="multi-evidence-grid">
              {/* 4. Company Web Verification */}
              <WebEvidenceSection webEvidence={results.webEvidence} />

              {/* 5. Google Jobs Search Evidence */}
              <JobEvidenceSection jobEvidence={results.jobEvidence} />

              {/* 6. Google News Search Evidence */}
              <NewsEvidenceSection newsEvidence={results.newsEvidence} />
            </div>
          </section>

          {/* 8. Verified & Missing Verification Information */}
          <VerificationSignalsSection
            verificationSignals={
              results.verificationSignals || {
                missingSignals: results.missingVerificationSignals || []
              }
            }
          />

          {/* Recommendations Card */}
          {results.summary?.recommendations && (
            <RecommendationsCard recommendations={results.summary.recommendations} />
          )}
        </main>
      )}
    </div>
  );
}
