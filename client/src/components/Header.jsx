import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
import { checkHealth } from '../api/scamShieldApi';

export default function Header() {
  const [isOnline, setIsOnline] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('scamshield_theme') || 'dark';
  });

  useEffect(() => {
    // Apply theme attribute to root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('scamshield_theme', theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    checkHealth().then((status) => {
      if (mounted) {
        setIsOnline(status.online);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="app-header">
      <div className="brand-group">
        <div className="brand-icon-wrap" aria-hidden="true">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="brand-title">SCAMSHIELD</h1>
          <p className="brand-tagline">Verify before you trust.</p>
        </div>
      </div>

      <div className="header-controls">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="header-status" title={isOnline ? 'Connected to ScamShield Engine' : 'Checking connection'}>
          <span className={`status-dot ${isOnline ? 'online' : isOnline === false ? 'offline' : ''}`} />
          <span>{isOnline ? 'Engine Online' : isOnline === false ? 'Engine Offline' : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}

