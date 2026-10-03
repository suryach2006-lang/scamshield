import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { checkHealth } from '../api/scamShieldApi';

export default function Header() {
  const [isOnline, setIsOnline] = useState(null);

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

      <div className="header-status" title={isOnline ? 'Connected to ScamShield Engine' : 'Checking connection'}>
        <span className={`status-dot ${isOnline ? 'online' : isOnline === false ? 'offline' : ''}`} />
        <span>{isOnline ? 'Engine Online' : isOnline === false ? 'Engine Offline' : 'Connecting...'}</span>
      </div>
    </header>
  );
}
