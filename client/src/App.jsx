import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import JobForm from './components/JobForm';
import AnalyzingScreen from './components/AnalyzingScreen';
import ResultsView from './components/ResultsView';
import RecentScans from './components/RecentScans';
import ErrorAlert from './components/ErrorAlert';
import { analyzeJob, saveScan } from './api/scamShieldApi';
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

  // Flow State: 'form' | 'analyzing' | 'results'
  const [currentView, setCurrentView] = useState('form');
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.view === 'results' && results) {
        setCurrentView('results');
      } else {
        setCurrentView('form');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [results]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Check if at least one meaningful field is filled
    const hasInput = Object.values(formData).some(
      (v) => typeof v === 'string' && v.trim().length > 0
    );

    if (!hasInput) {
      setError({
        message: 'Please provide at least a company name, job title, or job description to analyze.'
      });
      return;
    }

    // 1. Transition into the dedicated ANALYZING state
    setCurrentView('analyzing');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // 2. Perform live threat intelligence analysis
      const data = await analyzeJob(formData);

      // 3. Persist analysis to MongoDB (Analyze -> Save -> Retrieve -> Display flow)
      try {
        const saved = await saveScan({
          input: formData,
          results: data
        });
        if (saved && saved._id) {
          data.metadata = { ...(data.metadata || {}), scanId: saved._id };
        }
        setRefreshTrigger((prev) => prev + 1);
      } catch (saveErr) {
        console.warn('[ScamShield] Scan auto-save note:', saveErr.message);
      }

      setResults(data);

      // 4. Transition into the dedicated RESULTS VIEW
      setCurrentView('results');
      window.history.pushState({ view: 'results' }, '', '#results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err);
      // Return to form so user can inspect error and retry
      setCurrentView('form');
    }
  };

  const handleOpenPreviousScan = (scanDoc) => {
    const rawResults = scanDoc.results || {};
    const fullResults = {
      ...rawResults,
      input: scanDoc.input || rawResults.input || {},
      metadata: {
        ...(rawResults.metadata || {}),
        scanId: scanDoc._id,
        analyzedAt: scanDoc.createdAt || rawResults.metadata?.analyzedAt
      }
    };

    if (scanDoc.input) {
      setFormData(scanDoc.input);
    }

    setResults(fullResults);
    setCurrentView('results');
    window.history.pushState({ view: 'results' }, '', '#results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewAnalysis = () => {
    setCurrentView('form');
    if (window.location.hash === '#results') {
      window.history.pushState({ view: 'form' }, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelAnalysis = () => {
    setCurrentView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Header />

      {/* STATE 1: JOB INSPECTION FORM & RECENT SCANS */}
      {currentView === 'form' && (
        <>
          <section className="hero-banner">
            <h1>Verify Before You Trust</h1>
            <p>
              ScamShield inspects recruitment offers, verifies corporate identity via SerpApi search intelligence,
              and surfaces evidence-based warning indicators.
            </p>
          </section>

          <ErrorAlert error={error} onRetry={handleSubmit} />

          <JobForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isLoading={false}
          />

          <RecentScans
            onOpenScan={handleOpenPreviousScan}
            refreshTrigger={refreshTrigger}
          />
        </>
      )}

      {/* STATE 2: DEDICATED ANALYZING SCREEN */}
      {currentView === 'analyzing' && (
        <AnalyzingScreen
          formData={formData}
          onCancel={handleCancelAnalysis}
        />
      )}

      {/* STATE 3: DEDICATED RESULTS VIEW */}
      {currentView === 'results' && results && (
        <ResultsView
          results={results}
          onNewAnalysis={handleNewAnalysis}
        />
      )}
    </div>
  );
}
