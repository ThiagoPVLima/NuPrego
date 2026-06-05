'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorker() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!installPrompt) return null;

  return (
    <button
      onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'linear-gradient(135deg, #494bd6, #8083ff)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 24px',
        fontWeight: 600,
        fontSize: '15px',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(73,75,214,0.4)',
        whiteSpace: 'nowrap',
      }}
    >
      Instalar app
    </button>
  );
}
